from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime, timezone
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest,
)
import os
from supabase import create_client, Client
import stripe
import logging

from services.ai_usage import FREE_AI_INSIGHTS_PER_MONTH, insights_used_this_month

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["payments"])

# Supabase connection
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Stripe API Key
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")

# Subscription packages (FIXED - never from frontend)
SUBSCRIPTION_PACKAGES = {
    "premium_monthly": {
        "name": "Premium Monthly",
        "amount": 14.99,
        "currency": "usd",
        "interval": "month",
        "trial_days": 7,
        "features": [
            "Unlimited assessments",
            "Full AI insights",
            "All activities",
            "Priority support",
            "Advanced analytics",
        ],
    },
    "premium_annual": {
        "name": "Premium Annual",
        "amount": 99.99,
        "currency": "usd",
        "interval": "year",
        "trial_days": 7,
        "features": [
            "Unlimited assessments",
            "Full AI insights",
            "All activities",
            "Priority support",
            "Advanced analytics",
            "Exclusive content",
            "Save 44% vs monthly",
        ],
    },
}


# Request/Response Models
class CheckoutRequest(BaseModel):
    package_id: str = Field(..., description="Subscription package ID")
    origin_url: str = Field(..., description="Frontend origin URL")


class PackageInfo(BaseModel):
    id: str
    name: str
    amount: float
    currency: str
    interval: str
    trial_days: int
    features: List[str]


class SubscriptionStatus(BaseModel):
    is_premium: bool
    plan: Optional[str] = None
    expires_at: Optional[str] = None
    is_trial: bool = False
    trial_ends_at: Optional[str] = None
    usage: Dict = {}


# Helper function to get Stripe checkout instance
def get_stripe_checkout(origin_url: str) -> StripeCheckout:
    """Get a StripeCheckout instance configured for the given origin."""
    webhook_url = f"{origin_url}/api/webhooks/stripe"
    return StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)


def _get_stripe_client():
    """Get a raw Stripe client for direct API calls."""
    stripe.api_key = STRIPE_API_KEY
    return stripe


