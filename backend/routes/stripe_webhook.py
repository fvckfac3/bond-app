"""
Stripe Webhook Handler for BOND App
Handles subscription lifecycle events from Stripe
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import logging
import os

import stripe
from supabase import create_client, Client

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

logger = logging.getLogger(__name__)

# Environment
STRIPE_SECRET_KEY = os.environ.get("STRIPE_API_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Stripe client
stripe.api_key = STRIPE_SECRET_KEY


# Idempotency lives in the `webhook_events` table (event_id is UNIQUE): an event is
# "claimed" by inserting its row before any handler runs, so duplicates are
# rejected by Postgres even across process restarts / serverless invocations.
PG_UNIQUE_VIOLATION = "23505"


def _is_unique_violation(exc: Exception) -> bool:
    return (
        getattr(exc, "code", None) == PG_UNIQUE_VIOLATION
        or PG_UNIQUE_VIOLATION in str(exc)
        or "duplicate key" in str(exc).lower()
    )


def _claim_event(event: Dict[str, Any]) -> bool:
    """Record the event; return False if it was already claimed by an earlier delivery."""
    obj = event.get("data", {}).get("object", {})
    try:
        supabase.table("webhook_events").insert(
            {
                "event_id": event.get("id"),
                "event_type": event.get("type"),
                "session_id": (
                    obj.get("id") if event.get("type", "").startswith("checkout.") else None
                ),
                "metadata": obj,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        ).execute()
        return True
    except Exception as e:
        if _is_unique_violation(e):
            return False
        raise


def _release_event(event_id: str) -> None:
    """Un-claim an event whose handler failed, so a later redelivery can reprocess it."""
    try:
        supabase.table("webhook_events").delete().eq("event_id", event_id).execute()
    except Exception as e:
        logger.error(f"Failed to release webhook event {event_id}: {e}")


# ---- Webhook Handler ----


@router.post("/stripe")
async def handle_stripe_webhook(request: Request):
    """
    Main webhook endpoint. Verifies signature and dispatches to handlers.
    """
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")

    if not signature:
        logger.warning("Missing Stripe signature in webhook request")
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    if not STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    # Verify and parse the event
    try:
        event = stripe.Webhook.construct_event(body, signature, STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Signature verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Failed to parse webhook payload: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid payload: {str(e)}")

    event = _to_dict(event)

    # Idempotency: claim the event in Supabase before doing any work. A failure
    # here (DB unavailable) is a 500 so Stripe retries the delivery.
    event_id = event.get("id")
    try:
        claimed = _claim_event(event)
    except Exception as e:
        logger.error(f"Failed to record webhook event {event_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not record webhook event")
    if not claimed:
        logger.info(f"Event {event_id} already processed, skipping")
        return {"received": True, "skipped": "already_processed"}

    event_type = event.get("type", "")
    logger.info(f"Processing Stripe webhook: {event_type} ({event_id})")

    try:
        # Dispatch to appropriate handler
        if event_type == "checkout.session.completed":
            await _handle_checkout_completed(event)
        elif event_type == "customer.subscription.updated":
            await _handle_subscription_updated(event)
        elif event_type == "customer.subscription.deleted":
            await _handle_subscription_deleted(event)
        elif event_type == "invoice.payment_succeeded":
            await _handle_invoice_payment_succeeded(event)
        elif event_type == "invoice.payment_failed":
            await _handle_invoice_payment_failed(event)
        else:
            logger.info(f"Unhandled event type: {event_type}")

        return {"received": True, "processed": event_type}

    except Exception as e:
        logger.error(f"Error processing {event_type}: {str(e)}", exc_info=True)
        _release_event(event_id)
        # Return 200 to prevent Stripe retries for application errors
        # Log for investigation but acknowledge receipt
        return {"received": True, "error": str(e)}


# ---- Event Handlers ----


def _to_dict(obj) -> Dict[str, Any]:
    """Recent stripe SDKs return StripeObjects that are not dicts (no .get()); handlers use dicts."""
    return obj.to_dict() if hasattr(obj, "to_dict") else obj


PLAN_BY_INTERVAL = {
    "month": ("premium_monthly", "Premium Monthly"),
    "year": ("premium_annual", "Premium Annual"),
}


def _iso(ts) -> Optional[str]:
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts else None


def _price_interval(sub: Dict[str, Any]) -> str:
    items = sub.get("items", {}).get("data", [{}])
    return items[0].get("price", {}).get("recurring", {}).get("interval", "month")


async def _handle_checkout_completed(event: Dict[str, Any]) -> None:
    """
    Activates premium when checkout completes. Writes the `subscriptions` columns defined
    in supabase/bond_schema.sql; who the subscription belongs to comes from OUR
    payment_transactions row for this checkout session (server-side truth), not from
    anything the client could influence.
    """
    session = event.get("data", {}).get("object", {})
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    session_id = session.get("id")

    if not subscription_id:
        logger.error("checkout.session.completed missing subscription_id")
        return

    txn = None
    if session_id:
        rows = (
            supabase.table("payment_transactions")
            .select("*")
            .eq("session_id", session_id)
            .execute()
        )
        txn = rows.data[0] if rows.data else None

    user_id = (txn or {}).get("user_id")
    if not user_id or user_id == "anonymous":
        user_id = (session.get("metadata") or {}).get("user_id") or session.get(
            "client_reference_id"
        )
    if user_id == "anonymous":
        user_id = None

    sub = _to_dict(stripe.Subscription.retrieve(subscription_id))
    interval = _price_interval(sub)
    package_id, package_name = PLAN_BY_INTERVAL.get(interval, PLAN_BY_INTERVAL["month"])
    package_id = (txn or {}).get("package_id") or package_id
    package_name = (txn or {}).get("package_name") or package_name
    now_iso = datetime.now(timezone.utc).isoformat()

    fields = {
        "package_id": package_id,
        "package_name": package_name,
        "status": _map_stripe_status(sub.get("status")),
        "is_trial": sub.get("trial_end") is not None,
        "trial_ends_at": _iso(sub.get("trial_end")),
        "expires_at": _iso(sub.get("current_period_end")),
        "interval": interval,
        "stripe_customer_id": customer_id,
        "stripe_subscription_id": subscription_id,
        "updated_at": now_iso,
    }

    # Idempotent: the same subscription may already be recorded by this webhook (retried) or by
    # the checkout-status poll (matched on session_id) — update it rather than add a second row.
    existing = (
        supabase.table("subscriptions")
        .select("id, user_id")
        .eq("stripe_subscription_id", subscription_id)
        .execute()
    )
    if not existing.data and session_id:
        existing = (
            supabase.table("subscriptions")
            .select("id, user_id")
            .eq("session_id", session_id)
            .execute()
        )

    if existing.data:
        row = existing.data[0]
        if not row.get("user_id") and user_id:
            fields["user_id"] = user_id
        supabase.table("subscriptions").update(fields).eq("id", row["id"]).execute()
        logger.info(
            f"Updated subscription {subscription_id} for user {row.get('user_id') or user_id}"
        )
    else:
        if not user_id:
            logger.warning(f"Cannot determine user_id for subscription {subscription_id}")
        supabase.table("subscriptions").insert(
            {
                **fields,
                "user_id": user_id,
                "started_at": _iso(sub.get("current_period_start")) or now_iso,
                "amount_paid": (txn or {}).get("amount") or 0,
                # session_id is a FK to payment_transactions — only set it when that row exists
                "session_id": session_id if txn else None,
                "created_at": now_iso,
            }
        ).execute()
        logger.info(f"Created subscription {subscription_id} for user {user_id}")

    if txn:
        supabase.table("payment_transactions").update(
            {
                "payment_status": "paid",
                "status": "completed",
                "subscription_created": True,
                "updated_at": now_iso,
            }
        ).eq("session_id", session_id).execute()


async def _handle_subscription_updated(event: Dict[str, Any]) -> None:
    """Syncs plan/status/period changes (renewals, plan changes, cancellations)."""
    sub = event.get("data", {}).get("object", {})
    subscription_id = sub.get("id")
    if not subscription_id:
        return

    interval = _price_interval(sub)
    package_id, package_name = PLAN_BY_INTERVAL.get(interval, PLAN_BY_INTERVAL["month"])
    trial_end = sub.get("trial_end")
    is_trial = trial_end is not None and datetime.fromtimestamp(
        trial_end, tz=timezone.utc
    ) > datetime.now(timezone.utc)

    update_data = {
        "package_id": package_id,
        "package_name": package_name,
        "status": _map_stripe_status(sub.get("status")),
        "is_trial": is_trial,
        "trial_ends_at": _iso(trial_end) if is_trial else None,
        "expires_at": _iso(sub.get("current_period_end")),
        "interval": interval,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    result = (
        supabase.table("subscriptions")
        .update(update_data)
        .eq("stripe_subscription_id", subscription_id)
        .execute()
    )
    if result.data:
        logger.info(f"Updated subscription {subscription_id}: status={sub.get('status')}")
    else:
        logger.warning(f"subscription.updated but no local record found for {subscription_id}")


async def _handle_subscription_deleted(event: Dict[str, Any]) -> None:
    """Deactivates the subscription on cancellation."""
    sub = event.get("data", {}).get("object", {})
    subscription_id = sub.get("id")
    if not subscription_id:
        return

    update_data = {"status": "canceled", "updated_at": datetime.now(timezone.utc).isoformat()}
    result = (
        supabase.table("subscriptions")
        .update(update_data)
        .eq("stripe_subscription_id", subscription_id)
        .execute()
    )
    if result.data:
        logger.info(f"Cancelled subscription {subscription_id}")
    else:
        logger.warning(f"subscription.deleted but no local record for {subscription_id}")


async def _handle_invoice_payment_succeeded(event: Dict[str, Any]) -> None:
    """Extends the subscription period on a successful recurring payment."""
    invoice = event.get("data", {}).get("object", {})
    subscription_id = invoice.get("subscription")
    if not subscription_id:
        return  # one-time payment, not a subscription renewal

    try:
        sub = _to_dict(stripe.Subscription.retrieve(subscription_id))
        period_end = sub.get("current_period_end")
    except Exception as e:
        logger.error(f"Failed to retrieve subscription {subscription_id}: {e}")
        return

    update_data = {
        "status": "active",
        "expires_at": _iso(period_end),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    result = (
        supabase.table("subscriptions")
        .update(update_data)
        .eq("stripe_subscription_id", subscription_id)
        .execute()
    )
    if result.data:
        logger.info(f"Extended subscription {subscription_id} until {update_data['expires_at']}")
    else:
        logger.warning(f"invoice.payment_succeeded but no local record for {subscription_id}")


async def _handle_invoice_payment_failed(event: Dict[str, Any]) -> None:
    """Marks the subscription past_due (Stripe handles the retry/dunning schedule)."""
    invoice = event.get("data", {}).get("object", {})
    subscription_id = invoice.get("subscription")
    if not subscription_id:
        return

    update_data = {"status": "past_due", "updated_at": datetime.now(timezone.utc).isoformat()}
    result = (
        supabase.table("subscriptions")
        .update(update_data)
        .eq("stripe_subscription_id", subscription_id)
        .execute()
    )

    logger.warning(
        f"Payment failed for subscription {subscription_id}, "
        f"amount=${invoice.get('amount_due', 0) / 100}, attempt={invoice.get('attempt_count', 1)}"
        + ("" if result.data else " (no local record)")
    )


# ---- Helpers ----


def _map_stripe_status(status: str) -> str:
    """Map Stripe subscription status to our status enum."""
    mapping = {
        "active": "active",
        "past_due": "past_due",
        "canceled": "canceled",
        "incomplete": "incomplete",
        "incomplete_expired": "expired",
        "unpaid": "unpaid",
        "trialing": "active",  # Treat trial as active
        "paused": "paused",
    }
    return mapping.get(status, status)
