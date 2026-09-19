"""
Coverage for routes/analyzers.py — the five analyzers (communication, text, argument,
voice tone, emotional pattern).

Everything runs offline: the EMERGENT_LLM_KEY gateway is the stub in
tests/stubs/emergentintegrations/llm/chat.py, and Supabase is an in-memory fake whose
result tables return EVERY row when a query forgets its `couple_id` filter — so a
missing scope shows up as a leak rather than passing by accident.

Privacy rules under test (PRDs'@/03 Safety & Privacy):
  * analyzer data is strictly scoped to `couple_id`
  * requests from users who are not in an active (paired) couple are rejected
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

COUPLE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
COUPLE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
COUPLE_PENDING = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
ALICE, ALEX = "user-alice", "user-alex"  # couple A
BOB, BETH = "user-bob", "user-beth"  # couple B
PENDING_USER = "user-pending"  # user1 of a couple whose partner hasn't joined yet
STRANGER = "user-stranger"  # in no couple at all

# Text that must never be persisted by the backend.
SENTINEL = "SENTINEL-private-words-do-not-store"

RESULT_TABLES = [
    "communication_analyses",
    "text_analyses",
    "argument_analyses",
    "voice_tone_analyses",
    "emotional_pattern_analyses",
]

TOKENS = {
    "tok-alice": ALICE,
    "tok-alex": ALEX,
    "tok-bob": BOB,
    "tok-beth": BETH,
    "tok-pending": PENDING_USER,
    "tok-stranger": STRANGER,
}


class AnalyzerWorld:
    """In-memory Supabase: couples, session tokens and the five result tables."""

    def __init__(self, fake_supabase):
        self.fake = fake_supabase
        self.couples = [
            {"id": COUPLE_A, "user1_id": ALICE, "user2_id": ALEX, "status": "active"},
            {"id": COUPLE_B, "user1_id": BOB, "user2_id": BETH, "status": "active"},
            {"id": COUPLE_PENDING, "user1_id": PENDING_USER, "user2_id": None, "status": "pending"},
        ]
        self.rows = {t: [] for t in RESULT_TABLES}
        self.fail_inserts = False
        fake_supabase.table_results["couple_units"] = self._couple_units
        for table in RESULT_TABLES:
            fake_supabase.table_results[table] = self._result_table(table)
        fake_supabase.auth = SimpleNamespace(get_user=self._get_user)

    def _get_user(self, token):
        if token not in TOKENS:
            raise ValueError("invalid JWT")
        return SimpleNamespace(user=SimpleNamespace(id=TOKENS[token]))

    def _couple_units(self, query):
        eqs = {f[1]: f[2] for f in query.filters if f[0] == "eq"}
        or_expr = next((f[1] for f in query.filters if f[0] == "or"), "")
        members = {part.split(".eq.")[1] for part in or_expr.split(",") if ".eq." in part}
        data = [
            {"id": c["id"]}
            for c in self.couples
            if c["id"] == eqs.get("id")
            and c["status"] == eqs.get("status")
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
            couple_filter = [f[2] for f in query.filters if f[0] == "eq" and f[1] == "couple_id"]
            rows = self.rows[table]
            if couple_filter:
                rows = [r for r in rows if r["couple_id"] == couple_filter[0]]
            limit = next((f[1] for f in query.filters if f[0] == "limit"), None)
            return FakeResult(data=rows[:limit] if limit else rows)

        return producer

    def all_stored(self):
        return [(t, r) for t, rows in self.rows.items() for r in rows]


@pytest.fixture
def world(fake_supabase, monkeypatch):
    monkeypatch.setattr(analyzers_module, "get_supabase", lambda: fake_supabase)
    monkeypatch.setattr(LlmChat, "prompts", [])
    monkeypatch.setattr(LlmChat, "response", json.dumps({}))
    return AnalyzerWorld(fake_supabase)


@pytest.fixture
def client(world):
    app = FastAPI()
    app.include_router(analyzers_module.router)
    return TestClient(app)


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def messages_body(couple_id):
    return {
        "couple_id": couple_id,
        "messages": [
            {"sender": "a", "content": SENTINEL, "timestamp": "2026-01-01T10:00:00+00:00"},
            {
                "sender": "b",
                "content": "thanks for telling me",
                "timestamp": "2026-01-01T10:01:00+00:00",
            },
        ],
    }


def argument_body(couple_id):
    return {"couple_id": couple_id, "argument_content": SENTINEL}


def voice_body(couple_id):
    return {"couple_id": couple_id, "transcript": SENTINEL}


# (path, body builder) for every POST endpoint on the router
POST_ENDPOINTS = [
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

GET_ENDPOINTS = [
    "/api/analyzers/history/{couple_id}",
    "/api/analyzers/summary/{couple_id}",
]


class TestRejectsUnpairedAndUnauthenticatedUsers:
    """No analyzer runs — and the LLM gateway is never contacted — for anyone who
    is not a member of an ACTIVE couple unit."""

    @pytest.mark.parametrize("path,body", POST_ENDPOINTS)
    def test_missing_credentials_is_401(self, client, world, path, body):
        resp = client.post(path, json=body(COUPLE_A))
        assert resp.status_code == 401
        assert LlmChat.prompts == []

    @pytest.mark.parametrize("path,body", POST_ENDPOINTS)
    def test_invalid_session_token_is_401(self, client, world, path, body):
        resp = client.post(path, json=body(COUPLE_A), headers=auth("forged-token"))
        assert resp.status_code == 401
        assert LlmChat.prompts == []

    @pytest.mark.parametrize("path,body", POST_ENDPOINTS)
    def test_user_without_any_couple_is_403(self, client, world, path, body):
        resp = client.post(path, json=body(COUPLE_A), headers=auth("tok-stranger"))
        assert resp.status_code == 403
        assert LlmChat.prompts == []
        assert world.all_stored() == []

    @pytest.mark.parametrize("path,body", POST_ENDPOINTS)
    def test_member_of_a_different_couple_is_403(self, client, world, path, body):
        resp = client.post(path, json=body(COUPLE_A), headers=auth("tok-bob"))
        assert resp.status_code == 403
        assert LlmChat.prompts == []
        assert world.all_stored() == []

    @pytest.mark.parametrize("path,body", POST_ENDPOINTS)
    def test_unpaired_user_in_pending_couple_is_403(self, client, world, path, body):
        """Signed up and holds a pair code, but the partner hasn't joined yet."""
        resp = client.post(path, json=body(COUPLE_PENDING), headers=auth("tok-pending"))
        assert resp.status_code == 403
        assert LlmChat.prompts == []

    @pytest.mark.parametrize("path,body", POST_ENDPOINTS)
    def test_malformed_couple_id_is_403(self, client, world, path, body):
        resp = client.post(path, json=body("not-a-uuid"), headers=auth("tok-alice"))
        assert resp.status_code == 403

    @pytest.mark.parametrize("path,body", POST_ENDPOINTS)
    def test_client_supplied_user_id_header_is_not_trusted(self, client, world, path, body):
        """The old contract trusted `X-User-ID`; anyone could claim to be a member."""
        resp = client.post(path, json=body(COUPLE_A), headers={"X-User-ID": ALICE})
        assert resp.status_code == 401
        assert LlmChat.prompts == []

    @pytest.mark.parametrize("path", GET_ENDPOINTS)
    def test_history_and_summary_reject_non_members(self, client, world, path):
        url = path.format(couple_id=COUPLE_A)
        assert client.get(url).status_code == 401
        assert client.get(url, headers=auth("tok-bob")).status_code == 403
        assert client.get(url, headers=auth("tok-stranger")).status_code == 403

    def test_history_rejects_pending_couple_member(self, client, world):
        resp = client.get(f"/api/analyzers/history/{COUPLE_PENDING}", headers=auth("tok-pending"))
        assert resp.status_code == 403


