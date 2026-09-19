"""
Coverage for routes/analyzers.py — the five analyzers (communication, text,
argument, voice tone, emotional pattern).

Everything runs offline: the EMERGENT_LLM_KEY gateway is replaced by the stub
`emergentintegrations.llm.chat.LlmChat` (tests/stubs), whose canned reply is set
per test, and Supabase is replaced by an in-memory `World` that enforces the
same rules the real database would (pairing lookup, couple-scoped rows).

Privacy requirements under test (PRDs'@/03 Safety & Privacy §3, §5, §6):
  * analyzer results are scoped to `couple_id` — never readable across couples
  * only paired (active couple) members may run or read analyses
  * raw analyzer input (messages / transcripts) is never persisted
"""

import json
from types import SimpleNamespace

import pytest
from conftest import FakeResult
from emergentintegrations.llm.chat import LlmChat
from fastapi import FastAPI
from fastapi.testclient import TestClient

from routes import analyzers as analyzers_module

COUPLE_A, COUPLE_B, COUPLE_PENDING = (
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222",
    "33333333-3333-3333-3333-333333333333",
)
ALICE, ALEX, BOB, BEA, CARL, STRANGER = "alice", "alex", "bob", "bea", "carl", "stranger"
TOKENS = {f"token-{u}": u for u in (ALICE, ALEX, BOB, BEA, CARL, STRANGER)}

SECRET = "SECRET-RAW-INPUT-that-must-never-be-stored"

RESULT_TABLES = list(analyzers_module.RESULT_COLUMNS)


class World:
    """In-memory Supabase: couples, result tables, and JWT -> user resolution."""

    def __init__(self, fake_supabase):
        self.fake = fake_supabase
        self.couples = [
            {"id": COUPLE_A, "user1_id": ALICE, "user2_id": ALEX, "status": "active"},
            {"id": COUPLE_B, "user1_id": BOB, "user2_id": BEA, "status": "active"},
            {"id": COUPLE_PENDING, "user1_id": CARL, "user2_id": None, "status": "pending"},
        ]
        self.rows = {t: [] for t in RESULT_TABLES}
        self.fail_inserts = False

        fake_supabase.table_results["couple_units"] = self._couple_units
        for table in RESULT_TABLES:
            fake_supabase.table_results[table] = self._result_table(table)
        fake_supabase.auth = SimpleNamespace(get_user=self._get_user)

    def _get_user(self, token):
        if token not in TOKENS:
            raise Exception("invalid JWT")
        return SimpleNamespace(user=SimpleNamespace(id=TOKENS[token]))

    def _couple_units(self, query):
        eq = {f[1]: f[2] for f in query.filters if f[0] == "eq"}
        members = set()
        for f in query.filters:
            if f[0] == "or":
                members = {part.split(".eq.")[1] for part in f[1].split(",")}
        data = [
            {"id": c["id"]}
            for c in self.couples
            if c["id"] == eq.get("id")
            and c["status"] == eq.get("status")
            and members & {c["user1_id"], c["user2_id"]}
        ]
        return FakeResult(data=data)

    def _result_table(self, table):
        def producer(query):
            if query.op == "insert":
                if self.fail_inserts:
                    raise RuntimeError("supabase is down")
                self.rows[table].append(dict(query.payload))
                return FakeResult(data=[query.payload])
            # SELECT: honour the couple_id filter exactly like Postgres would. A
            # route that forgot to scope by couple_id would return every row.
            scope = [f[2] for f in query.filters if f[0] == "eq" and f[1] == "couple_id"]
            rows = [r for r in self.rows[table] if not scope or r["couple_id"] == scope[0]]
            limits = [f[1] for f in query.filters if f[0] == "limit"]
            return FakeResult(data=rows[: limits[0]] if limits else rows)

        return producer

    def all_stored(self):
        return [row for rows in self.rows.values() for row in rows]


@pytest.fixture
def world(fake_supabase, monkeypatch):
    w = World(fake_supabase)
    monkeypatch.setattr(analyzers_module, "get_supabase", lambda: fake_supabase)
    LlmChat.prompts = []
    LlmChat.response = json.dumps({})
    return w


@pytest.fixture
def client(world):
    app = FastAPI()
    app.include_router(analyzers_module.router)
    return TestClient(app)


def auth(user):
    return {"Authorization": f"Bearer token-{user}"}


