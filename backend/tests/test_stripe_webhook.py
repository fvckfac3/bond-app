import asyncio
from datetime import datetime, timezone

import pytest
import stripe as stripe_lib
from conftest import FakeResult
from fastapi import FastAPI
from fastapi.testclient import TestClient

from routes import stripe_webhook as webhook_module


@pytest.fixture
def client(fake_supabase, monkeypatch):
    monkeypatch.setattr(webhook_module, "supabase", fake_supabase)
    install_webhook_events_table(fake_supabase)
    app = FastAPI()
    app.include_router(webhook_module.router)
    return TestClient(app)


def make_event(event_id, event_type, data_object=None):
    return {"id": event_id, "type": event_type, "data": {"object": data_object or {}}}


class DuplicateKeyError(Exception):
    code = "23505"


def install_webhook_events_table(fake_supabase, fail_inserts=False):
    """Behave like the real webhook_events table: event_id is UNIQUE, so a
    second insert of the same event_id raises Postgres' unique violation."""
    seen = set()

    def producer(query):
        if query.op == "insert":
            if fail_inserts:
                raise RuntimeError("supabase is down")
            event_id = query.payload["event_id"]
            if event_id in seen:
                raise DuplicateKeyError(
                    'duplicate key value violates unique constraint "webhook_events_event_id_key"'
                )
            seen.add(event_id)
        elif query.op == "delete":
            for op, field, value in query.filters:
                if field == "event_id":
                    seen.discard(value)
        return FakeResult(data=[])

    fake_supabase.table_results["webhook_events"] = producer
    return seen


SIGNATURE_HEADERS = {"Stripe-Signature": "t=1,v1=test-signature"}


