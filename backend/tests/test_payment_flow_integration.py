"""
End-to-end payment flow, server side, with Stripe mocked and Supabase replaced by
an in-memory database that enforces the real schema (tests/fake_db.py parses
supabase/bond_schema.sql).

    1. Free user has used their free assessment (limit reached)
    2. Paywall: the app shows the plans (GET /subscription/packages)
    3. User taps "Upgrade to Premium" -> POST /subscription/checkout -> Stripe session
    4. Stripe checkout completes (mocked)
    5. Stripe fires signed webhooks -> subscriptions row written in Supabase
    6. The user (and their partner — Premium is per couple) now has premium access

Steps 2-3 are the API contract behind the React paywall modal; rendering the
modal itself needs a React Native test runner, which mobile/ doesn't have.
"""

import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta, timezone

import pytest
import stripe as stripe_lib
from emergentintegrations.payments.stripe.checkout import (
    CheckoutSessionResponse,
    CheckoutStatusResponse,
)
from fake_db import InMemoryDB
from fastapi import FastAPI
from fastapi.testclient import TestClient

from routes import payments as payments_module
from routes import stripe_webhook as webhook_module

USER, PARTNER, OTHER = "user-free", "user-partner", "user-other"
COUPLE = "couple-1"
ORIGIN = "https://app.example.com"
SESSION_ID = "cs_test_premium_monthly"
SUB_ID = "sub_test_123"
CUSTOMER_ID = "cus_test_123"
PRICE_ID = "price_monthly_test"


class FakeStripe:
    """Mocked Stripe: hosted checkout sessions plus the subscription object webhooks refer to."""

    def __init__(self):
        self.created = []  # CheckoutSessionRequest objects sent to Stripe
        self.paid_sessions = set()

    def checkout(self, origin_url):
        stripe = self

        class Checkout:
            async def create_checkout_session(self, request):
                stripe.created.append(request)
                return CheckoutSessionResponse(
                    url=f"https://checkout.stripe.test/{SESSION_ID}", session_id=SESSION_ID
                )

            async def get_checkout_status(self, session_id):
                paid = session_id in stripe.paid_sessions
                return CheckoutStatusResponse(
                    status="complete" if paid else "open",
                    payment_status="paid" if paid else "unpaid",
                    amount_total=1499 if paid else 0,
                    currency="usd",
                )

        return Checkout()

    def complete_checkout(self, session_id):
        """The user finishes paying on Stripe's hosted page."""
        self.paid_sessions.add(session_id)

    @staticmethod
    def subscription(status="trialing", interval="month"):
        now = int(time.time())
        return {
            "id": SUB_ID,
            "status": status,
            "customer": CUSTOMER_ID,
            "items": {"data": [{"price": {"id": PRICE_ID, "recurring": {"interval": interval}}}]},
            "current_period_start": now,
            "current_period_end": now + 37 * 86400,
            "trial_end": now + 7 * 86400 if status == "trialing" else None,
        }


def stripe_event(event_id, event_type, obj):
    return {"id": event_id, "object": "event", "type": event_type, "data": {"object": obj}}


def checkout_completed_event(event_id="evt_checkout_1", user_id=USER):
    """checkout.session.completed as Stripe delivers it for a session our backend created:
    our metadata (incl. user_id) is echoed back; client_reference_id is only set if we set it."""
    return stripe_event(
        event_id,
        "checkout.session.completed",
        {
            "id": SESSION_ID,
            "object": "checkout.session",
            "customer": CUSTOMER_ID,
            "subscription": SUB_ID,
            "client_reference_id": None,
            "customer_email": "free@example.com",
            "metadata": {"user_id": user_id, "package_id": "premium_monthly"},
        },
    )


def deliver(client, event, secret=None):
    """POST a webhook exactly like Stripe: HMAC-SHA256 signed `t=<ts>,v1=<sig>` header."""
    payload = json.dumps(event).encode()
    ts = int(time.time())
    key = (secret or webhook_module.STRIPE_WEBHOOK_SECRET).encode()
    sig = hmac.new(key, f"{ts}.".encode() + payload, hashlib.sha256).hexdigest()
    return client.post(
        "/api/webhooks/stripe", content=payload, headers={"Stripe-Signature": f"t={ts},v1={sig}"}
    )