def set_llm(payload):
    LlmChat.response = payload if isinstance(payload, str) else json.dumps(payload)


def messages_body(couple_id):
    return {
        "couple_id": couple_id,
        "messages": [
            {"sender": "alice", "content": f"Thanks for today {SECRET}"},
            {"sender": "alex", "content": "Anytime, love you"},
        ],
    }


def argument_body(couple_id):
    return {"couple_id": couple_id, "argument_content": f"You never listen {SECRET}"}


def voice_body(couple_id):
    return {"couple_id": couple_id, "transcript": f"Can we talk? {SECRET}"}


# (path, body factory, needs a working service method)
ALL_POST_ENDPOINTS = [
    ("/api/analyzers/communication/analyze", messages_body),
    ("/api/analyzers/communication/quick-score", messages_body),
    ("/api/analyzers/text/analyze", messages_body),
    ("/api/analyzers/text/tone-variety", messages_body),
    ("/api/analyzers/text/emotional-patterns", messages_body),
    ("/api/analyzers/argument/analyze", argument_body),
    ("/api/analyzers/argument/quick-score", argument_body),
    ("/api/analyzers/voice/analyze", voice_body),
    ("/api/analyzers/voice/speaker-balance", voice_body),
    ("/api/analyzers/emotional/analyze", messages_body),
    ("/api/analyzers/emotional/trend", messages_body),
]
ENDPOINT_IDS = [p.replace("/api/analyzers/", "") for p, _ in ALL_POST_ENDPOINTS]

WORKING_ENDPOINTS = [
    (p, b) for p, b in ALL_POST_ENDPOINTS if not p.endswith(("speaker-balance", "emotional/trend"))
]

# Per-analyzer happy paths: (endpoint, body, canned LLM reply, analyzer name, table)
FULL_ANALYSES = [
    pytest.param(
        "/api/analyzers/communication/analyze",
        messages_body,
        {"overall_score": 81, "listening_score": 77, "recommendations": ["Keep checking in"]},
        "communication",
        "communication_analyses",
        id="communication",
    ),
    pytest.param(
        "/api/analyzers/text/analyze",
        messages_body,
        {"tone_variety_score": 64, "dominant_tones": ["warm"], "recommendations": ["Vary tone"]},
        "text",
        "text_analyses",
        id="text",
    ),
    pytest.param(
        "/api/analyzers/argument/analyze",
        argument_body,
        {
            "conflict_score": 40,
            "escalation_patterns": ["raised voices"],
            "recommendations": ["Pause"],
        },
        "argument",
        "argument_analyses",
        id="argument",
    ),
    pytest.param(
        "/api/analyzers/voice/analyze",
        voice_body,
        {
            "overall_tone_score": 72,
            "tension_indicators": ["interruptions"],
            "recommendations": ["Slow down"],
        },
        "voice",
        "voice_tone_analyses",
        id="voice",
    ),
    pytest.param(
        "/api/analyzers/emotional/analyze",
        messages_body,
        {"pattern_summary": "Warmer over time", "growth_trajectory": "improving"},
        "emotional",
        "emotional_pattern_analyses",
        id="emotional",
    ),
]


# ---------------------------------------------------------------------------
# Authentication & pairing (task 4)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("path,body", ALL_POST_ENDPOINTS, ids=ENDPOINT_IDS)
class TestAccessControl:
    def _assert_denied(self, resp, status, world):
        assert resp.status_code == status
        assert LlmChat.prompts == [], "no analyzer content may reach the LLM for a denied request"
        assert world.all_stored() == []

    def test_missing_auth_is_401(self, client, world, path, body):
        self._assert_denied(client.post(path, json=body(COUPLE_A)), 401, world)

    def test_invalid_token_is_401(self, client, world, path, body):
        resp = client.post(
            path, json=body(COUPLE_A), headers={"Authorization": "Bearer forged-token"}
        )
        self._assert_denied(resp, 401, world)

    def test_client_supplied_user_id_header_is_not_trusted(self, client, world, path, body):
        """The old X-User-ID header is trivially forgeable; identity must come from the JWT."""
        resp = client.post(path, json=body(COUPLE_A), headers={"X-User-ID": ALICE})
        self._assert_denied(resp, 401, world)

    def test_user_outside_the_couple_is_403(self, client, world, path, body):
        self._assert_denied(
            client.post(path, json=body(COUPLE_A), headers=auth(STRANGER)), 403, world
        )

    def test_member_of_a_different_couple_is_403(self, client, world, path, body):
        """Bob is paired — but with Bea, not with couple A."""
        self._assert_denied(client.post(path, json=body(COUPLE_A), headers=auth(BOB)), 403, world)

    def test_unpaired_user_in_a_pending_couple_is_403(self, client, world, path, body):
        """Carl created couple C but no partner has joined: not paired, so no analyzers."""
        self._assert_denied(
            client.post(path, json=body(COUPLE_PENDING), headers=auth(CARL)), 403, world
        )

    @pytest.mark.parametrize("bad_id", ["not-a-uuid", "", "1; drop table couple_units"])
    def test_malformed_couple_id_is_403(self, client, world, path, body, bad_id):
        self._assert_denied(client.post(path, json=body(bad_id), headers=auth(ALICE)), 403, world)


