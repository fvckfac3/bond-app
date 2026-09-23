"""
AI insights, generated and stored server-side (PRDs'@/03 §4, 05 §3):

  POST /api/insights/individual/{session_id}      private insight on one completed assessment
  POST /api/insights/couple/{couple_result_id}    shared insight once both partners completed
  POST /api/insights/summary                      the couple's relationship summary for this month

Each call is idempotent: a ready insight is returned as-is (200), one being written returns 202
{"status": "pending"}, and generation happens at most once at a time (claim-first). Failures are
reported (502/503) and never stored as if they were insights. Inputs are loaded here from the
database — the app sends only an id.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from routes import deps
from services.ai_usage import can_generate, month_start
from services.insight_context import InsightContext
from services.insight_prompts import (
    clean_couple,
    clean_individual,
    clean_summary,
    couple_prompt,
    individual_prompt,
    summary_prompt,
)
from services.llm import LLMUnavailable, generate_json, llm_configured
from services.push import send_push
from services.safety import apply_safety

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/insights", tags=["insights"])

# A 'pending' claim older than this is assumed abandoned (e.g. the process died) and can be retried.
PENDING_TIMEOUT = timedelta(minutes=3)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _stale(timestamp: Optional[str]) -> bool:
    if not timestamp:
        return True
    try:
        ts = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError:
        return True
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return ts < _now() - PENDING_TIMEOUT


def _pending() -> JSONResponse:
    return JSONResponse(status_code=202, content={"status": "pending"})


def _ready(content: Dict[str, Any]) -> Dict[str, Any]:
    return {"status": "ready", "content": content}


def _can_start(db, user_id: str) -> None:
    if not llm_configured():
        raise HTTPException(status_code=503, detail="AI insights are not available right now.")
    if not can_generate(db, user_id):
        raise HTTPException(
            status_code=402,
            detail="You've used this month's free AI insights. Premium includes unlimited insights.",
        )


def _generation_failed(error: Exception) -> HTTPException:
    if isinstance(error, LLMUnavailable):
        return HTTPException(status_code=503, detail="AI insights are not available right now.")
    logger.error("Insight generation failed: %s", error)
    return HTTPException(
        status_code=502, detail="We couldn't write this insight. Please try again."
    )


def _is_duplicate(error: Exception) -> bool:
    return "23505" in str(error) or "duplicate key" in str(error).lower()


# --------------------------------------------------------------------------- individual
@router.post("/individual/{session_id}")
async def individual_insight(session_id: str, user_id: str = Depends(deps.current_user_id)):
    db = deps.get_supabase()
    if not deps.valid_uuid(session_id):
        raise HTTPException(status_code=404, detail="Assessment not found")
    sessions = (
        db.table("assessment_sessions")
        .select("id, user_id, assessment_id, scores, submitted_at, completed")
        .eq("id", session_id)
        .execute()
        .data
        or []
    )
    if not sessions or sessions[0]["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Assessment not found")
    session = sessions[0]
    if not session.get("completed"):
        raise HTTPException(status_code=409, detail="Finish the assessment first.")

    existing = (
        db.table("individual_insights").select("*").eq("session_id", session_id).execute().data
        or []
    )
    row = existing[0] if existing else None
    if row and row["status"] == "ready":
        return _ready(row["content"])
    if row and row["status"] == "pending" and not _stale(row.get("updated_at")):
        return _pending()

    _can_start(db, user_id)
    now = _now().isoformat()
    if row:
        claimed = (
            db.table("individual_insights")
            .update({"status": "pending", "updated_at": now})
            .eq("id", row["id"])
            .eq("status", row["status"])
            .execute()
            .data
        )
        if not claimed:
            return _pending()
    else:
        try:
            db.table("individual_insights").insert(
                {
                    "user_id": user_id,
                    "session_id": session_id,
                    "assessment_id": session["assessment_id"],
                    "status": "pending",
                    "updated_at": now,
                }
            ).execute()
        except Exception as e:
            if _is_duplicate(e):
                return _pending()
            raise

    try:
        context = InsightContext(db).for_individual(user_id, session)
        system, prompt, required = individual_prompt(context)
        raw = await generate_json(
            system=system, prompt=prompt, session_id=f"individual-{session_id}", required=required
        )
        content = apply_safety(clean_individual(raw))
    except Exception as e:
        db.table("individual_insights").update(
            {"status": "failed", "updated_at": _now().isoformat()}
        ).eq("session_id", session_id).execute()
        raise _generation_failed(e)

    db.table("individual_insights").update(
        {"status": "ready", "content": content, "updated_at": _now().isoformat()}
    ).eq("session_id", session_id).execute()
    return _ready(content)


# --------------------------------------------------------------------------- couple
@router.post("/couple/{couple_result_id}")
async def couple_insight(couple_result_id: str, user_id: str = Depends(deps.current_user_id)):
    db = deps.get_supabase()
    if not deps.valid_uuid(couple_result_id):
        raise HTTPException(status_code=404, detail="Result not found")
    results = db.table("couple_results").select("*").eq("id", couple_result_id).execute().data or []
    if not results or user_id not in (results[0].get("partner1_id"), results[0].get("partner2_id")):
        raise HTTPException(status_code=404, detail="Result not found")
    result = results[0]
    active = (
        db.table("couple_units")
        .select("id")
        .eq("id", result["couple_unit_id"])
        .eq("status", "active")
        .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")
        .execute()
        .data
    )
    if not active:
        raise HTTPException(status_code=403, detail="Not a member of this couple")

    if result.get("ai_status") == "ready" and result.get("ai_insight"):
        return _ready(result["ai_insight"])
    if result.get("ai_status") == "pending" and not _stale(result.get("ai_updated_at")):
        return _pending()

    _can_start(db, user_id)
    cutoff = (_now() - PENDING_TIMEOUT).strftime("%Y-%m-%dT%H:%M:%SZ")
    claimed = (
        db.table("couple_results")
        .update({"ai_status": "pending", "ai_updated_at": _now().isoformat()})
        .eq("id", couple_result_id)
        .or_(
            f"ai_status.is.null,ai_status.eq.failed,and(ai_status.eq.pending,ai_updated_at.lt.{cutoff})"
        )
        .execute()
        .data
    )
    if not claimed:
        return _pending()

    p1, p2 = result["partner1_id"], result["partner2_id"]
    try:
        sessions = (
            db.table("assessment_sessions")
            .select("id, user_id, assessment_id, scores, submitted_at")
            .in_("user_id", [p1, p2])
            .eq("assessment_id", result["assessment_id"])
            .eq("completed", True)
            .order("submitted_at", desc=True)
            .execute()
            .data
            or []
        )
        by_partner: Dict[str, Dict[str, Any]] = {}
        for s in sessions:
            by_partner.setdefault(s["user_id"], s)
        if p1 not in by_partner or p2 not in by_partner:
            raise ValueError("Both partners' completed sessions are required")

        loader = InsightContext(db)
        names = loader.first_names(p1, p2)
        context = loader.for_couple(result, by_partner, names)
        system, prompt, required = couple_prompt(context)
        raw = await generate_json(
            system=system, prompt=prompt, session_id=f"couple-{couple_result_id}", required=required
        )
        content = apply_safety(clean_couple(raw))
    except Exception as e:
        db.table("couple_results").update(
            {"ai_status": "failed", "ai_updated_at": _now().isoformat()}
        ).eq("id", couple_result_id).execute()
        raise _generation_failed(e)

    db.table("couple_results").update(
        {
            "ai_status": "ready",
            "ai_insight": content,
            "ai_updated_at": _now().isoformat(),
            # Legacy columns, kept filled for older app builds.
            "ai_narrative": content["narrative"],
            "ai_growth_recommendations": content["try_together"],
            "ai_strength_affirmation": content["strength_affirmation"],
            "ai_communication_scripts": {"conversation_starters": content["conversation_starters"]},
        }
    ).eq("id", couple_result_id).execute()

    assessment_name = InsightContext(db).assessment_meta(result["assessment_id"]).get("name")
    await send_push(
        db,
        [p1, p2],
        "Your couple insight is ready",
        f"See what your {assessment_name} results say about the two of you.",
        {
            "type": "couple_insight",
            "assessmentId": result["assessment_id"],
            "coupleResultId": couple_result_id,
        },
    )
    return _ready(content)


# --------------------------------------------------------------------------- relationship summary
@router.post("/summary")
async def relationship_summary(user_id: str = Depends(deps.current_user_id)):
    db = deps.get_supabase()
    loader = InsightContext(db)
    couple = loader.couple_for(user_id)
    if not couple or not couple.get("partner_id"):
        raise HTTPException(
            status_code=409, detail="Pair with your partner to get a relationship summary."
        )

    period = month_start().date().isoformat()
    existing = (
        db.table("relationship_summaries")
        .select("*")
        .eq("couple_unit_id", couple["id"])
        .eq("period_start", period)
        .execute()
        .data
        or []
    )
    row = existing[0] if existing else None
    if row and row["status"] == "ready":
        return _ready(row["content"])
    if row and row["status"] == "pending" and not _stale(row.get("updated_at")):
        return _pending()

    names = loader.first_names(couple["user1_id"], couple["user2_id"])
    context = loader.for_summary(couple, names)
    checkins = sum(
        (v.get("check_ins") or 0) for k, v in context["check_ins"].items() if isinstance(v, dict)
    )
    if (
        not context["couple_results"]
        and not context["activities_completed_last_90_days"]
        and checkins < 5
    ):
        raise HTTPException(
            status_code=409,
            detail="Complete an assessment together, a few activities, or a week of check-ins first.",
        )

    _can_start(db, user_id)
    now = _now().isoformat()
    if row:
        claimed = (
            db.table("relationship_summaries")
            .update({"status": "pending", "updated_at": now, "requested_by": user_id})
            .eq("id", row["id"])
            .eq("status", row["status"])
            .execute()
            .data
        )
        if not claimed:
            return _pending()
    else:
        try:
            db.table("relationship_summaries").insert(
                {
                    "couple_unit_id": couple["id"],
                    "period_start": period,
                    "status": "pending",
                    "requested_by": user_id,
                    "updated_at": now,
                }
            ).execute()
        except Exception as e:
            if _is_duplicate(e):
                return _pending()
            raise

    period_label = month_start().strftime("%B %Y")
    try:
        system, prompt, required = summary_prompt(context, period_label)
        raw = await generate_json(
            system=system,
            prompt=prompt,
            session_id=f"summary-{couple['id']}-{period}",
            required=required,
        )
        content = apply_safety(clean_summary(raw))
    except Exception as e:
        db.table("relationship_summaries").update(
            {"status": "failed", "updated_at": _now().isoformat()}
        ).eq("couple_unit_id", couple["id"]).eq("period_start", period).execute()
        raise _generation_failed(e)

    db.table("relationship_summaries").update(
        {"status": "ready", "content": content, "updated_at": _now().isoformat()}
    ).eq("couple_unit_id", couple["id"]).eq("period_start", period).execute()
    await send_push(
        db,
        [couple["partner_id"]],
        "Your relationship summary is ready",
        f"A look back at {period_label} for the two of you.",
        {"type": "relationship_summary"},
    )
    return _ready(content)
