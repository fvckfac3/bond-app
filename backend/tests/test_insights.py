"""
routes/insights.py — server-side AI insights.

Runs offline against the schema-enforcing InMemoryDB (tests/fake_db.py) and the LLM stub.
Covers: authentication and ownership, the paired-visibility gate for partner data, never
sending free text to the model, idempotent claim-first generation, failures never stored as
insights, the free-tier allowance, and couple delivery to both partners.
"""

import json
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from emergentintegrations.llm.chat import LlmChat
from fake_db import InMemoryDB
from fastapi import FastAPI
from fastapi.testclient import TestClient

from routes import deps
from routes import insights as insights_module
from services import safety

ALICE, ALEX, STRANGER = (
    "aaaaaaaa-0000-0000-0000-000000000001",
    "aaaaaaaa-0000-0000-0000-000000000002",
    "aaaaaaaa-0000-0000-0000-000000000009",
)
COUPLE = "cccccccc-0000-0000-0000-000000000001"
S_ALICE_LL, S_ALEX_LL, S_ALEX_FIN, S_ALICE_OPEN = (
    "5e55e55e-0000-0000-0000-000000000001",
    "5e55e55e-0000-0000-0000-000000000002",
    "5e55e55e-0000-0000-0000-000000000003",
    "5e55e55e-0000-0000-0000-000000000004",
)
RESULT = "7e501700-0000-0000-0000-000000000001"
TOKENS = {"token-alice": ALICE, "token-alex": ALEX, "token-stranger": STRANGER}
SECRET_NOTE = "SECRET-free-text-a-partner-wrote"

INDIVIDUAL_REPLY = {
    "headline": "You show care in steady, practical ways",
    "summary": "Your scores point to acts of service as your strongest way of feeling loved.",
    "strengths": ["Noticing practical needs"],
    "growth_edges": ["Saying the words out loud more often"],
    "connections": None,
    "try_this_week": ["Name one thing you appreciated each evening"],
    "reflection_question": "When do you feel most cared for?",
    "safety_note": None,
}
COUPLE_REPLY = {
    "headline": "Two different dialects of care",
    "narrative": "Alice and Alex both value closeness and show it differently.",
    "shared_strengths": ["Quality time"],
    "growth_opportunities": ["Translating care into each other's language"],
    "how_you_differ": None,
    "conversation_starters": ["What made you feel loved this week?"],
    "try_together": ["Plan one phone-free evening"],
    "strength_affirmation": "You both keep choosing time together.",
    "safety_note": None,
}


def scores(overall, dims=(("Words of Affirmation", 70), ("Acts of Service", 85))):
    return {
        "overallScore": overall,
        "band": {"title": "Strong"},
        "dimensionScores": [
            {"key": k.lower(), "label": k, "score": v, "direction": "positive"} for k, v in dims
        ],
        "strengths": [{"label": dims[-1][0]}],
        "growthAreas": [{"label": dims[0][0]}],
    }