class TestWebhookIdempotency:
    def test_duplicate_event_is_not_reprocessed(self, client, fake_supabase, monkeypatch):
        event = make_event("evt_dup_1", "customer.subscription.deleted", {"id": "sub_123"})
        monkeypatch.setattr(webhook_module.stripe.Webhook, "construct_event", lambda *a, **k: event)
        fake_supabase.table_results["subscriptions"] = FakeResult(data=[{"id": 1}])

        resp1 = client.post("/api/webhooks/stripe", content=b"{}", headers=SIGNATURE_HEADERS)
        resp2 = client.post("/api/webhooks/stripe", content=b"{}", headers=SIGNATURE_HEADERS)

        assert resp1.status_code == 200
        assert resp1.json() == {"received": True, "processed": "customer.subscription.deleted"}

        assert resp2.status_code == 200
        assert resp2.json() == {"received": True, "skipped": "already_processed"}

        # The handler ran exactly once — the duplicate delivery must not touch the DB again
        assert len(fake_supabase.calls_for("subscriptions", op="update")) == 1

    def test_idempotency_survives_a_process_restart(self, fake_supabase, monkeypatch):
        """The claim lives in Supabase, not process memory: a brand-new app
        instance (serverless cold start / redeploy) still rejects a duplicate."""
        event = make_event("evt_restart_1", "customer.subscription.deleted", {"id": "sub_1"})
        monkeypatch.setattr(webhook_module.stripe.Webhook, "construct_event", lambda *a, **k: event)
        monkeypatch.setattr(webhook_module, "supabase", fake_supabase)
        install_webhook_events_table(fake_supabase)
        fake_supabase.table_results["subscriptions"] = FakeResult(data=[{"id": 1}])

        def fresh_client():
            app = FastAPI()
            app.include_router(webhook_module.router)
            return TestClient(app)

        first = fresh_client().post(
            "/api/webhooks/stripe", content=b"{}", headers=SIGNATURE_HEADERS
        )
        second = fresh_client().post(
            "/api/webhooks/stripe", content=b"{}", headers=SIGNATURE_HEADERS
        )

        assert first.json()["processed"] == "customer.subscription.deleted"
        assert second.json() == {"received": True, "skipped": "already_processed"}
        assert len(fake_supabase.calls_for("subscriptions", op="update")) == 1

    def test_event_is_claimed_before_handler_runs(self, client, fake_supabase, monkeypatch):
        event = make_event("evt_order_1", "customer.subscription.deleted", {"id": "sub_1"})
        monkeypatch.setattr(webhook_module.stripe.Webhook, "construct_event", lambda *a, **k: event)
        fake_supabase.table_results["subscriptions"] = FakeResult(data=[{"id": 1}])

        client.post("/api/webhooks/stripe", content=b"{}", headers=SIGNATURE_HEADERS)

        tables = [c.table for c in fake_supabase.calls]
        assert tables.index("webhook_events") < tables.index("subscriptions")
        claim = fake_supabase.calls_for("webhook_events", op="insert")[0].payload
        assert claim["event_id"] == "evt_order_1"
        assert claim["event_type"] == "customer.subscription.deleted"

    def test_failed_handler_releases_claim_so_redelivery_reprocesses(
        self, client, fake_supabase, monkeypatch
    ):
        event = make_event("evt_retry_1", "customer.subscription.deleted", {"id": "sub_1"})
        monkeypatch.setattr(webhook_module.stripe.Webhook, "construct_event", lambda *a, **k: event)
        fake_supabase.table_results["subscriptions"] = FakeResult(data=[{"id": 1}])

        calls = {"n": 0}
        real = webhook_module._handle_subscription_deleted

        async def flaky(_event):
            calls["n"] += 1
            if calls["n"] == 1:
                raise RuntimeError("transient")
            await real(_event)

        monkeypatch.setattr(webhook_module, "_handle_subscription_deleted", flaky)

        first = client.post("/api/webhooks/stripe", content=b"{}", headers=SIGNATURE_HEADERS)
        second = client.post("/api/webhooks/stripe", content=b"{}", headers=SIGNATURE_HEADERS)

        assert "transient" in first.json()["error"]
        assert second.json() == {"received": True, "processed": "customer.subscription.deleted"}

    def test_database_failure_recording_event_returns_500_so_stripe_retries(
        self, client, fake_supabase, monkeypatch
    ):
        event = make_event("evt_db_1", "customer.subscription.deleted", {"id": "sub_1"})
        monkeypatch.setattr(webhook_module.stripe.Webhook, "construct_event", lambda *a, **k: event)
        install_webhook_events_table(fake_supabase, fail_inserts=True)

        resp = client.post("/api/webhooks/stripe", content=b"{}", headers=SIGNATURE_HEADERS)

        assert resp.status_code == 500
        assert fake_supabase.calls_for("subscriptions") == []

    def test_missing_signature_header_is_rejected(self, client):
        resp = client.post("/api/webhooks/stripe", content=b"{}")
        assert resp.status_code == 400

    def test_invalid_signature_is_rejected(self, client, monkeypatch):
        def raise_sig_error(*a, **k):
            raise stripe_lib.error.SignatureVerificationError("bad sig", "sig_header")

        monkeypatch.setattr(webhook_module.stripe.Webhook, "construct_event", raise_sig_error)

        resp = client.post("/api/webhooks/stripe", content=b"{}", headers=SIGNATURE_HEADERS)
        assert resp.status_code == 400

    def test_handler_exception_is_swallowed_to_stop_stripe_retries(self, client, monkeypatch):
        """By design (see the comment in handle_stripe_webhook), an exception
        inside an event handler still returns 200 so Stripe doesn't retry
        forever — the error surfaces in the response body instead of an HTTP
        error status."""
        event = make_event("evt_err_1", "customer.subscription.deleted", {"id": "sub_err"})
        monkeypatch.setattr(webhook_module.stripe.Webhook, "construct_event", lambda *a, **k: event)

        async def boom(_event):
            raise RuntimeError("supabase is down")

        monkeypatch.setattr(webhook_module, "_handle_subscription_deleted", boom)

        resp = client.post("/api/webhooks/stripe", content=b"{}", headers=SIGNATURE_HEADERS)
        assert resp.status_code == 200
        assert "supabase is down" in resp.json()["error"]

    def test_unhandled_event_type_is_acknowledged_without_error(self, client, monkeypatch):
        event = make_event("evt_unknown_1", "some.future.event")
        monkeypatch.setattr(webhook_module.stripe.Webhook, "construct_event", lambda *a, **k: event)

        resp = client.post("/api/webhooks/stripe", content=b"{}", headers=SIGNATURE_HEADERS)
        assert resp.status_code == 200
        assert resp.json() == {"received": True, "processed": "some.future.event"}


