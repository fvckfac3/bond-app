from datetime import datetime, timedelta, timezone

import pytest
from conftest import FakeResult
from emergentintegrations.payments.stripe.checkout import (
    CheckoutSessionResponse,
    CheckoutStatusResponse,
)
from fastapi import FastAPI
from fastapi.testclient import TestClient

from routes import payments as payments_module


@pytest.fixture
def client(fake_supabase, monkeypatch):
    monkeypatch.setattr(payments_module, "supabase", fake_supabase)
    app = FastAPI()
    app.include_router(payments_module.router)
    return TestClient(app)


class TestGetPackages:
    def test_returns_both_packages_with_server_side_pricing(self, client):
        resp = client.get("/api/subscription/packages")
        assert resp.status_code == 200
        data = resp.json()
        assert {p["id"] for p in data} == {"premium_monthly", "premium_annual"}
        monthly = next(p for p in data if p["id"] == "premium_monthly")
        assert monthly["amount"] == 14.99
        assert monthly["trial_days"] == 7


class TestCreateCheckoutSession:
    def test_rejects_unknown_package_id(self, client):
        resp = client.post(
            "/api/subscription/checkout",
            json={"package_id": "not_a_real_package", "origin_url": "https://app.example.com"},
        )
        assert resp.status_code == 400

    def test_never_trusts_client_supplied_amount(self, client, fake_supabase, monkeypatch):
        """CheckoutRequest has no `amount` field — price always comes from
        SUBSCRIPTION_PACKAGES server-side, never the client."""
        captured = {}

        class FakeCheckout:
            def __init__(self, api_key, webhook_url):
                pass

            async def create_checkout_session(self, request):
                captured["amount"] = request.amount
                return CheckoutSessionResponse(
                    url="https://stripe.test/session", session_id="cs_test_123"
                )

        monkeypatch.setattr(
            payments_module, "get_stripe_checkout", lambda origin_url: FakeCheckout(None, None)
        )

        resp = client.post(
            "/api/subscription/checkout",
            json={
                "package_id": "premium_monthly",
                "origin_url": "https://app.example.com",
                "amount": 0.01,  # tamper attempt — ignored, not a CheckoutRequest field
            },
        )

        assert resp.status_code == 200
        assert captured["amount"] == 14.99
        assert resp.json()["session_id"] == "cs_test_123"

        inserted = fake_supabase.calls_for("payment_transactions", op="insert")
        assert len(inserted) == 1
        assert inserted[0].payload["amount"] == 14.99
        assert inserted[0].payload["payment_status"] == "pending"


class TestCheckoutStatusPolling:
    def test_404_when_transaction_missing(self, client, fake_supabase):
        fake_supabase.table_results["payment_transactions"] = FakeResult(data=[])
        resp = client.get("/api/subscription/status/cs_unknown")
        assert resp.status_code == 404

    def test_returns_cached_status_without_recontacting_stripe(
        self, client, fake_supabase, monkeypatch
    ):
        """Once a transaction is marked paid, polling again must not re-check
        with Stripe or re-create a subscription."""
        fake_supabase.table_results["payment_transactions"] = FakeResult(
            data=[{"session_id": "cs_paid", "payment_status": "paid", "subscription_created": True}]
        )

        def boom(origin_url):
            raise AssertionError("should not contact Stripe for an already-paid transaction")

        monkeypatch.setattr(payments_module, "get_stripe_checkout", boom)

        resp = client.get("/api/subscription/status/cs_paid")
        assert resp.status_code == 200
        assert resp.json() == {
            "status": "complete",
            "payment_status": "paid",
            "subscription_created": True,
        }

    def test_does_not_duplicate_subscription_on_repeat_poll(
        self, client, fake_supabase, monkeypatch
    ):
        """A newly-paid transaction polled twice (e.g. a client retry racing
        the original request) must only ever produce one subscription row —
        the second poll should update the existing row, not insert another."""
        fake_supabase.table_results["payment_transactions"] = FakeResult(
            data=[
                {
                    "session_id": "cs_new",
                    "user_id": "user-1",
                    "package_id": "premium_monthly",
                    "payment_status": "pending",
                    "subscription_created": False,
                }
            ]
        )

        class FakeCheckout:
            def __init__(self, api_key, webhook_url):
                pass

            async def get_checkout_status(self, session_id):
                return CheckoutStatusResponse(
                    status="complete", payment_status="paid", amount_total=1499, currency="usd"
                )

        monkeypatch.setattr(
            payments_module, "get_stripe_checkout", lambda origin_url: FakeCheckout(None, None)
        )

        # First poll: no existing subscription row for this session -> insert
        fake_supabase.table_results["subscriptions"] = FakeResult(data=[])
        resp1 = client.get("/api/subscription/status/cs_new")
        assert resp1.status_code == 200
        assert resp1.json()["subscription_created"] is True
        assert len(fake_supabase.calls_for("subscriptions", op="insert")) == 1
        assert len(fake_supabase.calls_for("subscriptions", op="update")) == 0

        # Second poll: a subscription row now exists for this session ->
        # must update in place, never insert a second one
        fake_supabase.table_results["subscriptions"] = FakeResult(
            data=[{"id": 1, "session_id": "cs_new"}]
        )
        resp2 = client.get("/api/subscription/status/cs_new")
        assert resp2.status_code == 200
        assert len(fake_supabase.calls_for("subscriptions", op="insert")) == 1  # unchanged
        assert len(fake_supabase.calls_for("subscriptions", op="update")) == 1


