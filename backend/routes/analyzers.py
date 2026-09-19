"""
AI Analyzer Routes
Routes for all 5 AI analyzer services: Communication, Text, Argument, Voice Tone, Emotional Pattern
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime, timezone
import os
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analyzers", tags=["analyzers"])

# Supabase connection
supabase_url = os.environ.get("SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


def get_supabase():
    """Get Supabase client."""
    from supabase import create_client

    return create_client(supabase_url, supabase_key)


# ============================================================================
# ACCESS CONTROL (PRDs'@/03 Safety & Privacy: analyzer data is couple-scoped and
# is the most sensitive data in the app)
# ============================================================================

# Columns that exist on each result table in supabase/bond_schema.sql. Only these
# are persisted — never the raw messages/transcript that were analyzed.
RESULT_COLUMNS = {
    "communication_analyses": {
        "overall_score",
        "key_positive",
        "key_negative",
        "sentiment",
        "listening_score",
        "response_time_score",
        "engagement_score",
        "recommendations",
        "analysis_date",
    },
    "text_analyses": {
        "tone_variety_score",
        "dominant_tones",
        "emotional_depth_score",
        "clarity_score",
        "recommendations",
        "analysis_date",
    },
    "argument_analyses": {
        "conflict_score",
        "escalation_patterns",
        "repair_opportunities",
        "communication_breakdowns",
        "recommendations",
        "quick_score",
        "severity_level",
        "primary_concern",
        "analysis_date",
    },
    "voice_tone_analyses": {
        "overall_tone_score",
        "speaker_breakdown",
        "tension_indicators",
        "warmth_indicators",
        "speaking_balance",
        "recommendations",
        "analysis_date",
    },
    "emotional_pattern_analyses": {
        "pattern_summary",
        "emotional_trends",
        "trigger_maps",
        "growth_trajectory",
        "historical_comparison",
        "recommendations",
        "analysis_date",
    },
}


async def current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Identify the caller from their Supabase session JWT (never from a client-supplied ID)."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization[7:].strip()
    try:
        user_id = get_supabase().auth.get_user(token).user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user_id


def ensure_couple_member(couple_id: str, user_id: str) -> None:
    """403 unless `user_id` belongs to the ACTIVE (paired) couple unit `couple_id`."""
    try:
        uuid.UUID(couple_id)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status_code=403, detail="Not a member of this couple")
    response = (
        get_supabase()
        .table("couple_units")
        .select("id")
        .eq("id", couple_id)
        .eq("status", "active")
        .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=403, detail="Not a member of this couple")


def _persist(table: str, couple_id: str, user_id: str, result: Dict[str, Any]) -> bool:
    """Store an analysis RESULT scoped to the couple. A storage failure must not lose the analysis."""
    if result.get("error_occurred"):
        # The service fell back to canned default scores — don't store them as a real analysis.
        return False
    row = {k: v for k, v in result.items() if k in RESULT_COLUMNS[table]}
    row.update(
        couple_id=couple_id,  # from the authorized request, never from analyzer output
        user_id=user_id,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    try:
        get_supabase().table(table).insert(row).execute()
        return True
    except Exception as e:
        logger.error(f"Failed to store {table} result for couple {couple_id}: {e}")
        return False


# Import analyzer services
try:
    from services.communication_analyzer import CommunicationAnalyzer
    from services.text_analyzer import TextAnalyzer
    from services.argument_analyzer import ArgumentAnalyzer
    from services.voice_tone_analyzer import VoiceToneAnalyzer
    from services.emotional_pattern_analyzer import EmotionalPatternAnalyzer

    communication_analyzer = CommunicationAnalyzer()
    text_analyzer = TextAnalyzer()
    argument_analyzer = ArgumentAnalyzer()
    voice_tone_analyzer = VoiceToneAnalyzer()
    emotional_pattern_analyzer = EmotionalPatternAnalyzer()
    analyzers_available = True
except ImportError:
    analyzers_available = False


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================


class MessageInput(BaseModel):
    sender: str = Field(..., description="Sender identifier")
    content: str = Field(..., description="Message content")
    timestamp: Optional[str] = Field(None, description="ISO timestamp")
    tone: Optional[str] = Field(None, description="Tone label if pre-assigned")


class ConversationAnalyzeRequest(BaseModel):
    couple_id: str = Field(..., description="Couple unit ID")
    messages: List[MessageInput] = Field(..., description="Message history")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")


class TextAnalyzeRequest(BaseModel):
    couple_id: str = Field(..., description="Couple unit ID")
    messages: List[MessageInput] = Field(..., description="Message history")
    time_period: Optional[str] = Field(None, description="Time period context")


class ArgumentAnalyzeRequest(BaseModel):
    couple_id: str = Field(..., description="Couple unit ID")
    argument_content: str = Field(..., description="Transcript or summary of argument")
    context: Optional[Dict[str, Any]] = Field(None, description="Context about the argument")


class VoiceToneAnalyzeRequest(BaseModel):
    couple_id: str = Field(..., description="Couple unit ID")
    transcript: str = Field(..., description="Transcribed voice conversation")
    speaker_segments: Optional[List[Dict[str, Any]]] = Field(
        None, description="Speaker timing info"
    )


class EmotionalPatternRequest(BaseModel):
    couple_id: str = Field(..., description="Couple unit ID")
    messages: List[MessageInput] = Field(..., description="Message history")
    time_range: Optional[str] = Field(None, description="Time range to analyze")


class QuickScoreRequest(BaseModel):
    couple_id: str = Field(..., description="Couple unit ID")
    messages: List[MessageInput] = Field(..., description="Recent messages for quick scoring")


class AnalyzerResult(BaseModel):
    success: bool
    analyzer: str
    analysis_date: str
    data: Dict[str, Any]
    error: Optional[str] = None


# ============================================================================
# COMMUNICATION ANALYZER ROUTES
# ============================================================================


@router.post("/communication/analyze")
async def analyze_communication(
    request: ConversationAnalyzeRequest, user_id: str = Depends(current_user_id)
):
    """
    Perform full conversation analysis for communication patterns.

    Analyzes: response time, listening indicators, tone consistency, engagement quality.
    """
    ensure_couple_member(request.couple_id, user_id)
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")

    try:
        # Convert messages to format expected by service
        messages = [
            {
                "sender": m.sender,
                "content": m.content,
                "timestamp": m.timestamp or datetime.now(timezone.utc).isoformat(),
            }
            for m in request.messages
        ]

        result = await communication_analyzer.analyze_conversation(
            user_id=user_id,
            couple_id=request.couple_id,
            message_history=messages,
            context=request.context,
        )

        persisted = _persist("communication_analyses", request.couple_id, user_id, result)

        return {
            "success": True,
            "analyzer": "communication",
            "analysis_date": result.get("analysis_date"),
            "data": result,
            "persisted": persisted,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/communication/quick-score")
async def communication_quick_score(
    request: QuickScoreRequest, user_id: str = Depends(current_user_id)
):
    """
    Quick lightweight scoring for recent messages.
    Returns: quick_score, key_positive, key_negative, sentiment
    """
    ensure_couple_member(request.couple_id, user_id)
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")

    try:
        messages = [
            {
                "sender": m.sender,
                "content": m.content,
                "timestamp": m.timestamp or datetime.now(timezone.utc).isoformat(),
            }
            for m in request.messages
        ]

        result = await communication_analyzer.quick_score(
            user_id=user_id, couple_id=request.couple_id, recent_messages=messages
        )

        return {
            "success": True,
            "analyzer": "communication",
            "analysis_date": result.get("analysis_date"),
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick score failed: {str(e)}")


# ============================================================================
# TEXT ANALYZER ROUTES
# ============================================================================


@router.post("/text/analyze")
async def analyze_text(request: TextAnalyzeRequest, user_id: str = Depends(current_user_id)):
    """
    Perform comprehensive text message analysis.

    Analyzes: tone variety, emotional expression, clarity, engagement patterns.
    """
    ensure_couple_member(request.couple_id, user_id)
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")

    try:
        messages = [
            {
                "sender": m.sender,
                "content": m.content,
                "timestamp": m.timestamp or datetime.now(timezone.utc).isoformat(),
            }
            for m in request.messages
        ]

        result = await text_analyzer.analyze_messages(
            user_id=user_id,
            couple_id=request.couple_id,
            messages=messages,
            time_period=request.time_period,
        )

        persisted = _persist("text_analyses", request.couple_id, user_id, result)

        return {
            "success": True,
            "analyzer": "text",
            "analysis_date": result.get("analysis_date"),
            "data": result,
            "persisted": persisted,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text analysis failed: {str(e)}")


@router.post("/text/tone-variety")
async def text_tone_variety(request: QuickScoreRequest, user_id: str = Depends(current_user_id)):
    """
    Calculate tone variety score from messages.
    Returns: tone_variety_score, dominant_tones, unique_expressions.
    """
    ensure_couple_member(request.couple_id, user_id)
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")

    try:
        messages = [
            {
                "sender": m.sender,
                "content": m.content,
                "timestamp": m.timestamp or datetime.now(timezone.utc).isoformat(),
            }
            for m in request.messages
        ]

        result = await text_analyzer.calculate_tone_variety(
            user_id=user_id, couple_id=request.couple_id, messages=messages
        )

        return {
            "success": True,
            "analyzer": "text",
            "analysis_date": result.get("analysis_date"),
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tone variety analysis failed: {str(e)}")


@router.post("/text/emotional-patterns")
async def text_emotional_patterns(
    request: QuickScoreRequest, user_id: str = Depends(current_user_id)
):
    """
    Detect emotional patterns in text messages.
    Returns: emotional_patterns_detected, trigger_words, positive/negative triggers.
    """
    ensure_couple_member(request.couple_id, user_id)
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")

    try:
        messages = [
            {
                "sender": m.sender,
                "content": m.content,
                "timestamp": m.timestamp or datetime.now(timezone.utc).isoformat(),
            }
            for m in request.messages
        ]

        result = await text_analyzer.detect_emotional_patterns(
            user_id=user_id, couple_id=request.couple_id, messages=messages
        )

        return {
            "success": True,
            "analyzer": "text",
            "analysis_date": result.get("analysis_date"),
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotional pattern detection failed: {str(e)}")


# ============================================================================
# ARGUMENT ANALYZER ROUTES
# ============================================================================


@router.post("/argument/analyze")
async def analyze_argument(
    request: ArgumentAnalyzeRequest, user_id: str = Depends(current_user_id)
):
    """
    Analyze an argument or conflict situation.

    Returns: conflict_score, escalation_patterns, repair_opportunities,
    communication_breakdowns, recommendations.
    """
    ensure_couple_member(request.couple_id, user_id)
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")

    try:
        result = await argument_analyzer.analyze_argument(
            user_id=user_id,
            couple_id=request.couple_id,
            argument_data={
                "messages": [{"sender": "partners", "content": request.argument_content}],
                "context": request.context or "",
            },
        )

        persisted = _persist("argument_analyses", request.couple_id, user_id, result)

        return {
            "success": True,
            "analyzer": "argument",
            "analysis_date": result.get("analysis_date"),
            "data": result,
            "persisted": persisted,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Argument analysis failed: {str(e)}")


@router.post("/argument/quick-score")
async def argument_quick_score(
    request: ArgumentAnalyzeRequest, user_id: str = Depends(current_user_id)
):
    """
    Quick scoring for an argument situation.
    Returns: quick_score, severity_level, primary_concern, immediate_action.
    """
    ensure_couple_member(request.couple_id, user_id)
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")

    try:
        result = await argument_analyzer.quick_score(
            user_id=user_id,
            couple_id=request.couple_id,
            recent_arguments=[request.argument_content],
        )

        return {
            "success": True,
            "analyzer": "argument",
            "analysis_date": result.get("analysis_date"),
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Argument quick score failed: {str(e)}")


# ============================================================================
# VOICE TONE ANALYZER ROUTES
# ============================================================================


@router.post("/voice/analyze")
async def analyze_voice_tone(
    request: VoiceToneAnalyzeRequest, user_id: str = Depends(current_user_id)
):
    """
    Analyze voice tone from transcribed conversation.

    Returns: overall_tone_score, speaker_breakdown, tension_indicators,
    warmth_indicators, speaking_balance, recommendations.
    """
    ensure_couple_member(request.couple_id, user_id)
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")

    try:
        result = await voice_tone_analyzer.analyze_voice_interaction(
            user_id=user_id,
            couple_id=request.couple_id,
            interaction_data={
                "transcript_segments": request.speaker_segments
                or [{"speaker": "unknown", "content": request.transcript}],
            },
        )

        persisted = _persist("voice_tone_analyses", request.couple_id, user_id, result)

        return {
            "success": True,
            "analyzer": "voice",
            "analysis_date": result.get("analysis_date"),
            "data": result,
            "persisted": persisted,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice tone analysis failed: {str(e)}")


@router.post("/voice/speaker-balance")
async def voice_speaker_balance(
    request: VoiceToneAnalyzeRequest, user_id: str = Depends(current_user_id)
):
    """
    Analyze speaking balance between partners.
    Returns: speaking_ratio, contribution_balance, turn_taking_patterns.
    """
    ensure_couple_member(request.couple_id, user_id)
    raise HTTPException(
        status_code=501,
        detail="Speaker balance analysis is not implemented (VoiceToneAnalyzer has no such method)",
    )


# ============================================================================
# EMOTIONAL PATTERN ANALYZER ROUTES
# ============================================================================


@router.post("/emotional/analyze")
async def analyze_emotional_patterns(
    request: EmotionalPatternRequest, user_id: str = Depends(current_user_id)
):
    """
    Analyze long-term emotional patterns in the relationship.

    Returns: pattern_summary, emotional_trends, trigger_maps, growth_trajectory,
    historical_comparison, recommendations.
    """
    ensure_couple_member(request.couple_id, user_id)
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")

    try:
        messages = [
            {
                "sender": m.sender,
                "content": m.content,
                "timestamp": m.timestamp or datetime.now(timezone.utc).isoformat(),
            }
            for m in request.messages
        ]

        result = await emotional_pattern_analyzer.analyze_emotional_patterns(
            user_id=user_id,
            couple_id=request.couple_id,
            emotional_data={"message_history": messages, "time_period": request.time_range or ""},
        )

        persisted = _persist("emotional_pattern_analyses", request.couple_id, user_id, result)

        return {
            "success": True,
            "analyzer": "emotional",
            "analysis_date": result.get("analysis_date"),
            "data": result,
            "persisted": persisted,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotional pattern analysis failed: {str(e)}")


@router.post("/emotional/trend")
async def emotional_trend(
    request: EmotionalPatternRequest, user_id: str = Depends(current_user_id)
):
    """
    Get emotional trend analysis for a time period.
    Returns: trend_direction, period_summary, significant_shifts.
    """
    ensure_couple_member(request.couple_id, user_id)
    raise HTTPException(
        status_code=501,
        detail="Emotional trend analysis is not implemented (EmotionalPatternAnalyzer has no such method)",
    )


# ============================================================================
# HISTORY & RETRIEVAL ENDPOINTS
# ============================================================================


@router.get("/history/{couple_id}")
async def get_analyzer_history(
    couple_id: str,
    analyzer: Optional[str] = None,
    limit: int = 20,
    user_id: str = Depends(current_user_id),
):
    """
    Get analysis history for a couple.

    Args:
        couple_id: Couple unit ID
        analyzer: Optional filter by analyzer type (communication, text, argument, voice, emotional)
        limit: Number of results to return (max 100)
    """
    ensure_couple_member(couple_id, user_id)
    limit = max(1, min(limit, 100))
    try:
        sb = get_supabase()
        cols = {
            "communication": "communication_analyses",
            "text": "text_analyses",
            "argument": "argument_analyses",
            "voice": "voice_tone_analyses",
            "emotional": "emotional_pattern_analyses",
        }
        if analyzer and analyzer in cols:
            result = (
                sb.table(cols[analyzer])
                .select("*")
                .eq("couple_id", couple_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            results = result.data or []
        else:
            results = []
            for col in cols.values():
                result = (
                    sb.table(col)
                    .select("*")
                    .eq("couple_id", couple_id)
                    .order("created_at", desc=True)
                    .limit(max(1, limit // 2))
                    .execute()
                )
                results.extend(result.data or [])
            results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            results = results[:limit]
        return {"success": True, "couple_id": couple_id, "count": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")


@router.get("/summary/{couple_id}")
async def get_analyzer_summary(couple_id: str, user_id: str = Depends(current_user_id)):
    """
    Get a summary of all analyzer results for a couple.
    Returns latest result from each analyzer type.
    """
    ensure_couple_member(couple_id, user_id)
    try:
        sb = get_supabase()
        cols = {
            "communication": "communication_analyses",
            "text": "text_analyses",
            "argument": "argument_analyses",
            "voice": "voice_tone_analyses",
            "emotional": "emotional_pattern_analyses",
        }
        summary = {}
        for name, table in cols.items():
            result = (
                sb.table(table)
                .select("*")
                .eq("couple_id", couple_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            data = result.data
            if data:
                r = data[0]
                summary[name] = {
                    "last_analyzed": r.get("analysis_date"),
                    "score": r.get("overall_score") or r.get("quick_score"),
                    "key_insight": (
                        r.get("key_positive", [None])[0]
                        if r.get("key_positive")
                        else (
                            r.get("recommendations", [None])[0]
                            if r.get("recommendations")
                            else None
                        )
                    ),
                }
        return {"success": True, "couple_id": couple_id, "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")