class TestSubscriptionEventHandlers:
    """Direct coverage of the per-event-type handlers, independent of the
    dispatch/idempotency layer above."""

    def test_checkout_completed_inserts_new_subscription(self, fake_supabase, monkeypatch):
        monkeypatch.setattr(webhook_module, "supabase", fake_supabase)

        now = int(datetime.now(timezone.utc).timestamp())
        fake_sub = {
            "status": "trialing",
            "items": {"data": [{"price": {"id": "price_123", "recurring": {"interval": "month"}}}]},
            "current_period_start": now,
            "current_period_end": now + 30 * 86400,
            "trial_end": now + 7 * 86400,
        }
        monkeypatch.setattr(webhook_module.stripe.Subscription, "retrieve", lambda sub_id: fake_sub)

        fake_supabase.table_results["subscriptions"] = FakeResult(
            data=[]
        )  # no existing row -> insert

        event = make_event(
            "evt_checkout_1",
            "checkout.session.completed",
            {
                "id": "cs_test_1",
                "customer": "cus_123",
                "subscription": "sub_123",
                "client_reference_id": "user-1",
            },
        )

        asyncio.run(webhook_module._handle_checkout_completed(event))

        inserted = fake_supabase.calls_for("subscriptions", op="insert")
        assert len(inserted) == 1
        assert inserted[0].payload["user_id"] == "user-1"
        assert (
            inserted[0].payload["status"] == "active"
        )  # _map_stripe_status("trialing") -> "active"
        assert inserted[0].payload["package_id"] == "premium_monthly"
        assert inserted[0].payload["stripe_subscription_id"] == "sub_123"

    def test_checkout_completed_updates_existing_subscription_instead_of_duplicating(
        self, fake_supabase, monkeypatch
    ):
        """A retried checkout.session.completed for a subscription we already
        recorded must update that row, never insert a second one — this is
        the idempotency guard for the checkout-completion path."""
        monkeypatch.setattr(webhook_module, "supabase", fake_supabase)

        now = int(datetime.now(timezone.utc).timestamp())
        fake_sub = {
            "status": "active",
            "items": {"data": [{"price": {"id": "price_123", "recurring": {"interval": "year"}}}]},
            "current_period_start": now,
            "current_period_end": now + 365 * 86400,
            "trial_end": None,
        }
        monkeypatch.setattr(webhook_module.stripe.Subscription, "retrieve", lambda sub_id: fake_sub)

        fake_supabase.table_results["subscriptions"] = FakeResult(
            data=[{"id": 42, "user_id": "user-1"}]
        )

        event = make_event(
            "evt_checkout_2",
            "checkout.session.completed",
            {"id": "cs_test_2", "customer": "cus_123", "subscription": "sub_123"},
        )

        asyncio.run(webhook_module._handle_checkout_completed(event))

        assert len(fake_supabase.calls_for("subscriptions", op="insert")) == 0
        assert len(fake_supabase.calls_for("subscriptions", op="update")) == 1

    def test_subscription_deleted_marks_canceled(self, fake_supabase, monkeypatch):
        monkeypatch.setattr(webhook_module, "supabase", fake_supabase)
        fake_supabase.table_results["subscriptions"] = FakeResult(data=[{"id": 1}])

        event = make_event("evt_del_1", "customer.subscription.deleted", {"id": "sub_999"})
        asyncio.run(webhook_module._handle_subscription_deleted(event))

        updates = fake_supabase.calls_for("subscriptions", op="update")
        assert len(updates) == 1
        assert updates[0].payload["status"] == "canceled"

    @pytest.mark.parametrize(
        "stripe_status,expected",
        [
            ("active", "active"),
            ("trialing", "active"),
            ("past_due", "past_due"),
            ("canceled", "canceled"),
            ("incomplete_expired", "expired"),
            ("some_unmapped_future_status", "some_unmapped_future_status"),
        ],
    )
    def test_map_stripe_status(self, stripe_status, expected):
        assert webhook_module._map_stripe_status(stripe_status) == expected