class TestPairedAccess:
    @pytest.mark.parametrize("user", [ALICE, ALEX])
    def test_both_partners_are_equally_allowed(self, client, world, user):
        """Partners are symmetric (00 Master Index principle 3) — neither slot is privileged."""
        set_llm({"overall_score": 80})
        resp = client.post(
            "/api/analyzers/communication/analyze", json=messages_body(COUPLE_A), headers=auth(user)
        )
        assert resp.status_code == 200

    def test_denied_before_availability_check_so_nothing_leaks(self, client, world, monkeypatch):
        monkeypatch.setattr(analyzers_module, "analyzers_available", False)
        resp = client.post(
            "/api/analyzers/communication/analyze",
            json=messages_body(COUPLE_A),
            headers=auth(STRANGER),
        )
        assert resp.status_code == 403

    def test_503_for_a_paired_user_when_analyzers_are_unavailable(self, client, world, monkeypatch):
        monkeypatch.setattr(analyzers_module, "analyzers_available", False)
        resp = client.post(
            "/api/analyzers/communication/analyze",
            json=messages_body(COUPLE_A),
            headers=auth(ALICE),
        )
        assert resp.status_code == 503


# ---------------------------------------------------------------------------
# The five analyzers (task 1) — LLM gateway mocked (task 2)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("path,body_fn,llm_reply,name,table", FULL_ANALYSES)
class TestFullAnalysis:
    def test_returns_the_mocked_llm_analysis(
        self, client, world, path, body_fn, llm_reply, name, table
    ):
        set_llm(llm_reply)

        resp = client.post(path, json=body_fn(COUPLE_A), headers=auth(ALICE))

        assert resp.status_code == 200
        out = resp.json()
        assert out["success"] is True
        assert out["analyzer"] == name
        for key, value in llm_reply.items():
            assert out["data"][key] == value
        assert out["persisted"] is True
        assert len(LlmChat.prompts) == 1  # exactly one gateway call, and it hit the stub

    def test_prompt_sent_to_llm_contains_the_analyzed_content(
        self, client, world, path, body_fn, llm_reply, name, table
    ):
        set_llm(llm_reply)
        client.post(path, json=body_fn(COUPLE_A), headers=auth(ALICE))
        assert SECRET in LlmChat.prompts[0]

    def test_result_is_stored_scoped_to_the_couple(
        self, client, world, path, body_fn, llm_reply, name, table
    ):
        set_llm(llm_reply)

        client.post(path, json=body_fn(COUPLE_A), headers=auth(ALEX))

        (row,) = world.rows[table]
        assert row["couple_id"] == COUPLE_A
        assert row["user_id"] == ALEX  # from the verified JWT
        assert set(row) <= analyzers_module.RESULT_COLUMNS[table] | {
            "couple_id",
            "user_id",
            "created_at",
        }
        for key, value in llm_reply.items():
            assert row[key] == value

    def test_raw_input_is_never_persisted(
        self, client, world, path, body_fn, llm_reply, name, table
    ):
        """03 Safety & Privacy §3: raw analyzer input is High-tier — store results, not input."""
        set_llm(llm_reply)
        client.post(path, json=body_fn(COUPLE_A), headers=auth(ALICE))
        assert SECRET not in json.dumps(world.all_stored())

    def test_llm_output_cannot_redirect_the_stored_couple_id(
        self, client, world, path, body_fn, llm_reply, name, table
    ):
        """A model reply naming another couple must not change whose row this is."""
        set_llm({**llm_reply, "couple_id": COUPLE_B, "user_id": BOB})

        client.post(path, json=body_fn(COUPLE_A), headers=auth(ALICE))

        (row,) = world.rows[table]
        assert (row["couple_id"], row["user_id"]) == (COUPLE_A, ALICE)
        assert world.rows.get("couple_id") is None
        assert all(r["couple_id"] == COUPLE_A for r in world.all_stored())

    def test_unparseable_llm_reply_falls_back_to_defaults(
        self, client, world, path, body_fn, llm_reply, name, table
    ):
        set_llm("Sorry, I can't help with that.")
        resp = client.post(path, json=body_fn(COUPLE_A), headers=auth(ALICE))
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_gateway_outage_is_not_stored_as_a_real_analysis(
        self, client, world, path, body_fn, llm_reply, name, table, monkeypatch
    ):
        async def down(self, prompt):
            raise ConnectionError("gateway unreachable")

        monkeypatch.setattr(LlmChat, "chat", down)

        resp = client.post(path, json=body_fn(COUPLE_A), headers=auth(ALICE))

        assert resp.status_code == 200
        assert resp.json()["data"]["error_occurred"] is True
        assert resp.json()["persisted"] is False
        assert world.rows[table] == []  # canned fallback scores must not pollute history

    def test_storage_failure_still_returns_the_analysis(
        self, client, world, path, body_fn, llm_reply, name, table
    ):
        set_llm(llm_reply)
        world.fail_inserts = True

        resp = client.post(path, json=body_fn(COUPLE_A), headers=auth(ALICE))

        assert resp.status_code == 200
        assert resp.json()["persisted"] is False