@pytest.fixture
def world(monkeypatch):
    db = InMemoryDB()
    db.auth = SimpleNamespace(
        get_user=lambda token: (
            SimpleNamespace(user=SimpleNamespace(id=TOKENS[token]))
            if token in TOKENS
            else (_ for _ in ()).throw(Exception("bad jwt"))
        )
    )
    now = datetime.now(timezone.utc).isoformat()
    for uid, name in ((ALICE, "Alice Smith"), (ALEX, "Alex Jones"), (STRANGER, "Sam")):
        db.seed("users", id=uid, email=f"{name}@x.test", name=name, pair_code=name[:4])
    db.seed("couple_units", id=COUPLE, user1_id=ALICE, user2_id=ALEX, status="active")
    db.seed(
        "assessments", id="love-languages", name="Love Languages", framework="Five Love Languages"
    )
    db.seed(
        "assessments", id="financial-values", name="Financial Values", framework="Financial Therapy"
    )
    db.seed(
        "assessments", id="attachment-style", name="Attachment Style", framework="Attachment Theory"
    )
    db.seed(
        "assessment_sessions",
        id=S_ALICE_LL,
        user_id=ALICE,
        assessment_id="love-languages",
        completed=True,
        scores=scores(78),
        submitted_at=now,
    )
    db.seed(
        "assessment_sessions",
        id=S_ALEX_LL,
        user_id=ALEX,
        assessment_id="love-languages",
        completed=True,
        scores=scores(64),
        submitted_at=now,
    )
    # Alex has a result for an assessment Alice hasn't taken: it must not reach Alice's insight.
    db.seed(
        "assessment_sessions",
        id=S_ALEX_FIN,
        user_id=ALEX,
        assessment_id="financial-values",
        completed=True,
        scores=scores(55, (("Money Talks", 55),)),
        submitted_at=now,
    )
    db.seed(
        "assessment_sessions",
        id=S_ALICE_OPEN,
        user_id=ALICE,
        assessment_id="attachment-style",
        completed=False,
        scores=None,
    )
    db.seed(
        "couple_results",
        id=RESULT,
        couple_unit_id=COUPLE,
        assessment_id="love-languages",
        partner1_id=ALICE,
        partner2_id=ALEX,
        compatibility_score=81,
        dimension_comparisons=[
            {
                "key": "words",
                "label": "Words of Affirmation",
                "leftScore": 70,
                "rightScore": 50,
                "gap": 20,
            }
        ],
        shared_strengths=[{"label": "Quality Time"}],
        shared_growth_areas=[],
        asymmetry_flags=[],
        relationship_pattern_title="Secure Foundation",
        created_at=now,
    )
    db.seed(
        "daily_check_ins",
        user_id=ALEX,
        couple_unit_id=COUPLE,
        date=datetime.now(timezone.utc).date().isoformat(),
        connection_score=8,
        mood_note=SECRET_NOTE,
        appreciation=SECRET_NOTE,
    )
    db.seed("user_push_tokens", user_id=ALICE, token="ExponentPushToken[alice]")
    db.seed("user_push_tokens", user_id=ALEX, token="ExponentPushToken[alex]")

    monkeypatch.setattr(deps, "get_supabase", lambda: db)
    monkeypatch.setenv("EMERGENT_LLM_KEY", "test-key")
    pushes = []

    async def fake_push(_db, user_ids, title, body, data=None):
        pushes.append({"to": list(user_ids), "title": title, "data": data})
        return len(user_ids)

    monkeypatch.setattr(insights_module, "send_push", fake_push)
    LlmChat.reset()
    app = FastAPI()
    app.include_router(insights_module.router)
    return SimpleNamespace(db=db, client=TestClient(app), pushes=pushes)


def auth(user):
    return {"Authorization": f"Bearer token-{user}"}


def post(w, path, user="alice"):
    return w.client.post(path, headers=auth(user))