class TestUserSubscriptionStatus:
    def test_free_tier_when_no_active_subscription(self, client, fake_supabase):
        fake_supabase.table_results["subscriptions"] = FakeResult(data=[])
        fake_supabase.table_results["assessment_sessions"] = FakeResult(data=[], count=0)
        fake_supabase.table_results["couple_results"] = FakeResult(data=[], count=0)

        resp = client.get("/api/subscription/user/user-without-sub")
        assert resp.status_code == 200
        body = resp.json()
        assert body["is_premium"] is False
        assert body["usage"]["assessments_limit"] == 1

    def test_premium_when_active_subscription_not_expired(self, client, fake_supabase):
        expires_at = (datetime.now(timezone.utc) + timedelta(days=20)).isoformat()
        fake_supabase.table_results["subscriptions"] = FakeResult(
            data=[
                {
                    "id": 1,
                    "package_id": "premium_annual",
                    "status": "active",
                    "expires_at": expires_at,
                    "trial_ends_at": None,
                }
            ]
        )

        resp = client.get("/api/subscription/user/user-with-sub")
        assert resp.status_code == 200
        body = resp.json()
        assert body["is_premium"] is True
        assert body["plan"] == "premium_annual"
        assert body["usage"] == {"unlimited": True}

    def test_partner_subscription_makes_the_whole_couple_premium(self, client, fake_supabase):
        """Premium is per couple: an active subscription held by the partner
        covers this user too."""
        expires_at = (datetime.now(timezone.utc) + timedelta(days=20)).isoformat()
        fake_supabase.table_results["couple_units"] = FakeResult(
            data=[{"user1_id": "user-a", "user2_id": "user-b"}]
        )
        fake_supabase.table_results["subscriptions"] = FakeResult(
            data=[
                {
                    "id": 5,
                    "user_id": "user-b",
                    "package_id": "premium_monthly",
                    "status": "active",
                    "expires_at": expires_at,
                    "trial_ends_at": None,
                }
            ]
        )

        resp = client.get("/api/subscription/user/user-a")

        assert resp.status_code == 200
        assert resp.json()["is_premium"] is True
        (sub_query,) = fake_supabase.calls_for("subscriptions", op="select")
        assert ("in", "user_id", ["user-a", "user-b"]) in sub_query.filters

    def test_expired_partner_subscription_is_marked_and_not_premium(self, client, fake_supabase):
        expired = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        fake_supabase.table_results["couple_units"] = FakeResult(
            data=[{"user1_id": "user-a", "user2_id": "user-b"}]
        )
        fake_supabase.table_results["subscriptions"] = FakeResult(
            data=[{"id": 6, "user_id": "user-b", "status": "active", "expires_at": expired}]
        )
        fake_supabase.table_results["assessment_sessions"] = FakeResult(data=[], count=0)
        fake_supabase.table_results["couple_results"] = FakeResult(data=[], count=0)

        resp = client.get("/api/subscription/user/user-a")

        assert resp.json()["is_premium"] is False
        assert len(fake_supabase.calls_for("subscriptions", op="update")) == 1

    def test_free_tier_usage_reflects_assessment_and_insight_counts(self, client, fake_supabase):
        fake_supabase.table_results["subscriptions"] = FakeResult(data=[])
        fake_supabase.table_results["assessment_sessions"] = FakeResult(data=[], count=1)
        fake_supabase.table_results["couple_results"] = FakeResult(data=[], count=3)

        resp = client.get("/api/subscription/user/user-partial-usage")
        assert resp.status_code == 200
        usage = resp.json()["usage"]
        assert usage["assessments_used"] == 1
        assert usage["assessments_remaining"] == 0
        assert usage["ai_insights_used"] == 3
        assert usage["ai_insights_remaining"] == 2


class TestLegacyWebhookRemoved:
    def test_payments_router_no_longer_serves_a_stripe_webhook(self, client):
        """Stripe webhooks are handled solely by routes/stripe_webhook.py
        (/api/webhooks/stripe) — see PRDs'@/11 Finding #4."""
        resp = client.post("/api/webhook/stripe", content=b"{}")
        assert resp.status_code == 404