class TestQuickScoresAndSecondaryEndpoints:
    @pytest.mark.parametrize(
        "path,body_fn,reply,analyzer",
        [
            (
                "/api/analyzers/communication/quick-score",
                messages_body,
                {"quick_score": 70},
                "communication",
            ),
            ("/api/analyzers/text/tone-variety", messages_body, {"tone_variety_score": 55}, "text"),
            (
                "/api/analyzers/text/emotional-patterns",
                messages_body,
                {"emotional_patterns_detected": []},
                "text",
            ),
            ("/api/analyzers/argument/quick-score", argument_body, {"quick_score": 60}, "argument"),
        ],
    )
    def test_lightweight_endpoints_return_results_without_storing_anything(
        self, client, world, path, body_fn, reply, analyzer
    ):
        set_llm(reply)

        resp = client.post(path, json=body_fn(COUPLE_A), headers=auth(ALICE))

        assert resp.status_code == 200
        assert resp.json()["analyzer"] == analyzer
        assert len(LlmChat.prompts) == 1
        assert world.all_stored() == []

    @pytest.mark.parametrize(
        "path", ["/api/analyzers/voice/speaker-balance", "/api/analyzers/emotional/trend"]
    )
    def test_endpoints_without_a_backing_service_method_return_501_to_members(
        self, client, world, path
    ):
        """Neither VoiceToneAnalyzer nor EmotionalPatternAnalyzer implements these; the routes
        used to raise AttributeError -> 500 after authorizing. 501 is honest."""
        body = voice_body if "voice" in path else messages_body
        resp = client.post(path, json=body(COUPLE_A), headers=auth(ALICE))
        assert resp.status_code == 501
        assert LlmChat.prompts == []


