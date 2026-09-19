import os
import sys
from types import SimpleNamespace

import pytest

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STUBS_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stubs")

# routes/payments.py and routes/stripe_webhook.py assume `backend/` is on
# sys.path (same assumption server.py makes) so `import routes.payments` works.
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

# `emergentintegrations` isn't on PyPI (Emergent.sh-private, baked into their
# build image only). Append the stub after the real sys.path so a real
# install (e.g. inside Emergent's own environment) always wins.
if STUBS_ROOT not in sys.path:
    sys.path.append(STUBS_ROOT)

# routes/payments.py and routes/stripe_webhook.py read these at import time.
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("STRIPE_API_KEY", "sk_test_dummy")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_test_dummy")


class FakeResult(SimpleNamespace):
    """Stands in for supabase-py's execute() response (.data / .count)."""

    def __init__(self, data=None, count=None):
        super().__init__(data=data if data is not None else [], count=count)


class FakeQuery:
    """
    Chainable fake for supabase-py's fluent query builder.

    Every filter/modifier method (select/eq/gte/order/single/...) returns
    self so arbitrarily long chains work; execute() records the call and
    returns whatever FakeSupabase.table_results has queued for this table.
    """

    def __init__(self, table_name, supabase):
        self.table_name = table_name
        self._supabase = supabase
        self.op = None
        self.payload = None
        self.filters = []

    def select(self, *args, **kwargs):
        self.op = self.op or "select"
        return self

    def insert(self, payload, *args, **kwargs):
        self.op = "insert"
        self.payload = payload
        return self

    def update(self, payload, *args, **kwargs):
        self.op = "update"
        self.payload = payload
        return self

    def upsert(self, payload, *args, **kwargs):
        self.op = "upsert"
        self.payload = payload
        return self

    def delete(self, *args, **kwargs):
        self.op = "delete"
        return self

    def eq(self, field, value):
        self.filters.append(("eq", field, value))
        return self

    def in_(self, field, values):
        self.filters.append(("in", field, list(values)))
        return self

    def or_(self, expression):
        self.filters.append(("or", expression))
        return self

    def gte(self, field, value):
        self.filters.append(("gte", field, value))
        return self

    def order(self, *args, **kwargs):
        return self

    def single(self):
        return self

    def execute(self):
        self._supabase.calls.append(
            SimpleNamespace(
                table=self.table_name,
                op=self.op,
                payload=self.payload,
                filters=list(self.filters),
            )
        )
        producer = self._supabase.table_results.get(self.table_name)
        if callable(producer):
            return producer(self)
        if producer is not None:
            return producer
        return FakeResult()


class FakeSupabase:
    """
    Drop-in stand-in for the module-level `supabase` client created by
    `create_client(...)` in routes/payments.py and routes/stripe_webhook.py.

    Tests configure `table_results["table_name"]` with either a FakeResult
    (static response) or a callable(query) -> FakeResult (for responses that
    depend on the operation/payload/filters, e.g. distinguishing an insert
    from an update on the same table).
    """

    def __init__(self):
        self.calls = []
        self.table_results = {}

    def table(self, name):
        return FakeQuery(name, self)

    def calls_for(self, table_name, op=None):
        return [c for c in self.calls if c.table == table_name and (op is None or c.op == op)]


@pytest.fixture
def fake_supabase():
    return FakeSupabase()