class TestInvoiceAndUpdateEventHandlers:
    """Direct coverage of the subscription-lifecycle handlers that
    TestSubscriptionEventHandlers doesn't reach: plan/status sync, renewal,
    and payment failure (see PRDs'@/06 Error & State Reference §3 — the
    standard Stripe lifecycle mapped via _map_stripe_status)."""

    def test_subscription_updated_syncs_status_and_plan(self, fake_supabase, monkeypatch):
        monkeypatch.setattr(webhook_module, "supabase", fake_supabase)

        now = int(datetime.now(timezone.utc).timestamp())
        event = make_event(
            "evt_upd_1",
            "customer.subscription.updated",
            {
                "id": "sub_555",
                "customer": "cus_555",
                "status": "past_due",
                "items": {
                    "data": [{"price": {"id": "price_annual", "recurring": {"interval": "year"}}}]
                },
                "current_period_start": now,
                "current_period_end": now + 365 * 86400,
                "trial_end": None,
            },
        )
        fake_supabase.table_results["subscriptions"] = FakeResult(data=[{"id": 7}])

        asyncio.run(webhook_module._handle_subscription_updated(event))

        updates = fake_supabase.calls_for("subscriptions", op="update")
        assert len(updates) == 1
        assert updates[0].payload["status"] == "past_due"
        assert updates[0].payload["package_id"] == "premium_annual"
        assert "ended_at" not in updates[0].payload

    def test_subscription_updated_maps_canceled_status(self, fake_supabase, monkeypatch):
        monkeypatch.setattr(webhook_module, "supabase", fake_supabase)

        now = int(datetime.now(timezone.utc).timestamp())
        event = make_event(
            "evt_upd_2",
            "customer.subscription.updated",
            {
                "id": "sub_556",
                "customer": "cus_556",
                "status": "canceled",
                "items": {
                    "data": [{"price": {"id": "price_monthly", "recurring": {"interval": "month"}}}]
                },
                "current_period_start": now,
                "current_period_end": now + 30 * 86400,
                "ended_at": now,
                "trial_end": None,
            },
        )
        fake_supabase.table_results["subscriptions"] = FakeResult(data=[{"id": 8}])

        asyncio.run(webhook_module._handle_subscription_updated(event))

        updates = fake_supabase.calls_for("subscriptions", op="update")
        assert len(updates) == 1
        assert updates[0].payload["status"] == "canceled"

    def test_invoice_payment_succeeded_extends_period(self, fake_supabase, monkeypatch):
        monkeypatch.setattr(webhook_module, "supabase", fake_supabase)

        now = int(datetime.now(timezone.utc).timestamp())
        fake_sub = {"current_period_start": now, "current_period_end": now + 30 * 86400}
        monkeypatch.setattr(webhook_module.stripe.Subscription, "retrieve", lambda sub_id: fake_sub)
        fake_supabase.table_results["subscriptions"] = FakeResult(data=[{"id": 9}])

        event = make_event(
            "evt_inv_ok_1",
            "invoice.payment_succeeded",
            {"id": "in_1", "subscription": "sub_777", "customer": "cus_777"},
        )

        asyncio.run(webhook_module._handle_invoice_payment_succeeded(event))

        updates = fake_supabase.calls_for("subscriptions", op="update")
        assert len(updates) == 1
        assert updates[0].payload["status"] == "active"
        assert updates[0].payload["expires_at"] is not None

    def test_invoice_payment_succeeded_ignores_one_time_payment(self, fake_supabase, monkeypatch):
        """An invoice with no `subscription` field is a one-time payment, not
        a recurring renewal — must not touch the subscriptions table."""
        monkeypatch.setattr(webhook_module, "supabase", fake_supabase)

        event = make_event(
            "evt_inv_onetime_1", "invoice.payment_succeeded", {"id": "in_2", "customer": "cus_888"}
        )

        asyncio.run(webhook_module._handle_invoice_payment_succeeded(event))

        assert fake_supabase.calls_for("subscriptions") == []

    def test_invoice_payment_failed_marks_past_due(self, fake_supabase, monkeypatch):
        monkeypatch.setattr(webhook_module, "supabase", fake_supabase)
        fake_supabase.table_results["subscriptions"] = FakeResult(data=[{"id": 10}])

        event = make_event(
            "evt_inv_fail_1",
            "invoice.payment_failed",
            {
                "id": "in_3",
                "subscription": "sub_999",
                "customer": "cus_999",
                "amount_due": 1499,
                "attempt_count": 2,
                "currency": "usd",
            },
        )

        asyncio.run(webhook_module._handle_invoice_payment_failed(event))

        updates = fake_supabase.calls_for("subscriptions", op="update")
        assert len(updates) == 1
        assert updates[0].payload["status"] == "past_due"
        assert "payment_attempts" not in updates[0].payload
