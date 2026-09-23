"""
AI analyzer routes — communication, text, argument, and emotional pattern.

  POST /api/analyzers/{kind}/analyze   kind: communication | text | argument | emotional

Input is either the couple's own in-app messages (source="messages", loaded here for the last
few days, never sent by the client) or a conversation the user pastes (source="transcript").
The caller must be a partner in the ACTIVE couple `couple_id`. Only the derived analysis is
stored (couple-scoped, readable by both partners under RLS); the raw conversation never is.
History is read by the app directly from the result tables. Voice tone analysis is not offered.
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from routes import deps
from services.ai_usage import can_generate
from services.analyzers import ANALYZERS, build_prompt, finalize, format_messages
from services.llm import LLMUnavailable, generate_json, llm_configured

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analyzers", tags=["analyzers"])

MIN_MESSAGES = 6
MAX_MESSAGES = 300
MIN_TRANSCRIPT = 80
MAX_TRANSCRIPT = 12000


class AnalyzeRequest(BaseModel):
    couple_id: str
    source: Literal["messages", "transcript"] = "messages"
    transcript: Optional[str] = Field(None, max_length=MAX_TRANSCRIPT)
    context: Optional[str] = Field(None, max_length=500, description="Optional note from the user")


def ensure_couple_member(db, couple_id: str, user_id: str) -> Dict[str, Any]:
    """The ACTIVE couple unit `couple_id` if `user_id` is a partner in it, else 403."""
    if not deps.valid_uuid(couple_id):
        raise HTTPException(status_code=403, detail="Not a member of this couple")
    rows = (
        db.table("couple_units")
        .select("id, user1_id, user2_id")
        .eq("id", couple_id)
        .eq("status", "active")
        .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=403, detail="Not a member of this couple")
    return rows[0]


@router.post("/{kind}/analyze")
async def analyze(kind: str, request: AnalyzeRequest, user_id: str = Depends(deps.current_user_id)):
    spec = ANALYZERS.get(kind)
    if not spec:
        raise HTTPException(status_code=404, detail="Unknown analyzer")
    db = deps.get_supabase()
    couple = ensure_couple_member(db, request.couple_id, user_id)

    if request.source == "messages":
        since = (datetime.now(timezone.utc) - timedelta(days=spec.message_days)).isoformat()
        messages = (
            db.table("messages")
            .select("sender_id, message_text, created_at")
            .eq("couple_unit_id", couple["id"])
            .gte("created_at", since)
            .order("created_at")
            .execute()
            .data
            or []
        )[-MAX_MESSAGES:]
        if len(messages) < MIN_MESSAGES:
            raise HTTPException(
                status_code=422,
                detail=f"There aren't enough Bond messages from the last {spec.message_days} days yet. "
                "Chat a little more, or paste a conversation instead.",
            )
        transcript = format_messages(messages, partner_a=couple["user1_id"])
        note = f"These are the couple's messages to each other in the app over the last {spec.message_days} days."
    else:
        transcript = (request.transcript or "").strip()
        if len(transcript) < MIN_TRANSCRIPT:
            raise HTTPException(
                status_code=422, detail="Please share a bit more of the conversation."
            )
        note = (
            "One partner pasted or described this conversation. Speakers may be labeled by name — refer to "
            "them only as Partner A (whoever speaks first) and Partner B."
        )
    extra = (request.context or "").strip()
    if extra:
        note += f"\nWhat the partner who asked for this analysis said about it: {extra}"

    if not llm_configured():
        raise HTTPException(status_code=503, detail="Analysis isn't available right now.")
    if not can_generate(db, user_id):
        raise HTTPException(
            status_code=402,
            detail="You've used this month's free AI analyses. Premium includes unlimited analyses.",
        )

    system, prompt, required = build_prompt(spec, transcript, note)
    try:
        raw = await generate_json(
            system=system,
            prompt=prompt,
            session_id=f"analyzer-{kind}-{uuid.uuid4()}",
            required=required,
        )
    except LLMUnavailable:
        raise HTTPException(status_code=503, detail="Analysis isn't available right now.")
    except Exception as e:
        logger.error("Analyzer %s failed: %s", kind, e)
        raise HTTPException(
            status_code=502, detail="We couldn't complete this analysis. Please try again."
        )

    result = finalize(spec, raw, f"{transcript}\n{extra}")
    row = {
        "couple_id": couple["id"],  # from the authorized couple, never from model output
        "user_id": user_id,
        "analysis_date": datetime.now(timezone.utc).isoformat(),
        "result": result,
        **spec.columns(result),
    }
    analysis_id, persisted = None, False
    try:
        inserted = db.table(spec.table).insert(row).execute().data or []
        analysis_id, persisted = (inserted[0].get("id") if inserted else None), bool(inserted)
    except Exception as e:  # the couple still gets their analysis
        logger.error("Failed to store %s analysis for couple %s: %s", kind, couple["id"], e)

    return {
        "success": True,
        "analyzer": kind,
        "id": analysis_id,
        "persisted": persisted,
        "result": result,
    }