# ------------------------------------------------------------------ individual
class TestIndividualInsight:
    def test_requires_authentication(self, world):
        assert world.client.post(f"/api/insights/individual/{S_ALICE_LL}").status_code == 401
        assert (
            world.client.post(
                f"/api/insights/individual/{S_ALICE_LL}", headers={"Authorization": "Bearer nope"}
            ).status_code
            == 401
        )

    def test_owner_gets_a_stored_private_insight(self, world):
        LlmChat.response = json.dumps(INDIVIDUAL_REPLY)
        resp = post(world, f"/api/insights/individual/{S_ALICE_LL}")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ready"
        assert resp.json()["content"]["headline"] == INDIVIDUAL_REPLY["headline"]
        row = world.db.rows("individual_insights", session_id=S_ALICE_LL)[0]
        assert row["status"] == "ready" and row["user_id"] == ALICE

    def test_prompt_uses_derived_data_only_and_the_paired_gate(self, world):
        LlmChat.response = json.dumps(INDIVIDUAL_REPLY)
        post(world, f"/api/insights/individual/{S_ALICE_LL}")
        prompt, system = LlmChat.prompts[-1], LlmChat.system_messages[-1]
        assert "Love Languages" in prompt and "Acts of Service" in prompt
        assert SECRET_NOTE not in prompt  # a partner's free text never reaches the model
        assert "Money Talks" not in prompt  # Alex's result for an assessment Alice hasn't taken
        assert '"average_connection_out_of_10": 8' in prompt  # derived check-in trend is fine
        assert "Never take sides" in system and "safety_note" in system

    def test_cannot_read_someone_elses_or_an_unfinished_session(self, world):
        assert post(world, f"/api/insights/individual/{S_ALEX_LL}").status_code == 404
        assert (
            post(world, f"/api/insights/individual/{S_ALICE_LL}", user="stranger").status_code
            == 404
        )
        assert post(world, "/api/insights/individual/not-a-uuid").status_code == 404
        assert post(world, f"/api/insights/individual/{S_ALICE_OPEN}").status_code == 409
        assert LlmChat.prompts == []

    def test_generation_happens_once(self, world):
        LlmChat.response = json.dumps(INDIVIDUAL_REPLY)
        post(world, f"/api/insights/individual/{S_ALICE_LL}")
        again = post(world, f"/api/insights/individual/{S_ALICE_LL}")
        assert (
            again.status_code == 200
            and again.json()["content"]["headline"] == INDIVIDUAL_REPLY["headline"]
        )
        assert len(LlmChat.prompts) == 1

    def test_in_flight_generation_returns_pending(self, world):
        world.db.seed(
            "individual_insights",
            user_id=ALICE,
            session_id=S_ALICE_LL,
            assessment_id="love-languages",
            status="pending",
            updated_at=datetime.now(timezone.utc).isoformat(),
        )
        resp = post(world, f"/api/insights/individual/{S_ALICE_LL}")
        assert resp.status_code == 202 and resp.json() == {"status": "pending"}
        assert LlmChat.prompts == []

    def test_abandoned_pending_claim_is_retried(self, world):
        old = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
        world.db.seed(
            "individual_insights",
            user_id=ALICE,
            session_id=S_ALICE_LL,
            assessment_id="love-languages",
            status="pending",
            updated_at=old,
        )
        LlmChat.response = json.dumps(INDIVIDUAL_REPLY)
        assert post(world, f"/api/insights/individual/{S_ALICE_LL}").status_code == 200

    def test_bad_model_output_is_reported_not_stored(self, world):
        LlmChat.response = "Sorry, I can't help with that."
        resp = post(world, f"/api/insights/individual/{S_ALICE_LL}")
        assert resp.status_code == 502
        row = world.db.rows("individual_insights", session_id=S_ALICE_LL)[0]
        assert row["status"] == "failed" and row.get("content") is None
        # A retry after the failure works.
        LlmChat.response = json.dumps(INDIVIDUAL_REPLY)
        assert post(world, f"/api/insights/individual/{S_ALICE_LL}").status_code == 200

    def test_missing_required_fields_is_a_failure(self, world):
        LlmChat.response = json.dumps({**INDIVIDUAL_REPLY, "strengths": []})
        assert post(world, f"/api/insights/individual/{S_ALICE_LL}").status_code == 502

    def test_gateway_error_is_a_failure(self, world):
        LlmChat.error = RuntimeError("gateway down")
        assert post(world, f"/api/insights/individual/{S_ALICE_LL}").status_code == 502

    def test_unconfigured_llm_is_503_and_stores_nothing(self, world, monkeypatch):
        monkeypatch.delenv("EMERGENT_LLM_KEY")
        assert post(world, f"/api/insights/individual/{S_ALICE_LL}").status_code == 503
        assert world.db.rows("individual_insights") == []

    def test_free_tier_allowance(self, world):
        now = datetime.now(timezone.utc).isoformat()
        for i in range(5):
            world.db.seed(
                "individual_insights",
                user_id=ALICE,
                session_id=f"used-{i}",
                assessment_id="x",
                status="ready",
                created_at=now,
            )
        assert post(world, f"/api/insights/individual/{S_ALICE_LL}").status_code == 402
        # Premium is per couple: Alex's subscription covers Alice.
        future = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        world.db.seed(
            "subscriptions",
            user_id=ALEX,
            status="active",
            expires_at=future,
            package_id="premium_monthly",
        )
        LlmChat.response = json.dumps(INDIVIDUAL_REPLY)
        assert post(world, f"/api/insights/individual/{S_ALICE_LL}").status_code == 200