@pytest.fixture
def stripe_mock(monkeypatch):
    fake = FakeStripe()
    monkeypatch.setattr(payments_module, "get_stripe_checkout", fake.checkout)
    monkeypatch.setattr(
        webhook_module.stripe.Subscription, "retrieve", lambda sub_id: fake.subscription()
    )
    return fake


@pytest.fixture
def db(monkeypatch):
    database = InMemoryDB()
    monkeypatch.setattr(payments_module, "supabase", database)
    monkeypatch.setattr(webhook_module, "supabase", database)
    database.seed("couple_units", id=COUPLE, user1_id=USER, user2_id=PARTNER, status="active")
    return database


@pytest.fixture
def client(db, stripe_mock):
    app = FastAPI()
    app.include_router(payments_module.router)
    app.include_router(webhook_module.router)
    return TestClient(app)


def use_free_assessment(db, user_id=USER):
    """The user completed their one free assessment this month."""
    now = datetime.now(timezone.utc).isoformat()
    db.seed(
        "assessment_sessions",
        user_id=user_id,
        assessment_id="love-languages",
        completed=True,
        submitted_at=now,
    )


def start_checkout(client, user_id=USER):
    resp = client.post(
        "/api/subscription/checkout",
        json={"package_id": "premium_monthly", "origin_url": ORIGIN},
        headers={"X-User-ID": user_id},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


def subscription_status(client, user_id=USER):
    resp = client.get(f"/api/subscription/user/{user_id}")
    assert resp.status_code == 200, resp.text
    return resp.json()


class TestFullPaymentFlow:
    def test_free_user_hits_limit_upgrades_and_gets_premium(self, client, db, stripe_mock):
        # -- 1. Free user has used the free assessment: the gate is closed -------------------
        use_free_assessment(db)
        before = subscription_status(client)
        assert before["is_premium"] is False
        assert before["usage"]["assessments_used"] == 1
        assert before["usage"]["assessments_remaining"] == 0  # the app's canUseFeature() -> false

        # -- 2. Paywall opens: the app lists plans (prices come from the server) ------------
        plans = {p["id"]: p for p in client.get("/api/subscription/packages").json()}
        assert set(plans) == {"premium_monthly", "premium_annual"}
        assert plans["premium_monthly"]["trial_days"] == 7

        # -- 3. User taps "Upgrade to Premium" -> backend creates a Stripe Checkout session --
        checkout = start_checkout(client)
        assert checkout["session_id"] == SESSION_ID
        assert checkout["url"].startswith("https://checkout.stripe.test/")
        assert stripe_mock.created[0].amount == plans["premium_monthly"]["amount"]
        (txn,) = db.rows("payment_transactions", session_id=SESSION_ID)
        assert (txn["user_id"], txn["payment_status"], txn["package_id"]) == (
            USER,
            "pending",
            "premium_monthly",
        )
        assert db.rows("subscriptions") == []  # nothing granted until Stripe confirms payment

        # -- 4. Stripe checkout completes --------------------------------------------------
        stripe_mock.complete_checkout(SESSION_ID)

        # -- 5. Stripe's webhook fires -> Supabase subscription is written -----------------
        resp = deliver(client, checkout_completed_event())
        assert resp.status_code == 200
        assert resp.json() == {
            "received": True,
            "processed": "checkout.session.completed",
        }, resp.json()

        (sub,) = db.rows("subscriptions", user_id=USER)
        assert sub["status"] == "active"
        assert sub["package_id"] == "premium_monthly"
        assert sub["is_trial"] is True
        (txn,) = db.rows("payment_transactions", session_id=SESSION_ID)
        assert txn["payment_status"] == "paid"
        assert [e["event_id"] for e in db.rows("webhook_events")] == ["evt_checkout_1"]

        # -- 6. Premium access unlocked -----------------------------------------------------
        after = subscription_status(client)
        assert after["is_premium"] is True
        assert after["plan"] == "premium_monthly"
        assert after["usage"] == {"unlimited": True}

    def test_premium_is_shared_with_the_partner_but_not_strangers(self, client, db, stripe_mock):
        start_checkout(client)
        stripe_mock.complete_checkout(SESSION_ID)
        assert deliver(client, checkout_completed_event()).json()["processed"]

        assert subscription_status(client, PARTNER)["is_premium"] is True
        assert subscription_status(client, OTHER)["is_premium"] is False


class TestWebhookAndPollingRace:
    """The success screen polls /subscription/status/{session} while Stripe's webhook also
    arrives. Whichever lands first, the user must end up with exactly ONE subscription."""

    def _poll(self, client):
        resp = client.get(f"/api/subscription/status/{SESSION_ID}", headers={"origin": ORIGIN})
        assert resp.status_code == 200, resp.text
        return resp.json()

    def test_webhook_then_poll_creates_a_single_subscription(self, client, db, stripe_mock):
        start_checkout(client)
        stripe_mock.complete_checkout(SESSION_ID)

        deliver(client, checkout_completed_event())
        poll = self._poll(client)

        assert poll["payment_status"] == "paid"
        assert len(db.rows("subscriptions", user_id=USER)) == 1
        assert subscription_status(client)["is_premium"] is True

    def test_poll_then_webhook_creates_a_single_subscription(self, client, db, stripe_mock):
        start_checkout(client)
        stripe_mock.complete_checkout(SESSION_ID)

        poll = self._poll(client)
        resp = deliver(client, checkout_completed_event())

        assert poll["subscription_created"] is True
        assert resp.status_code == 200
        assert len(db.rows("subscriptions", user_id=USER)) == 1
        assert subscription_status(client)["is_premium"] is True


class TestWebhookSafety:
    def test_duplicate_delivery_is_ignored(self, client, db, stripe_mock):
        start_checkout(client)
        stripe_mock.complete_checkout(SESSION_ID)

        first = deliver(client, checkout_completed_event())
        second = deliver(client, checkout_completed_event())

        assert first.json()["processed"] == "checkout.session.completed"
        assert second.json() == {"received": True, "skipped": "already_processed"}
        assert len(db.rows("subscriptions")) == 1
        assert len(db.rows("webhook_events")) == 1

    def test_forged_signature_grants_nothing(self, client, db, stripe_mock):
        start_checkout(client)

        resp = deliver(client, checkout_completed_event(), secret="whsec_attacker")

        assert resp.status_code == 400
        assert db.rows("subscriptions") == []
        assert subscription_status(client)["is_premium"] is False

    def test_payment_failure_removes_premium(self, client, db, stripe_mock):
        start_checkout(client)
        stripe_mock.complete_checkout(SESSION_ID)
        deliver(client, checkout_completed_event())
        assert subscription_status(client)["is_premium"] is True

        deliver(
            client,
            stripe_event(
                "evt_fail_1",
                "invoice.payment_failed",
                {
                    "id": "in_1",
                    "subscription": SUB_ID,
                    "customer": CUSTOMER_ID,
                    "amount_due": 1499,
                    "attempt_count": 1,
                    "currency": "usd",
                },
            ),
        )

        assert subscription_status(client)["is_premium"] is False

    def test_cancellation_removes_premium(self, client, db, stripe_mock):
        start_checkout(client)
        stripe_mock.complete_checkout(SESSION_ID)
        deliver(client, checkout_completed_event())

        deliver(client, stripe_event("evt_del_1", "customer.subscription.deleted", {"id": SUB_ID}))

        assert subscription_status(client)["is_premium"] is False

    def test_stripe_sdk_signature_scheme_is_what_the_test_signs_with(self):
        """Guard: deliver() must produce signatures the real stripe library accepts."""
        payload = json.dumps(checkout_completed_event()).encode()
        ts = int(time.time())
        secret = webhook_module.STRIPE_WEBHOOK_SECRET
        sig = hmac.new(secret.encode(), f"{ts}.".encode() + payload, hashlib.sha256).hexdigest()
        event = stripe_lib.Webhook.construct_event(payload, f"t={ts},v1={sig}", secret)
        assert event["id"] == "evt_checkout_1"


def test_free_tier_boundary_is_per_calendar_month(client, db):
    """An assessment from a previous month doesn't count against this month's free limit."""
    long_ago = (datetime.now(timezone.utc) - timedelta(days=62)).isoformat()
    db.seed(
        "assessment_sessions",
        user_id=USER,
        assessment_id="love-languages",
        completed=True,
        submitted_at=long_ago,
    )
    assert subscription_status(client)["usage"]["assessments_remaining"] == 1
