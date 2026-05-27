"""
AI Analyzer Routes
Routes for all 5 AI analyzer services: Communication, Text, Argument, Voice Tone, Emotional Pattern
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime, timezone
import os

router = APIRouter(prefix="/api/analyzers", tags=["analyzers"])

# Supabase connection
supabase_url = os.environ.get('SUPABASE_URL', '')
supabase_key = os.environ.get('SUPABASE_SERVICE_KEY', '')

def get_supabase():
    """Get Supabase client."""
    from supabase import create_client
    return create_client(supabase_url, supabase_key)

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
    speaker_segments: Optional[List[Dict[str, Any]]] = Field(None, description="Speaker timing info")

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
    request: ConversationAnalyzeRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Perform full conversation analysis for communication patterns.
    
    Analyzes: response time, listening indicators, tone consistency, engagement quality.
    """
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")
    
    try:
        # Convert messages to format expected by service
        messages = [
            {"sender": m.sender, "content": m.content, "timestamp": m.timestamp or datetime.now(timezone.utc).isoformat()}
            for m in request.messages
        ]
        
        result = await communication_analyzer.analyze_conversation(
            user_id=x_user_id or "anonymous",
            couple_id=request.couple_id,
            message_history=messages,
            context=request.context
        )
        
        # Store result in MongoDB
        db = get_db()
        await db.communication_analyses.insert_one({
            **result,
            "user_id": x_user_id or "anonymous",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "analyzer": "communication",
            "analysis_date": result.get("analysis_date"),
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/communication/quick-score")
async def communication_quick_score(
    request: QuickScoreRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Quick lightweight scoring for recent messages.
    Returns: quick_score, key_positive, key_negative, sentiment
    """
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")
    
    try:
        messages = [
            {"sender": m.sender, "content": m.content, "timestamp": m.timestamp or datetime.now(timezone.utc).isoformat()}
            for m in request.messages
        ]
        
        result = await communication_analyzer.quick_score(
            user_id=x_user_id or "anonymous",
            couple_id=request.couple_id,
            recent_messages=messages
        )
        
        return {
            "success": True,
            "analyzer": "communication",
            "analysis_date": result.get("analysis_date"),
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick score failed: {str(e)}")


# ============================================================================
# TEXT ANALYZER ROUTES
# ============================================================================

@router.post("/text/analyze")
async def analyze_text(
    request: TextAnalyzeRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Perform comprehensive text message analysis.
    
    Analyzes: tone variety, emotional expression, clarity, engagement patterns.
    """
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")
    
    try:
        messages = [
            {"sender": m.sender, "content": m.content, "timestamp": m.timestamp or datetime.now(timezone.utc).isoformat()}
            for m in request.messages
        ]
        
        result = await text_analyzer.analyze_messages(
            user_id=x_user_id or "anonymous",
            couple_id=request.couple_id,
            messages=messages,
            time_period=request.time_period
        )
        
        # Store result in MongoDB
        db = get_db()
        await sb.table('text_analyses').insert({
            **{k: v for k, v in result.items() if k not in ('analysis_date',)},
            "user_id": x_user_id or None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "analyzer": "text",
            "analysis_date": result.get("analysis_date"),
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text analysis failed: {str(e)}")


@router.post("/text/tone-variety")
async def text_tone_variety(
    request: QuickScoreRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Calculate tone variety score from messages.
    Returns: tone_variety_score, dominant_tones, unique_expressions.
    """
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")
    
    try:
        messages = [
            {"sender": m.sender, "content": m.content, "timestamp": m.timestamp or datetime.now(timezone.utc).isoformat()}
            for m in request.messages
        ]
        
        result = await text_analyzer.calculate_tone_variety(
            user_id=x_user_id or "anonymous",
            couple_id=request.couple_id,
            messages=messages
        )
        
        return {
            "success": True,
            "analyzer": "text",
            "analysis_date": result.get("analysis_date"),
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tone variety analysis failed: {str(e)}")


@router.post("/text/emotional-patterns")
async def text_emotional_patterns(
    request: QuickScoreRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Detect emotional patterns in text messages.
    Returns: emotional_patterns_detected, trigger_words, positive/negative triggers.
    """
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")
    
    try:
        messages = [
            {"sender": m.sender, "content": m.content, "timestamp": m.timestamp or datetime.now(timezone.utc).isoformat()}
            for m in request.messages
        ]
        
        result = await text_analyzer.detect_emotional_patterns(
            user_id=x_user_id or "anonymous",
            couple_id=request.couple_id,
            messages=messages
        )
        
        return {
            "success": True,
            "analyzer": "text",
            "analysis_date": result.get("analysis_date"),
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotional pattern detection failed: {str(e)}")


# ============================================================================
# ARGUMENT ANALYZER ROUTES
# ============================================================================

@router.post("/argument/analyze")
async def analyze_argument(
    request: ArgumentAnalyzeRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Analyze an argument or conflict situation.
    
    Returns: conflict_score, escalation_patterns, repair_opportunities,
    communication_breakdowns, recommendations.
    """
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")
    
    try:
        result = await argument_analyzer.analyze_argument(
            user_id=x_user_id or "anonymous",
            couple_id=request.couple_id,
            argument_content=request.argument_content,
            context=request.context
        )
        
        # Store result in MongoDB
        db = get_db()
        await db.argument_analyses.insert_one({
            **result,
            "user_id": x_user_id or "anonymous",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "analyzer": "argument",
            "analysis_date": result.get("analysis_date"),
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Argument analysis failed: {str(e)}")


@router.post("/argument/quick-score")
async def argument_quick_score(
    request: ArgumentAnalyzeRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Quick scoring for an argument situation.
    Returns: quick_score, severity_level, primary_concern, immediate_action.
    """
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")
    
    try:
        result = await argument_analyzer.quick_score(
            user_id=x_user_id or "anonymous",
            couple_id=request.couple_id,
            argument_content=request.argument_content
        )
        
        return {
            "success": True,
            "analyzer": "argument",
            "analysis_date": result.get("analysis_date"),
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Argument quick score failed: {str(e)}")


# ============================================================================
# VOICE TONE ANALYZER ROUTES
# ============================================================================

@router.post("/voice/analyze")
async def analyze_voice_tone(
    request: VoiceToneAnalyzeRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Analyze voice tone from transcribed conversation.
    
    Returns: overall_tone_score, speaker_breakdown, tension_indicators,
    warmth_indicators, speaking_balance, recommendations.
    """
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")
    
    try:
        result = await voice_tone_analyzer.analyze_conversation_tone(
            user_id=x_user_id or "anonymous",
            couple_id=request.couple_id,
            transcript=request.transcript,
            speaker_segments=request.speaker_segments
        )
        
        # Store result in MongoDB
        db = get_db()
        await db.voice_tone_analyses.insert_one({
            **result,
            "user_id": x_user_id or "anonymous",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "analyzer": "voice",
            "analysis_date": result.get("analysis_date"),
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice tone analysis failed: {str(e)}")


@router.post("/voice/speaker-balance")
async def voice_speaker_balance(
    request: VoiceToneAnalyzeRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Analyze speaking balance between partners.
    Returns: speaking_ratio, contribution_balance, turn_taking_patterns.
    """
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")
    
    try:
        result = await voice_tone_analyzer.calculate_speaking_balance(
            user_id=x_user_id or "anonymous",
            couple_id=request.couple_id,
            transcript=request.transcript,
            speaker_segments=request.speaker_segments
        )
        
        return {
            "success": True,
            "analyzer": "voice",
            "analysis_date": result.get("analysis_date"),
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speaker balance analysis failed: {str(e)}")


# ============================================================================
# EMOTIONAL PATTERN ANALYZER ROUTES
# ============================================================================

@router.post("/emotional/analyze")
async def analyze_emotional_patterns(
    request: EmotionalPatternRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Analyze long-term emotional patterns in the relationship.
    
    Returns: pattern_summary, emotional_trends, trigger_maps, growth_trajectory,
    historical_comparison, recommendations.
    """
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")
    
    try:
        messages = [
            {"sender": m.sender, "content": m.content, "timestamp": m.timestamp or datetime.now(timezone.utc).isoformat()}
            for m in request.messages
        ]
        
        result = await emotional_pattern_analyzer.analyze_patterns(
            user_id=x_user_id or "anonymous",
            couple_id=request.couple_id,
            message_history=messages,
            time_range=request.time_range
        )
        
        # Store result in MongoDB
        db = get_db()
        await db.emotional_pattern_analyses.insert_one({
            **result,
            "user_id": x_user_id or "anonymous",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "analyzer": "emotional",
            "analysis_date": result.get("analysis_date"),
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotional pattern analysis failed: {str(e)}")


@router.post("/emotional/trend")
async def emotional_trend(
    request: EmotionalPatternRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Get emotional trend analysis for a time period.
    Returns: trend_direction, period_summary, significant_shifts.
    """
    if not analyzers_available:
        raise HTTPException(status_code=503, detail="Analyzer services not available")
    
    try:
        messages = [
            {"sender": m.sender, "content": m.content, "timestamp": m.timestamp or datetime.now(timezone.utc).isoformat()}
            for m in request.messages
        ]
        
        result = await emotional_pattern_analyzer.get_emotional_trend(
            user_id=x_user_id or "anonymous",
            couple_id=request.couple_id,
            message_history=messages,
            time_range=request.time_range
        )
        
        return {
            "success": True,
            "analyzer": "emotional",
            "analysis_date": result.get("analysis_date"),
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotional trend analysis failed: {str(e)}")


# ============================================================================
# HISTORY & RETRIEVAL ENDPOINTS
# ============================================================================

@router.get("/history/{couple_id}")
async def get_analyzer_history(
    couple_id: str,
    analyzer: Optional[str] = None,
    limit: int = 20
):
    """
    Get analysis history for a couple.
    
    Args:
        couple_id: Couple unit ID
        analyzer: Optional filter by analyzer type (communication, text, argument, voice, emotional)
        limit: Number of results to return (max 100)
    """
    try:
        sb = get_supabase()
        cols = {
            "communication": "communication_analyses",
            "text": "text_analyses",
            "argument": "argument_analyses",
            "voice": "voice_tone_analyses",
            "emotional": "emotional_pattern_analyses"
        }
        if analyzer and analyzer in cols:
            result = await sb.table(cols[analyzer]).select("*").eq("couple_id", couple_id).order("created_at", desc=True).limit(limit)
            results = result.data or []
        else:
            results = []
            for col in cols.values():
                result = await sb.table(col).select("*").eq("couple_id", couple_id).order("created_at", desc=True).limit(limit // 2)
                results.extend(result.data or [])
            results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            results = results[:limit]
        return {"success": True, "couple_id": couple_id, "count": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")


@router.get("/summary/{couple_id}")
async def get_analyzer_summary(couple_id: str):
    """
    Get a summary of all analyzer results for a couple.quality.9
    Returns latest result from each analyzer type.
    """
    try:
        sb = get_supabase()
        cols = {
            "communication": "communication_analyses",
            "text": "text_analyses",
            "argument": "argument_analyses",
            "voice": "voice_tone_analyses",
            "emotional": "emotional_pattern_analyses"
        }
        summary = {}
        for name, table in cols.items():
            result = await sb.table(table).select("*").eq("couple_id", couple_id).order("created_at", desc=True).limit(1)
            data = result.data
            if data:
                r = data[0]
                summary[name] = {
                    "last_analyzed": r.get("analysis_date"),
                    "score": r.get("overall_score") or r.get("quick_score"),
                    "key_insight": r.get("key_positive", [None])[0] if r.get("key_positive") else (r.get("recommendations", [None])[0] if r.get("recommendations") else None)
                }
        return {"success": True, "couple_id": couple_id, "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")