# ------------------------------------------------------------------ couple
class TestCoupleInsight:
    def test_generated_once_and_delivered_to_both(self, world):
        LlmChat.response = json.dumps(COUPLE_REPLY)
        resp = post(world, f"/api/insights/couple/{RESULT}", user="alex")
        assert (
            resp.status_code == 200
            and resp.json()["content"]["headline"] == COUPLE_REPLY["headline"]
        )
        row = world.db.rows("couple_results", id=RESULT)[0]
        assert (
            row["ai_status"] == "ready"
            and row["ai_insight"]["narrative"] == COUPLE_REPLY["narrative"]
        )
        assert row["ai_narrative"] == COUPLE_REPLY["narrative"]  # legacy column for older builds
        assert world.pushes and set(world.pushes[0]["to"]) == {ALICE, ALEX}
        # Alice asking afterwards gets the same insight without another model call.
        assert (
            post(world, f"/api/insights/couple/{RESULT}").json()["content"]
            == resp.json()["content"]
        )
        assert len(LlmChat.prompts) == 1

    def test_prompt_treats_partners_symmetrically(self, world):
        LlmChat.response = json.dumps(COUPLE_REPLY)
        post(world, f"/api/insights/couple/{RESULT}")
        prompt, system = LlmChat.prompts[-1], LlmChat.system_messages[-1]
        assert "Alice" in prompt and "Alex" in prompt and "Smith" not in prompt  # first names only
        assert "BOTH partners will read" in system and "symmetry" in system
        assert SECRET_NOTE not in prompt

    def test_only_partners_of_an_active_couple(self, world):
        assert post(world, f"/api/insights/couple/{RESULT}", user="stranger").status_code == 404
        world.db.rows("couple_units", id=COUPLE)[0]["status"] = "inactive"
        assert post(world, f"/api/insights/couple/{RESULT}").status_code == 403
        assert LlmChat.prompts == []

    def test_failure_is_retryable(self, world):
        LlmChat.response = "not json"
        assert post(world, f"/api/insights/couple/{RESULT}").status_code == 502
        assert world.db.rows("couple_results", id=RESULT)[0]["ai_status"] == "failed"
        LlmChat.response = json.dumps(COUPLE_REPLY)
        assert post(world, f"/api/insights/couple/{RESULT}").status_code == 200

    def test_pending_is_not_duplicated(self, world):
        row = world.db.rows("couple_results", id=RESULT)[0]
        row.update(ai_status="pending", ai_updated_at=datetime.now(timezone.utc).isoformat())
        assert post(world, f"/api/insights/couple/{RESULT}").status_code == 202
        assert LlmChat.prompts == []


# ------------------------------------------------------------------ summary
class TestRelationshipSummary:
    REPLY = {
        "headline": "A month of steady connection",
        "overview": "You checked in and finished Love Languages together.",
        "highlights": ["Finishing an assessment together"],
        "patterns": [],
        "focus_for_next_month": ["Try the Six-Second Kiss"],
        "strength_affirmation": "You keep showing up for each other.",
        "safety_note": None,
    }

    def test_requires_a_partner(self, world):
        assert post(world, "/api/insights/summary", user="stranger").status_code == 409

    def test_needs_some_history(self, world):
        world.db.tables["couple_results"].clear()
        assert post(world, "/api/insights/summary").status_code == 409

    def test_one_summary_per_month(self, world):
        LlmChat.response = json.dumps(self.REPLY)
        first = post(world, "/api/insights/summary")
        assert (
            first.status_code == 200
            and first.json()["content"]["headline"] == self.REPLY["headline"]
        )
        second = post(world, "/api/insights/summary", user="alex")
        assert second.json()["content"] == first.json()["content"]
        assert len(LlmChat.prompts) == 1
        assert world.pushes[0]["to"] == [ALEX]  # the partner who didn't ask is told it's ready


# ------------------------------------------------------------------ safety helper
def test_risk_language_always_surfaces_the_safety_note():
    result = safety.apply_safety(
        {"safety_note": None}, source_text="he said he would hurt me if I left"
    )
    assert result["safety_note"] == safety.SAFETY_NOTE
    assert (
        safety.apply_safety({"safety_note": "  "}, source_text="we argued about dishes")[
            "safety_note"
        ]
        is None
    )
