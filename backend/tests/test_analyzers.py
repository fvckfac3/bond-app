"""
routes/analyzers.py + services/analyzers.py — the four text analyzers.

Offline: schema-enforcing InMemoryDB and the LLM stub. Privacy requirements under test
(PRDs'@/03 Safety & Privacy §3, §5, §6; 01 Core Systems §5):
  * only partners of an ACTIVE couple can run an analysis for it; results are couple-scoped
  * raw input (messages / pasted conversations) is never stored
  * speakers are anonymized, and quotes of the input never reach the stored or returned result
  * risk language always surfaces the safety note; failures are never stored as analyses
"""

import json
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from emergentintegrations.llm.chat import LlmChat
from fake_db import InMemoryDB
from fastapi import FastAPI
from fastapi.testclient import TestClient

from routes import analyzers as analyzers_module
from routes import deps
from services import safety
from services.analyzers import ANALYZERS, remove_quotes

ALICE, ALEX, STRANGER, CARL = (
    "aaaaaaaa-0000-0000-0000-000000000001",
    "aaaaaaaa-0000-0000-0000-000000000002",
    "aaaaaaaa-0000-0000-0000-000000000009",
    "aaaaaaaa-0000-0000-0000-000000000005",
)
COUPLE, PENDING = "cccccccc-0000-0000-0000-000000000001", "cccccccc-0000-0000-0000-000000000002"
TOKENS = {"token-alice": ALICE, "token-alex": ALEX, "token-stranger": STRANGER, "token-carl": CARL}
SECRET = "SECRET raw words that must never be stored anywhere"
TRANSCRIPT = (
    "Sam: I felt left out when plans changed without asking me.\n"
    "Jo: I'm sorry, I didn't realize it mattered that much. Can we plan together next time?\n"
    f"Sam: Yes, I'd like that. {SECRET}"
)


def reply(**extra):
    base = {
        "summary": "Partner A raised a concern gently and Partner B responded with an apology and a plan.",
        "overall_score": 82,
        "strengths": ["A gentle start-up", "A quick repair"],
        "patterns": [
            {"pattern": "Soft start-up", "detail": "The concern was raised as a feeling."}
        ],
        "recommendations": ["Plan changes together"],
        "try_saying": ["Can we check in before we change plans?"],
        "strength_affirmation": "You repair quickly.",
        "safety_note": None,
        # every analyzer's extra fields, so one reply fits all four
        "sentiment": "warm",
        "listening_score": 80,
        "engagement_score": 75,
        "tone_variety_score": 60,
        "emotional_depth_score": 70,
        "clarity_score": 85,
        "dominant_tones": ["caring", "practical"],
        "severity_level": "low",
        "primary_concern": "Being included in plans",
        "escalation_patterns": [],
        "repair_opportunities": ["An early check-in"],
        "emotional_trends": ["Feeling included"],
        "growth_trajectory": "Moving toward more joint planning.",
    }
    base.update(extra)
    return json.dumps(base)


@pytest.fixture
def world(monkeypatch):
    db = InMemoryDB()
    db.auth = SimpleNamespace(
        get_user=lambda t: (
            SimpleNamespace(user=SimpleNamespace(id=TOKENS[t]))
            if t in TOKENS
            else (_ for _ in ()).throw(Exception("bad jwt"))
        )
    )
    db.seed("couple_units", id=COUPLE, user1_id=ALICE, user2_id=ALEX, status="active")
    db.seed("couple_units", id=PENDING, user1_id=CARL, user2_id=None, status="pending")
    now = datetime.now(timezone.utc)
    for i in range(8):
        db.seed(
            "messages",
            couple_unit_id=COUPLE,
            sender_id=ALICE if i % 2 == 0 else ALEX,
            message_text=f"message {i} {SECRET if i == 3 else ''}",
            created_at=(now - timedelta(hours=8 - i)).isoformat(),
        )
    monkeypatch.setattr(deps, "get_supabase", lambda: db)
    monkeypatch.setenv("EMERGENT_LLM_KEY", "test-key")
    LlmChat.reset()
    LlmChat.response = reply()
    app = FastAPI()
    app.include_router(analyzers_module.router)
    return SimpleNamespace(db=db, client=TestClient(app))