class TestCommunicationAnalyzer:
    LLM = {
        "overall_score": 81,
        "response_time_score": 70,
        "listening_score": 88,
        "tone_consistency_score": 76,
        "strengths": ["Warm openings"],
        "recommendations": ["Reflect back what you heard"],
    }

    def test_full_analysis(self, client, world):
        LlmChat.response = json.dumps(self.LLM)
        resp = client.post(
            "/api/analyzers/communication/analyze",
            json=messages_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True and body["analyzer"] == "communication"
        assert body["data"]["overall_score"] == 81
        assert body["data"]["couple_id"] == COUPLE_A
        assert body["persisted"] is True
        assert len(LlmChat.prompts) == 1  # exactly one gateway call
        assert SENTINEL in LlmChat.prompts[0]  # the analyzer did receive the input...

    def test_result_is_stored_for_the_couple_only(self, client, world):
        LlmChat.response = json.dumps(self.LLM)
        client.post(
            "/api/analyzers/communication/analyze",
            json=messages_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        (row,) = world.rows["communication_analyses"]
        assert row["couple_id"] == COUPLE_A
        assert row["user_id"] == ALICE
        assert row["overall_score"] == 81 and row["listening_score"] == 88

    def test_quick_score_returns_result_without_storing(self, client, world):
        LlmChat.response = json.dumps(
            {
                "quick_score": 64,
                "key_positive": "kind tone",
                "key_negative": "rushed",
                "sentiment": "positive",
            }
        )
        resp = client.post(
            "/api/analyzers/communication/quick-score",
            json=messages_body(COUPLE_A),
            headers=auth("tok-alex"),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["quick_score"] == 64
        assert world.all_stored() == []


class TestTextAnalyzer:
    def test_full_analysis_is_stored(self, client, world):
        LlmChat.response = json.dumps(
            {
                "tone_variety_score": 72,
                "dominant_tones": ["warm"],
                "clarity_score": 80,
                "recommendations": ["Vary your openers"],
            }
        )
        resp = client.post(
            "/api/analyzers/text/analyze", json=messages_body(COUPLE_A), headers=auth("tok-alice")
        )
        assert resp.status_code == 200
        assert resp.json()["analyzer"] == "text"
        (row,) = world.rows["text_analyses"]
        assert row["couple_id"] == COUPLE_A and row["tone_variety_score"] == 72

    def test_tone_variety(self, client, world):
        LlmChat.response = json.dumps(
            {"tone_variety_score": 66, "dominant_tones": ["playful"], "unique_expressions": 4}
        )
        resp = client.post(
            "/api/analyzers/text/tone-variety",
            json=messages_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["tone_variety_score"] == 66

    def test_emotional_patterns(self, client, world):
        LlmChat.response = json.dumps(
            {"emotional_patterns_detected": ["withdrawal"], "trigger_words": ["always"]}
        )
        resp = client.post(
            "/api/analyzers/text/emotional-patterns",
            json=messages_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        assert resp.status_code == 200
        assert resp.json()["analyzer"] == "text"


class TestArgumentAnalyzer:
    def test_full_analysis_is_stored(self, client, world):
        LlmChat.response = json.dumps(
            {
                "conflict_score": 42,
                "escalation_patterns": ["raised voices"],
                "repair_opportunities": ["pause"],
                "recommendations": ["Take a break"],
            }
        )
        resp = client.post(
            "/api/analyzers/argument/analyze",
            json=argument_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        assert resp.status_code == 200
        assert resp.json()["analyzer"] == "argument"
        assert SENTINEL in LlmChat.prompts[0]
        (row,) = world.rows["argument_analyses"]
        assert row["couple_id"] == COUPLE_A and row["conflict_score"] == 42

    def test_quick_score(self, client, world):
        LlmChat.response = json.dumps(
            {
                "quick_score": 55,
                "conflict_handling_summary": "some progress",
                "top_improvement": "listen",
            }
        )
        resp = client.post(
            "/api/analyzers/argument/quick-score",
            json=argument_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["quick_score"] == 55
        assert world.all_stored() == []


class TestVoiceToneAnalyzer:
    def test_full_analysis_is_stored(self, client, world):
        LlmChat.response = json.dumps(
            {
                "overall_tone_score": 77,
                "tension_indicators": ["clipped replies"],
                "warmth_indicators": ["laughter"],
                "recommendations": ["Slow down"],
            }
        )
        resp = client.post(
            "/api/analyzers/voice/analyze", json=voice_body(COUPLE_A), headers=auth("tok-alice")
        )
        assert resp.status_code == 200
        assert resp.json()["analyzer"] == "voice"
        assert SENTINEL in LlmChat.prompts[0]  # flat transcript reaches the analyzer
        (row,) = world.rows["voice_tone_analyses"]
        assert row["couple_id"] == COUPLE_A and row["overall_tone_score"] == 77

    def test_speaker_segments_are_forwarded_instead_of_the_flat_transcript(self, client, world):
        LlmChat.response = json.dumps({"overall_tone_score": 70})
        body = voice_body(COUPLE_A)
        body["speaker_segments"] = [{"speaker": "a", "content": "segment-one-text"}]
        client.post("/api/analyzers/voice/analyze", json=body, headers=auth("tok-alice"))
        assert "segment-one-text" in LlmChat.prompts[0]

    def test_speaker_balance_is_explicitly_not_implemented(self, client, world):
        resp = client.post(
            "/api/analyzers/voice/speaker-balance",
            json=voice_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        assert resp.status_code == 501
        assert LlmChat.prompts == []


class TestEmotionalPatternAnalyzer:
    def test_full_analysis_is_stored(self, client, world):
        LlmChat.response = json.dumps(
            {
                "pattern_summary": "Tension after work",
                "growth_trajectory": "improving",
                "recommendations": ["Check in earlier"],
            }
        )
        resp = client.post(
            "/api/analyzers/emotional/analyze",
            json=messages_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        assert resp.status_code == 200
        assert resp.json()["analyzer"] == "emotional"
        assert SENTINEL in LlmChat.prompts[0]
        (row,) = world.rows["emotional_pattern_analyses"]
        assert row["couple_id"] == COUPLE_A and row["growth_trajectory"] == "improving"

    def test_trend_is_explicitly_not_implemented(self, client, world):
        resp = client.post(
            "/api/analyzers/emotional/trend",
            json=messages_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        assert resp.status_code == 501
        assert LlmChat.prompts == []


class TestCoupleScopedData:
    """PRDs'@/03 §3, §6 — couple-scoped data boundaries and minimum retention."""

    def _analyze_everything(self, client, couple_id, token):
        LlmChat.response = json.dumps(
            {
                "overall_score": 60,
                "tone_variety_score": 60,
                "conflict_score": 30,
                "overall_tone_score": 60,
                "pattern_summary": "x",
                "recommendations": ["r"],
            }
        )
        for path, body in POST_ENDPOINTS:
            if path.endswith(("/analyze",)):
                assert (
                    client.post(path, json=body(couple_id), headers=auth(token)).status_code == 200
                )

    def test_every_stored_row_carries_the_authorized_couple_id(self, client, world):
        self._analyze_everything(client, COUPLE_A, "tok-alice")
        self._analyze_everything(client, COUPLE_B, "tok-bob")
        stored = world.all_stored()
        assert len(stored) == 10
        for table, row in stored:
            assert row["couple_id"] in (COUPLE_A, COUPLE_B), table
        assert {r["couple_id"] for t, r in stored if r["user_id"] == ALICE} == {COUPLE_A}
        assert {r["couple_id"] for t, r in stored if r["user_id"] == BOB} == {COUPLE_B}

    def test_analyzer_output_cannot_redirect_storage_to_another_couple(self, client, world):
        """A malicious/hallucinated LLM reply naming another couple must not change
        where the row is stored — the couple comes from the authorized request."""
        LlmChat.response = json.dumps({"overall_score": 50, "couple_id": COUPLE_B, "user_id": BOB})
        client.post(
            "/api/analyzers/communication/analyze",
            json=messages_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        (row,) = world.rows["communication_analyses"]
        assert row["couple_id"] == COUPLE_A and row["user_id"] == ALICE

    def test_history_only_returns_the_callers_couple(self, client, world):
        self._analyze_everything(client, COUPLE_A, "tok-alice")
        self._analyze_everything(client, COUPLE_B, "tok-bob")

        resp = client.get(f"/api/analyzers/history/{COUPLE_A}", headers=auth("tok-alex"))
        assert resp.status_code == 200
        body = resp.json()
        assert body["count"] == 5
        assert {r["couple_id"] for r in body["results"]} == {COUPLE_A}

        other = client.get(f"/api/analyzers/history/{COUPLE_B}", headers=auth("tok-beth")).json()
        assert {r["couple_id"] for r in other["results"]} == {COUPLE_B}

    def test_every_history_query_is_filtered_by_couple_id(self, client, world, fake_supabase):
        client.get(f"/api/analyzers/history/{COUPLE_A}", headers=auth("tok-alice"))
        client.get(f"/api/analyzers/history/{COUPLE_A}?analyzer=text", headers=auth("tok-alice"))
        client.get(f"/api/analyzers/summary/{COUPLE_A}", headers=auth("tok-alice"))
        for table in RESULT_TABLES:
            for call in fake_supabase.calls_for(table, op="select"):
                assert ("eq", "couple_id", COUPLE_A) in call.filters, table

    def test_history_analyzer_filter_reads_a_single_table(self, client, world, fake_supabase):
        resp = client.get(
            f"/api/analyzers/history/{COUPLE_A}?analyzer=argument", headers=auth("tok-alice")
        )
        assert resp.status_code == 200
        assert [c.table for c in fake_supabase.calls if c.table in RESULT_TABLES] == [
            "argument_analyses"
        ]

    def test_history_limit_is_capped_at_100(self, client, world, fake_supabase):
        client.get(
            f"/api/analyzers/history/{COUPLE_A}?analyzer=text&limit=100000",
            headers=auth("tok-alice"),
        )
        (call,) = fake_supabase.calls_for("text_analyses", op="select")
        assert ("limit", 100) in call.filters

    def test_summary_returns_latest_per_analyzer_for_the_couple(self, client, world):
        world.rows["communication_analyses"] += [
            {"couple_id": COUPLE_A, "overall_score": 91, "recommendations": ["keep going"]},
            {"couple_id": COUPLE_B, "overall_score": 12, "recommendations": ["other couple"]},
        ]
        resp = client.get(f"/api/analyzers/summary/{COUPLE_A}", headers=auth("tok-alice"))
        assert resp.status_code == 200
        summary = resp.json()["summary"]
        assert summary["communication"]["score"] == 91
        assert summary["communication"]["key_insight"] == "keep going"
        assert "other couple" not in json.dumps(resp.json())

    def test_raw_input_is_never_persisted_or_echoed(self, client, world):
        """High-sensitivity tier: only derived scores are kept, never the raw text."""
        LlmChat.response = json.dumps({"overall_score": 70, "recommendations": ["r"]})
        for path, body in POST_ENDPOINTS:
            if path.endswith("/analyze"):
                resp = client.post(path, json=body(COUPLE_A), headers=auth("tok-alice"))
                assert SENTINEL not in resp.text, path
        assert world.all_stored()
        assert SENTINEL not in json.dumps(world.all_stored(), default=str)

    def test_stored_rows_only_use_columns_that_exist_in_the_schema(self, client, world):
        LlmChat.response = json.dumps(
            {"overall_score": 70, "strengths": ["not a column"], "message_count": 2, "extra": 1}
        )
        client.post(
            "/api/analyzers/communication/analyze",
            json=messages_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        (row,) = world.rows["communication_analyses"]
        allowed = analyzers_module.RESULT_COLUMNS["communication_analyses"] | {
            "couple_id",
            "user_id",
            "created_at",
        }
        assert set(row) <= allowed

    def test_result_columns_match_the_schema_file(self):
        """Guard against drift between the whitelist and supabase/bond_schema.sql."""
        import os
        import re

        schema_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "supabase", "bond_schema.sql"
        )
        schema = open(schema_path).read()
        for table, cols in analyzers_module.RESULT_COLUMNS.items():
            block = re.search(
                rf"CREATE TABLE IF NOT EXISTS {table} \((.*?)\n\);", schema, re.S
            ).group(1)
            defined = {line.split()[0] for line in block.strip().splitlines()}
            assert cols <= defined, f"{table}: {cols - defined} not in schema"

    def test_singular_orphan_tables_are_never_queried(self, client, world, fake_supabase):
        """PRDs'@/00 §7: communication_analysis etc. are orphaned tables."""
        self._analyze_everything(client, COUPLE_A, "tok-alice")
        client.get(f"/api/analyzers/history/{COUPLE_A}", headers=auth("tok-alice"))
        client.get(f"/api/analyzers/summary/{COUPLE_A}", headers=auth("tok-alice"))
        touched = {c.table for c in fake_supabase.calls}
        assert not touched & {
            "communication_analysis",
            "text_message_analysis",
            "argument_analysis",
            "voice_tone_analysis",
            "emotional_pattern_analysis",
        }


class TestResilience:
    def test_unparseable_llm_output_falls_back_to_defaults(self, client, world):
        LlmChat.response = "sorry, I can't help with that"
        resp = client.post(
            "/api/analyzers/communication/analyze",
            json=messages_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        assert resp.status_code == 200
        assert isinstance(resp.json()["data"]["overall_score"], int)

    def test_gateway_outage_does_not_store_fallback_scores_as_a_real_analysis(
        self, client, world, monkeypatch
    ):
        async def down(self, prompt):
            raise ConnectionError("gateway unreachable")

        monkeypatch.setattr(LlmChat, "chat", down)
        resp = client.post(
            "/api/analyzers/argument/analyze",
            json=argument_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["error_occurred"] is True
        assert resp.json()["persisted"] is False
        assert world.all_stored() == []

    def test_storage_failure_still_returns_the_analysis(self, client, world):
        LlmChat.response = json.dumps({"overall_score": 70})
        world.fail_inserts = True
        resp = client.post(
            "/api/analyzers/communication/analyze",
            json=messages_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        assert resp.status_code == 200
        assert resp.json()["persisted"] is False
        assert resp.json()["data"]["overall_score"] == 70

    def test_503_when_analyzer_services_are_unavailable(self, client, world, monkeypatch):
        monkeypatch.setattr(analyzers_module, "analyzers_available", False)
        resp = client.post(
            "/api/analyzers/communication/analyze",
            json=messages_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        assert resp.status_code == 503

    def test_unavailable_services_do_not_reveal_anything_to_non_members(
        self, client, world, monkeypatch
    ):
        monkeypatch.setattr(analyzers_module, "analyzers_available", False)
        resp = client.post(
            "/api/analyzers/communication/analyze",
            json=messages_body(COUPLE_A),
            headers=auth("tok-bob"),
        )
        assert resp.status_code == 403

    def test_offline_key_is_never_needed(self, client, world, monkeypatch):
        """The gateway is stubbed: no real EMERGENT_LLM_KEY is read or sent anywhere."""
        monkeypatch.delenv("EMERGENT_LLM_KEY", raising=False)
        LlmChat.response = json.dumps({"overall_score": 70})
        resp = client.post(
            "/api/analyzers/communication/analyze",
            json=messages_body(COUPLE_A),
            headers=auth("tok-alice"),
        )
        assert resp.status_code == 200
