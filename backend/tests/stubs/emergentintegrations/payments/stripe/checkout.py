"""
Minimal test stand-in for the private `emergentintegrations` package.

`emergentintegrations` isn't published on PyPI (it ships inside Emergent.sh's
build image only), so it can't be installed in a normal dev/CI environment.
routes/payments.py imports these four names at module scope; this stub exists
only so that module import succeeds under pytest. Every test that exercises
checkout/status behavior patches the relevant method directly — nothing here
is meant to simulate real Stripe behavior.
"""


class CheckoutSessionRequest:
    def __init__(self, amount, currency, success_url, cancel_url, metadata=None):
        self.amount = amount
        self.currency = currency
        self.success_url = success_url
        self.cancel_url = cancel_url
        self.metadata = metadata or {}


class CheckoutSessionResponse:
    def __init__(self, url, session_id):
        self.url = url
        self.session_id = session_id


class CheckoutStatusResponse:
    def __init__(self, status, payment_status, amount_total=0, currency="usd"):
        self.status = status
        self.payment_status = payment_status
        self.amount_total = amount_total
        self.currency = currency


class StripeCheckout:
    def __init__(self, api_key, webhook_url):
        self.api_key = api_key
        self.webhook_url = webhook_url

    async def create_checkout_session(
        self, request: CheckoutSessionRequest
    ) -> CheckoutSessionResponse:
        raise NotImplementedError("stub — patch this method in tests")

    async def get_checkout_status(self, session_id: str) -> CheckoutStatusResponse:
        raise NotImplementedError("stub — patch this method in tests")