class TestRequestValidation:
    def test_missing_couple_id_is_422(self, client, world):
        resp = client.post(
            "/api/analyzers/communication/analyze",
            json={"messages": [{"sender": "a", "content": "hi"}]},
            headers=auth(ALICE),
        )
        assert resp.status_code == 422

    def test_message_without_content_is_422(self, client, world):
        resp = client.post(
            "/api/analyzers/text/analyze",
            json={"couple_id": COUPLE_A, "messages": [{"sender": "a"}]},
            headers=auth(ALICE),
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# History & summary: strictly couple-scoped (task 3)
# ---------------------------------------------------------------------------


def seed(world, table, couple_id, **fields):
    world.rows[table].append(
        {"couple_id": couple_id, "created_at": "2026-01-01T00:00:00+00:00", **fields}
    )


class TestCoupleScopedReads:
    @pytest.fixture(autouse=True)
    def two_couples_with_data(self, world):
        for table in RESULT_TABLES:
            seed(world, table, COUPLE_A, marker="A-data", overall_score=80)
            seed(world, table, COUPLE_B, marker="B-data", overall_score=20)

    def test_history_returns_only_the_callers_couple(self, client, world):
        resp = client.get(f"/api/analyzers/history/{COUPLE_A}", headers=auth(ALICE))

        assert resp.status_code == 200
        results = resp.json()["results"]
        assert results and all(r["couple_id"] == COUPLE_A for r in results)
        assert "B-data" not in json.dumps(resp.json())

    def test_history_filtered_by_analyzer_is_also_scoped(self, client, world):
        resp = client.get(f"/api/analyzers/history/{COUPLE_B}?analyzer=voice", headers=auth(BOB))
        assert resp.status_code == 200
        assert [r["marker"] for r in resp.json()["results"]] == ["B-data"]

    def test_every_history_query_filters_on_couple_id(self, client, world, fake_supabase):
        client.get(f"/api/analyzers/history/{COUPLE_A}", headers=auth(ALICE))

        for table in RESULT_TABLES:
            selects = fake_supabase.calls_for(table, op="select")
            assert selects, f"{table} was never read"
            for call in selects:
                assert ("eq", "couple_id", COUPLE_A) in call.filters

    def test_summary_returns_only_the_callers_couple(self, client, world, fake_supabase):
        resp = client.get(f"/api/analyzers/summary/{COUPLE_B}", headers=auth(BEA))

        assert resp.status_code == 200
        body = resp.json()
        assert body["couple_id"] == COUPLE_B
        assert {v["score"] for v in body["summary"].values()} == {20}
        for table in RESULT_TABLES:
            for call in fake_supabase.calls_for(table, op="select"):
                assert ("eq", "couple_id", COUPLE_B) in call.filters

    @pytest.mark.parametrize("path", ["history", "summary"])
    @pytest.mark.parametrize(
        "user,couple,status",
        [
            (None, COUPLE_A, 401),
            (STRANGER, COUPLE_A, 403),
            (BOB, COUPLE_A, 403),  # paired, but to someone else
            (ALICE, COUPLE_B, 403),  # reading the neighbour's couple by guessing its id
            (CARL, COUPLE_PENDING, 403),  # unpaired
        ],
    )
    def test_reads_are_denied_across_couples(
        self, client, world, fake_supabase, path, user, couple, status
    ):
        headers = auth(user) if user else {}
        resp = client.get(f"/api/analyzers/{path}/{couple}", headers=headers)

        assert resp.status_code == status
        assert "A-data" not in resp.text and "B-data" not in resp.text
        for table in RESULT_TABLES:
            assert (
                fake_supabase.calls_for(table) == []
            ), "denied requests must not touch result tables"

    def test_history_limit_is_capped_at_100(self, client, world, fake_supabase):
        client.get(
            f"/api/analyzers/history/{COUPLE_A}?analyzer=text&limit=100000", headers=auth(ALICE)
        )
        (call,) = fake_supabase.calls_for("text_analyses", op="select")
        assert ("limit", 100) in call.filters

    def test_one_couples_analysis_never_appears_in_anothers_history(self, client, world):
        set_llm({"overall_score": 91})
        client.post(
            "/api/analyzers/communication/analyze",
            json=messages_body(COUPLE_A),
            headers=auth(ALICE),
        )

        resp = client.get(
            f"/api/analyzers/history/{COUPLE_B}?analyzer=communication", headers=auth(BOB)
        )

        assert all(r.get("overall_score") != 91 for r in resp.json()["results"])
        assert all(r["couple_id"] == COUPLE_B for r in resp.json()["results"])


class TestNoLegacyTables:
    def test_only_the_plural_analyzer_tables_are_used(self, client, world, fake_supabase):
        """Binding rule (00 Master Index §7): never touch the orphaned singular-named tables."""
        set_llm({"overall_score": 80})
        for path, body_fn in WORKING_ENDPOINTS:
            client.post(path, json=body_fn(COUPLE_A), headers=auth(ALICE))
        client.get(f"/api/analyzers/history/{COUPLE_A}", headers=auth(ALICE))
        client.get(f"/api/analyzers/summary/{COUPLE_A}", headers=auth(ALICE))

        touched = {c.table for c in fake_supabase.calls}
        assert touched <= set(RESULT_TABLES) | {"couple_units"}
        assert not touched & {
            "communication_analysis",
            "text_message_analysis",
            "argument_analysis",
            "voice_tone_analysis",
            "emotional_pattern_analysis",
        }