def run(w, kind="communication", user="alice", **body):
    payload = {"couple_id": COUPLE, **body}
    return w.client.post(
        f"/api/analyzers/{kind}/analyze",
        json=payload,
        headers={"Authorization": f"Bearer token-{user}"},
    )


def stored_values(db):
    for spec in ANALYZERS.values():
        for row in db.rows(spec.table):
            yield json.dumps(row, default=str)


class TestAccess:
    def test_requires_authentication(self, world):
        resp = world.client.post("/api/analyzers/communication/analyze", json={"couple_id": COUPLE})
        assert resp.status_code == 401

    def test_only_partners_of_an_active_couple(self, world):
        assert run(world, user="stranger").status_code == 403
        assert run(world, user="carl", couple_id=PENDING).status_code == 403
        assert run(world, couple_id="not-a-uuid").status_code == 403
        assert LlmChat.prompts == []

    def test_unknown_and_voice_analyzers_are_not_offered(self, world):
        assert run(world, kind="voice").status_code == 404
        assert run(world, kind="nope").status_code == 404


@pytest.mark.parametrize("kind", sorted(ANALYZERS))
def test_each_analyzer_stores_a_couple_scoped_derived_result(world, kind):
    resp = run(world, kind=kind)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["persisted"] is True and body["result"]["overall_score"] == 82
    rows = world.db.rows(ANALYZERS[kind].table)
    assert len(rows) == 1
    assert rows[0]["couple_id"] == COUPLE and rows[0]["user_id"] == ALICE
    assert rows[0]["result"]["summary"].startswith("Partner A")


class TestPrivacy:
    def test_in_app_messages_are_loaded_server_side_and_anonymized(self, world):
        run(world)
        prompt = LlmChat.prompts[-1]
        assert "Partner A: message 0" in prompt and "Partner B: message 1" in prompt
        assert ALICE not in prompt and ALEX not in prompt

    def test_raw_input_is_never_stored(self, world):
        run(world)
        run(world, kind="argument", source="transcript", transcript=TRANSCRIPT)
        assert all(SECRET not in value for value in stored_values(world.db))

    def test_quotes_of_the_input_are_removed(self, world):
        LlmChat.response = reply(
            summary=f'Partner A said "{SECRET}" and Partner B listened.',
            strengths=["Partner A said I felt left out when plans changed without asking me"],
        )
        body = run(world, source="transcript", transcript=TRANSCRIPT).json()
        text = json.dumps(body["result"])
        assert SECRET not in text and "left out when plans changed without asking" not in text
        assert all(SECRET not in value for value in stored_values(world.db))

    def test_system_prompt_carries_the_safety_rules(self, world):
        run(world)
        system = LlmChat.system_messages[-1]
        assert "Never take sides" in system and "Partner A" in system and "never quote" in system


class TestInputAndFailures:
    def test_needs_enough_messages(self, world):
        world.db.tables["messages"].clear()
        resp = run(world)
        assert resp.status_code == 422 and "paste a conversation" in resp.json()["detail"]

    def test_pasted_transcript_limits(self, world):
        assert run(world, source="transcript", transcript="too short").status_code == 422
        assert run(world, source="transcript", transcript="x" * 12001).status_code == 422

    def test_risk_language_surfaces_the_safety_note(self, world):
        body = run(
            world,
            kind="argument",
            source="transcript",
            transcript=TRANSCRIPT + "\nJo: If you leave I will hurt you.",
        ).json()
        assert body["result"]["safety_note"] == safety.SAFETY_NOTE

    def test_model_failure_is_reported_and_not_stored(self, world):
        LlmChat.response = "not json"
        assert run(world).status_code == 502
        LlmChat.response = reply(strengths=[])
        assert run(world).status_code == 502
        assert list(stored_values(world.db)) == []

    def test_unconfigured_llm(self, world, monkeypatch):
        monkeypatch.delenv("EMERGENT_LLM_KEY")
        assert run(world).status_code == 503

    def test_free_tier_counts_analyzer_runs(self, world):
        for _ in range(5):
            assert run(world).status_code == 200
        assert run(world).status_code == 402


def test_remove_quotes_keeps_original_wording():
    source = "I felt left out when plans changed without asking me"
    assert remove_quotes("You both repaired quickly.", source) == "You both repaired quickly."
    assert "[a message]" in remove_quotes(
        'Partner A said "I felt left out when plans changed"', source
    )