async def create_checkout_session(user_id: str, price_id: str, origin_url: str) -> Dict[str, Any]:
    """
    Create a Stripe Checkout session for subscription purchase.

    Args:
        user_id: The user's ID in our system
        price_id: Stripe Price ID for the subscription tier
        origin_url: Frontend origin for building success/cancel URLs

    Returns:
        Dict with 'url' (checkout URL) and 'session_id'
    """
    stripe_lib = stripe
    stripe_lib.api_key = STRIPE_API_KEY

    # Determine package from price_id or look up
    package_id = _get_package_id_from_price(price_id)
    package = SUBSCRIPTION_PACKAGES.get(package_id, {})

    success_url = f"{origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/subscription/cancel"

    metadata = {
        "user_id": user_id,
        "package_id": package_id or "unknown",
        "price_id": price_id,
    }

    try:
        session = stripe_lib.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            customer_email=None,  # Let Stripe use existing customer or prompt
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
            allow_promotion_codes=True,
            subscription_data={
                "trial_period_days": package.get("trial_days", 7),
                "metadata": metadata,
            },
        )

        # Create pending transaction
        transaction = {
            "session_id": session.id,
            "user_id": user_id,
            "package_id": package_id or "unknown",
            "package_name": package.get("name"),
            "amount": package.get("amount", 0),
            "currency": package.get("currency", "usd"),
            "interval": package.get("interval", "month"),
            "trial_days": package.get("trial_days", 7),
            "payment_status": "pending",
            "status": "initiated",
            "metadata": metadata,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        supabase.table("payment_transactions").insert(transaction).execute()

        logger.info(f"Created checkout session {session.id} for user {user_id}")

        return {"url": session.url, "session_id": session.id}

    except Exception as e:
        logger.error(f"Failed to create checkout session: {e}")
        raise


async def create_customer_portal_session(
    stripe_customer_id: str, origin_url: str
) -> Dict[str, Any]:
    """
    Create a Stripe Customer Portal session for subscription management.

    Args:
        stripe_customer_id: The Stripe customer ID
        origin_url: Frontend origin for return URL

    Returns:
        Dict with 'url' (portal session URL)
    """
    stripe_lib = stripe
    stripe_lib.api_key = STRIPE_API_KEY

    try:
        session = stripe_lib.billing_portal.Session.create(
            customer=stripe_customer_id, return_url=f"{origin_url}/subscription/manage"
        )

        logger.info(f"Created portal session for customer {stripe_customer_id}")

        return {"url": session.url}

    except Exception as e:
        logger.error(f"Failed to create portal session: {e}")
        raise


async def get_subscription_status(user_id: str) -> Dict[str, Any]:
    """
    Get current subscription state for a user.

    Args:
        user_id: The user's ID in our system

    Returns:
        Dict with subscription details including:
        - is_premium: bool
        - status: str (active, past_due, canceled, none)
        - plan_type: str or None
        - current_period_end: str or None
        - is_trial: bool
        - trial_end: str or None
        - stripe_customer_id: str or None
    """
    # Get active subscription from Supabase
    response = supabase.table("subscriptions").select("*").eq("user_id", user_id).execute()

    if not response.data:
        return {
            "is_premium": False,
            "status": "none",
            "plan_type": None,
            "current_period_end": None,
            "is_trial": False,
            "trial_end": None,
            "stripe_customer_id": None,
        }

    sub = response.data[0]
    now = datetime.now(timezone.utc)

    # Check if expired
    current_period_end = sub.get("current_period_end")
    is_expired = False
    if current_period_end:
        try:
            end_date = datetime.fromisoformat(current_period_end.replace("Z", "+00:00"))
            is_expired = now > end_date
        except (ValueError, AttributeError):
            is_expired = False

    # Check if in trial
    trial_end = sub.get("trial_end")
    is_trial = False
    if trial_end:
        try:
            trial_end_date = datetime.fromisoformat(trial_end.replace("Z", "+00:00"))
            is_trial = now < trial_end_date
        except (ValueError, AttributeError):
            is_trial = False

    # Determine effective status
    status = sub.get("status", "unknown")
    if is_expired and status not in ("canceled", "past_due"):
        status = "expired"

    is_premium = status in ("active", "trialing") and not is_expired

    return {
        "is_premium": is_premium,
        "status": status,
        "plan_type": sub.get("plan_type"),
        "current_period_end": current_period_end,
        "is_trial": is_trial,
        "trial_end": trial_end,
        "stripe_customer_id": sub.get("stripe_customer_id"),
        "stripe_subscription_id": sub.get("stripe_subscription_id"),
        "created_at": sub.get("created_at"),
        "updated_at": sub.get("updated_at"),
    }


def _get_package_id_from_price(price_id: str) -> Optional[str]:
    """Look up package ID from Stripe price ID using metadata."""
    # In production you'd store price->package mapping in env or DB
    # For now, we can check against our known prices
    for pkg_id, pkg in SUBSCRIPTION_PACKAGES.items():
        # You might store Stripe price IDs in the package config
        # For now return None and let caller handle
        pass
    return None  # Caller should pass explicit package_id when known


# Endpoint: Get available subscription packages
@router.get("/subscription/packages")
async def get_packages() -> List[PackageInfo]:
    """Get all available subscription packages"""
    return [
        PackageInfo(
            id=pkg_id,
            name=pkg["name"],
            amount=pkg["amount"],
            currency=pkg["currency"],
            interval=pkg["interval"],
            trial_days=pkg["trial_days"],
            features=pkg["features"],
        )
        for pkg_id, pkg in SUBSCRIPTION_PACKAGES.items()
    ]


# Endpoint: Create checkout session
@router.post("/subscription/checkout")
async def create_checkout_session(
    request: CheckoutRequest, user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """Create a Stripe checkout session for subscription"""

    # Validate package
    if request.package_id not in SUBSCRIPTION_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package ID")

    package = SUBSCRIPTION_PACKAGES[request.package_id]

    # Get amount from SERVER-SIDE definition only (NEVER from frontend)
    amount = package["amount"]
    currency = package["currency"]

    # Build dynamic success/cancel URLs from frontend origin
    success_url = f"{request.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/subscription/cancel"

    # Metadata to track subscription
    metadata = {
        "package_id": request.package_id,
        "package_name": package["name"],
        "interval": package["interval"],
        "trial_days": str(package["trial_days"]),
        "user_id": user_id or "anonymous",
    }

    try:
        # Initialize Stripe checkout
        stripe_checkout = get_stripe_checkout(request.origin_url)

        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency=currency,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
        )

        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(
            checkout_request
        )

        # Create PENDING transaction record in Supabase
        transaction = {
            "session_id": session.session_id,
            "user_id": user_id or "anonymous",
            "package_id": request.package_id,
            "package_name": package["name"],
            "amount": amount,
            "currency": currency,
            "interval": package["interval"],
            "trial_days": package["trial_days"],
            "payment_status": "pending",
            "status": "initiated",
            "metadata": metadata,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        supabase.table("payment_transactions").insert(transaction).execute()

        return {"url": session.url, "session_id": session.session_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


# Endpoint: Check payment status (for polling)
@router.get("/subscription/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    """Get checkout session status (called by frontend polling)"""

    try:
        # Get origin for Stripe instance
        origin = request.headers.get("origin") or request.headers.get("referer", "").rstrip("/")

        # Get transaction from Supabase
        response = (
            supabase.table("payment_transactions")
            .select("*")
            .eq("session_id", session_id)
            .execute()
        )

        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")

        transaction = response.data[0]

        # If already completed, return cached status
        if transaction.get("payment_status") == "paid":
            return {"status": "complete", "payment_status": "paid", "subscription_created": True}

        # Check status with Stripe
        stripe_checkout = get_stripe_checkout(origin)
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(
            session_id
        )

        # Update transaction
        update_data = {
            "payment_status": checkout_status.payment_status,
            "status": checkout_status.status,
            "currency": checkout_status.currency,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        # If payment successful and NOT already processed
        if (
            checkout_status.payment_status == "paid"
            and transaction.get("subscription_created") != True
        ):
            # Create subscription record
            user_id = transaction.get("user_id")
            package_id = transaction.get("package_id")
            package = SUBSCRIPTION_PACKAGES.get(package_id, {})

            trial_days = package.get("trial_days", 7)
            interval = package.get("interval", "month")

            # Calculate expiry
            from dateutil.relativedelta import relativedelta

            now = datetime.now(timezone.utc)
            trial_ends = now + relativedelta(days=trial_days)

            if interval == "month":
                expires_at = trial_ends + relativedelta(months=1)
            else:  # year
                expires_at = trial_ends + relativedelta(years=1)

            subscription = {
                "user_id": user_id,
                "package_id": package_id,
                "package_name": package.get("name"),
                "status": "active",
                "is_trial": True,
                "trial_ends_at": trial_ends.isoformat(),
                "started_at": now.isoformat(),
                "expires_at": expires_at.isoformat(),
                "session_id": session_id,
                "amount_paid": checkout_status.amount_total / 100,  # Convert cents to dollars
                "interval": interval,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
            }

            # Upsert subscription (prevent duplicates)
            existing = (
                supabase.table("subscriptions").select("id").eq("session_id", session_id).execute()
            )

            if existing.data and len(existing.data) > 0:
                # Update existing
                supabase.table("subscriptions").update(subscription).eq(
                    "session_id", session_id
                ).execute()
            else:
                # Insert new
                supabase.table("subscriptions").insert(subscription).execute()

            update_data["subscription_created"] = True

        # Update transaction
        supabase.table("payment_transactions").update(update_data).eq(
            "session_id", session_id
        ).execute()

        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total,
            "currency": checkout_status.currency,
            "subscription_created": update_data.get("subscription_created", False),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get checkout status: {str(e)}")


def _couple_member_ids(user_id: str) -> List[str]:
    """The user plus their active partner — Premium is shared across the couple."""
    ids = [user_id]
    response = (
        supabase.table("couple_units")
        .select("user1_id, user2_id")
        .eq("status", "active")
        .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")
        .execute()
    )
    for row in response.data or []:
        for member_id in (row.get("user1_id"), row.get("user2_id")):
            if member_id and member_id not in ids:
                ids.append(member_id)
    return ids


# Endpoint: Get user subscription status
@router.get("/subscription/user/{user_id}")
async def get_user_subscription(user_id: str) -> SubscriptionStatus:
    """Get the couple's subscription status (Premium is per couple) and the user's usage limits"""

    try:
        member_ids = _couple_member_ids(user_id)
        response = (
            supabase.table("subscriptions")
            .select("*")
            .in_("user_id", member_ids)
            .eq("status", "active")
            .execute()
        )

        now = datetime.now(timezone.utc)
        for subscription in response.data or []:
            expires_at = datetime.fromisoformat(subscription["expires_at"])

            if now > expires_at:
                supabase.table("subscriptions").update(
                    {"status": "expired", "updated_at": now.isoformat()}
                ).eq("id", subscription["id"]).execute()
                continue

            trial_ends_at = subscription.get("trial_ends_at")
            is_trial = False
            if trial_ends_at:
                is_trial = now < datetime.fromisoformat(trial_ends_at)

            return SubscriptionStatus(
                is_premium=True,
                plan=subscription.get("package_id"),
                expires_at=subscription["expires_at"],
                is_trial=is_trial,
                trial_ends_at=trial_ends_at,
                usage={"unlimited": True},
            )

        return SubscriptionStatus(is_premium=False, usage=await get_user_usage(user_id))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get subscription: {str(e)}")


# Helper: Get user usage (for free tier limits)
async def get_user_usage(user_id: str) -> Dict:
    """Calculate user's monthly usage for free tier limits"""

    from datetime import datetime, timezone
    from dateutil.relativedelta import relativedelta

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Count assessments this month
    assessments_response = (
        supabase.table("assessment_sessions")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("completed", True)
        .gte("submitted_at", month_start.isoformat())
        .execute()
    )
    assessments_count = assessments_response.count or 0

    # AI insights generated for this user this month (shared definition with routes/insights.py)
    insights_count = insights_used_this_month(supabase, user_id)

    # Free tier limits
    FREE_TIER_LIMITS = {"assessments_per_month": 1, "ai_insights_per_month": FREE_AI_INSIGHTS_PER_MONTH}

    return {
        "assessments_used": assessments_count,
        "assessments_limit": FREE_TIER_LIMITS["assessments_per_month"],
        "assessments_remaining": max(
            0, FREE_TIER_LIMITS["assessments_per_month"] - assessments_count
        ),
        "ai_insights_used": insights_count,
        "ai_insights_limit": FREE_TIER_LIMITS["ai_insights_per_month"],
        "ai_insights_remaining": max(0, FREE_TIER_LIMITS["ai_insights_per_month"] - insights_count),
        "period_start": month_start.isoformat(),
        "period_end": (month_start + relativedelta(months=1)).isoformat(),
    }
