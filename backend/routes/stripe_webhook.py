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


async def _handle_checkout_completed(event: Dict[str, Any]) -> None:
    """
    Activates premium subscription when checkout completes.
    """
    session = event.get("data", {}).get("object", {})
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    client_reference_id = session.get("client_reference_id")  # user_id passed from frontend

    if not subscription_id:
        logger.error("checkout.session.completed missing subscription_id")
        return

    # Use client_reference_id if available, otherwise fall back to email lookup
    user_id = client_reference_id or session.get("customer_email")

    # Retrieve full subscription details from Stripe
    sub = stripe.Subscription.retrieve(subscription_id)

    # Determine plan type from price
    price_id = sub.get("items", {}).get("data", [{}])[0].get("price", {}).get("id")
    interval = (
        sub.get("items", {})
        .get("data", [{}])[0]
        .get("price", {})
        .get("recurring", {})
        .get("interval", "month")
    )
    plan_type = "premium_monthly" if interval == "month" else "premium_annual"

    # Calculate period dates
    current_period_start = datetime.fromtimestamp(sub.get("current_period_start"), tz=timezone.utc)
    current_period_end = datetime.fromtimestamp(sub.get("current_period_end"), tz=timezone.utc)

    # Check if trial
    is_trial = sub.get("trial_end") is not None
    trial_end = datetime.fromtimestamp(sub.get("trial_end"), tz=timezone.utc) if is_trial else None

    # Build subscription record
    subscription_record = {
        "stripe_customer_id": customer_id,
        "stripe_subscription_id": subscription_id,
        "stripe_price_id": price_id,
        "status": _map_stripe_status(sub.get("status")),
        "plan_type": plan_type,
        "is_trial": is_trial,
        "trial_end": trial_end.isoformat() if trial_end else None,
        "current_period_start": current_period_start.isoformat(),
        "current_period_end": current_period_end.isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Find existing subscription by stripe_subscription_id or user_id
    existing = (
        supabase.table("subscriptions")
        .select("id, user_id")
        .eq("stripe_subscription_id", subscription_id)
        .execute()
    )

    if existing.data:
        # Update existing subscription
        supabase.table("subscriptions").update(subscription_record).eq(
            "id", existing.data[0]["id"]
        ).execute()
        user_id = existing.data[0].get("user_id") or user_id
        logger.info(f"Updated subscription {subscription_id} for user {user_id}")
    else:
        # Need user_id - look up by customer_id or use the passed reference
        if not user_id:
            # Try to find by stripe customer id in users table or previous subs
            customer_sub = (
                supabase.table("subscriptions")
                .select("user_id")
                .eq("stripe_customer_id", customer_id)
                .execute()
            )
            if customer_sub.data:
                user_id = customer_sub.data[0].get("user_id")

        if not user_id:
            logger.warning(f"Cannot determine user_id for subscription {subscription_id}")
            # Still create the subscription record but with null user_id
            user_id = None

        subscription_record["user_id"] = user_id
        subscription_record["created_at"] = datetime.now(timezone.utc).isoformat()
        subscription_record["started_at"] = current_period_start.isoformat()

        supabase.table("subscriptions").insert(subscription_record).execute()
        logger.info(f"Created subscription {subscription_id} for user {user_id}")

    # Update payment transaction if exists
    session_id = session.get("id")
    if session_id:
        supabase.table("payment_transactions").update(
            {
                "payment_status": "paid",
                "status": "completed",
                "subscription_id": subscription_id,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("session_id", session_id).execute()


async def _handle_subscription_updated(event: Dict[str, Any]) -> None:
    """
    Syncs subscription status changes (plan changes, renewals, etc.).
    """
    sub = event.get("data", {}).get("object", {})
    subscription_id = sub.get("id")
    status = sub.get("status")
    customer_id = sub.get("customer")

    if not subscription_id:
        return

    # Get price and interval
    price_id = sub.get("items", {}).get("data", [{}])[0].get("price", {}).get("id")
    interval = (
        sub.get("items", {})
        .get("data", [{}])[0]
        .get("price", {})
        .get("recurring", {})
        .get("interval", "month")
    )
    plan_type = "premium_monthly" if interval == "month" else "premium_annual"

    current_period_start = datetime.fromtimestamp(sub.get("current_period_start"), tz=timezone.utc)
    current_period_end = datetime.fromtimestamp(sub.get("current_period_end"), tz=timezone.utc)

    is_trial = sub.get("trial_end") is not None and datetime.fromtimestamp(
        sub.get("trial_end"), tz=timezone.utc
    ) > datetime.now(timezone.utc)
    trial_end = datetime.fromtimestamp(sub.get("trial_end"), tz=timezone.utc) if is_trial else None

    update_data = {
        "stripe_price_id": price_id,
        "status": _map_stripe_status(status),
        "plan_type": plan_type,
        "is_trial": is_trial,
        "trial_end": trial_end.isoformat() if trial_end else None,
        "current_period_start": current_period_start.isoformat(),
        "current_period_end": current_period_end.isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    # If cancelled or expired, set ends_at
    if status in ("canceled", "expired"):
        update_data["ended_at"] = datetime.fromtimestamp(
            sub.get("ended_at", sub.get("current_period_end")), tz=timezone.utc
        ).isoformat()

    result = (
        supabase.table("subscriptions")
        .update(update_data)
        .eq("stripe_subscription_id", subscription_id)
        .execute()
    )

    if result.data:
        logger.info(f"Updated subscription {subscription_id}: status={status}")
    else:
        logger.warning(f"subscription.updated but no local record found for {subscription_id}")


async def _handle_subscription_deleted(event: Dict[str, Any]) -> None:
    """
    Deactivates subscription on cancellation.
    """
    sub = event.get("data", {}).get("object", {})
    subscription_id = sub.get("id")

    if not subscription_id:
        return

    now = datetime.now(timezone.utc).isoformat()

    update_data = {"status": "canceled", "ended_at": now, "canceled_at": now, "updated_at": now}

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
    """
    Extends subscription period on successful recurring payment.
    """
    invoice = event.get("data", {}).get("object", {})
    subscription_id = invoice.get("subscription")
    customer_id = invoice.get("customer")

    if not subscription_id:
        # One-time payment, not a subscription renewal
        return

    # Get period dates from the subscription
    try:
        sub = stripe.Subscription.retrieve(subscription_id)
        current_period_start = datetime.fromtimestamp(
            sub.get("current_period_start"), tz=timezone.utc
        )
        current_period_end = datetime.fromtimestamp(sub.get("current_period_end"), tz=timezone.utc)
    except Exception as e:
        logger.error(f"Failed to retrieve subscription {subscription_id}: {e}")
        return

    update_data = {
        "status": "active",
        "current_period_start": current_period_start.isoformat(),
        "current_period_end": current_period_end.isoformat(),
        "last_payment_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    result = (
        supabase.table("subscriptions")
        .update(update_data)
        .eq("stripe_subscription_id", subscription_id)
        .execute()
    )

    if result.data:
        logger.info(
            f"Extended subscription {subscription_id} until {current_period_end.isoformat()}"
        )
    else:
        logger.warning(f"invoice.payment_succeeded but no local record for {subscription_id}")


async def _handle_invoice_payment_failed(event: Dict[str, Any]) -> None:
    """
    Flags payment failure for dunning (retry logic handled by Stripe).
    """
    invoice = event.get("data", {}).get("object", {})
    subscription_id = invoice.get("subscription")
    customer_id = invoice.get("customer")
    amount_due = invoice.get("amount_due", 0)
    attempt_count = invoice.get("attempt_count", 1)

    if not subscription_id:
        return

    now = datetime.now(timezone.utc).isoformat()

    # Mark subscription as past_due
    update_data = {
        "status": "past_due",
        "payment_failed_at": now,
        "payment_attempts": attempt_count,
        "amount_last_failed": amount_due / 100,  # Convert from cents
        "updated_at": now,
    }

    result = (
        supabase.table("subscriptions")
        .update(update_data)
        .eq("stripe_subscription_id", subscription_id)
        .execute()
    )

    if result.data:
        logger.warning(
            f"Payment failed for subscription {subscription_id}, amount=${amount_due/100}, attempt={attempt_count}"
        )
    else:
        logger.warning(f"invoice.payment_failed but no local record for {subscription_id}")

    # Also log the failed payment event
    try:
        supabase.table("payment_failures").insert(
            {
                "stripe_subscription_id": subscription_id,
                "stripe_customer_id": customer_id,
                "invoice_id": invoice.get("id"),
                "amount_due": amount_due / 100,
                "currency": invoice.get("currency", "usd"),
                "attempt_count": attempt_count,
                "created_at": now,
            }
        ).execute()
    except Exception as e:
        logger.error(f"Failed to log payment failure: {e}")


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
