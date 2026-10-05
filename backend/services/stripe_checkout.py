"""
Direct Stripe Checkout wrapper.

Replaces emergentintegrations' StripeCheckout gateway (Emergent.sh-private, not on PyPI) with
the real `stripe` SDK, which routes/payments.py already imports directly for the customer
portal. Keeps the same shape — StripeCheckout(api_key, webhook_url).create_checkout_session(
request) / .get_checkout_status(session_id) — so routes/payments.py and its tests didn't need
to change their calling convention when the private dependency was dropped.
"""

from typing import Any, Dict, Optional

import stripe


class CheckoutSessionRequest:
    def __init__(
        self,
        amount: float,
        currency: str,
        success_url: str,
        cancel_url: str,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.amount = amount
        self.currency = currency
        self.success_url = success_url
        self.cancel_url = cancel_url
        self.metadata = metadata or {}


class CheckoutSessionResponse:
    def __init__(self, url: str, session_id: str):
        self.url = url
        self.session_id = session_id


class CheckoutStatusResponse:
    def __init__(
        self, status: str, payment_status: str, amount_total: int = 0, currency: str = "usd"
    ):
        self.status = status
        self.payment_status = payment_status
        self.amount_total = amount_total
        self.currency = currency


class StripeCheckout:
    """Thin async wrapper around the real Stripe SDK's Checkout Session API."""

    def __init__(self, api_key: str, webhook_url: str):
        self.api_key = api_key
        self.webhook_url = webhook_url

    async def create_checkout_session(
        self, request: CheckoutSessionRequest
    ) -> CheckoutSessionResponse:
        stripe.api_key = self.api_key
        metadata = request.metadata or {}
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[
                {
                    "price_data": {
                        "currency": request.currency,
                        "unit_amount": round(request.amount * 100),
                        "recurring": {"interval": metadata.get("interval", "month")},
                        "product_data": {"name": metadata.get("package_name", "Bond Premium")},
                    },
                    "quantity": 1,
                }
            ],
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata=metadata,
            allow_promotion_codes=True,
            subscription_data={
                "trial_period_days": int(metadata.get("trial_days", 7)),
                "metadata": metadata,
            },
        )
        return CheckoutSessionResponse(url=session.url or "", session_id=session.id)

    async def get_checkout_status(self, session_id: str) -> CheckoutStatusResponse:
        stripe.api_key = self.api_key
        session = stripe.checkout.Session.retrieve(session_id)
        return CheckoutStatusResponse(
            status=session.status or "unknown",
            payment_status=session.payment_status,
            amount_total=session.amount_total or 0,
            currency=session.currency or "usd",
        )
