"""
The four text analyzers (communication, text, argument, emotional pattern), built on the shared
LLM helper and safety rules (PRDs'@/03 Safety & Privacy §3, §5; 01 Core Systems §5).

Rules this module enforces:
  * Output describes patterns — speakers are "Partner A" / "Partner B", never quoted.
  * Quotes of the input that slip into the output are removed before anything is stored.
  * Only the derived analysis is stored (key score columns + a `result` JSONB) — never raw input.
  * Risk language in the input always surfaces the safety note.
Voice tone analysis is not offered (deferred).
"""

import re
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional, Tuple

from services.insight_prompts import _list, _str
from services.safety import SAFETY_RULES, apply_safety


def _score(value: Any) -> Optional[int]:
    try:
        return max(0, min(100, int(round(float(value)))))
    except (TypeError, ValueError):
        return None


@dataclass(frozen=True)
class AnalyzerSpec:
    kind: str
    table: str
    title: str
    focus: str
    extra_schema: str
    extra_required: Tuple[str, ...]
    columns: Callable[[Dict[str, Any]], Dict[str, Any]]
    message_days: int  # how far back to read the couple's in-app messages


def _communication_columns(r):
    return {
        "overall_score": r["overall_score"],
        "sentiment": r.get("sentiment"),
        "listening_score": r.get("listening_score"),
        "engagement_score": r.get("engagement_score"),
        "key_positive": r["strengths"],
        "key_negative": [p["pattern"] for p in r["patterns"]],
        "recommendations": r["recommendations"],
    }


def _text_columns(r):
    return {
        "tone_variety_score": r.get("tone_variety_score"),
        "dominant_tones": r.get("dominant_tones") or [],
        "emotional_depth_score": r.get("emotional_depth_score"),
        "clarity_score": r.get("clarity_score"),
        "recommendations": r["recommendations"],
    }


def _argument_columns(r):
    return {
        "conflict_score": r["overall_score"],
        "quick_score": r["overall_score"],
        "severity_level": r.get("severity_level"),
        "primary_concern": r.get("primary_concern"),
        "escalation_patterns": r.get("escalation_patterns") or [],
        "repair_opportunities": r.get("repair_opportunities") or [],
        "recommendations": r["recommendations"],
    }


def _emotional_columns(r):
    return {
        "pattern_summary": r["summary"],
        "emotional_trends": r.get("emotional_trends") or [],
        "growth_trajectory": r.get("growth_trajectory"),
        "recommendations": r["recommendations"],
    }


ANALYZERS: Dict[str, AnalyzerSpec] = {
    "communication": AnalyzerSpec(
        kind="communication",
        table="communication_analyses",
        title="Communication",
        focus="how the two partners take turns, listen, respond to each other's bids, and keep the conversation open",
        extra_schema=(
            '  "sentiment": "one of: warm, mostly warm, mixed, tense",\n'
            '  "listening_score": 0-100,\n'
            '  "engagement_score": 0-100,'
        ),
        extra_required=("sentiment",),
        columns=_communication_columns,
        message_days=14,
    ),
    "text": AnalyzerSpec(
        kind="text",
        table="text_analyses",
        title="Text",
        focus="the tone, emotional expression and clarity of written messages, and how tone lands in text",
        extra_schema=(
            '  "tone_variety_score": 0-100,\n'
            '  "emotional_depth_score": 0-100,\n'
            '  "clarity_score": 0-100,\n'
            '  "dominant_tones": ["2-4 single words, e.g. playful, practical, affectionate"],'
        ),
        extra_required=("dominant_tones",),
        columns=_text_columns,
        message_days=30,
    ),
    "argument": AnalyzerSpec(
        kind="argument",
        table="argument_analyses",
        title="Argument",
        focus="how a disagreement escalated or calmed, which Gottman patterns (criticism, contempt, defensiveness, stonewalling) appeared, and where repair was possible",
        extra_schema=(
            '  "severity_level": "one of: low, moderate, high",\n'
            '  "primary_concern": "the underlying need or topic, in one neutral phrase",\n'
            '  "escalation_patterns": ["patterns that raised the temperature, described without blame"],\n'
            '  "repair_opportunities": ["moments where a repair could have landed, and what it might have sounded like"],'
        ),
        extra_required=("severity_level", "repair_opportunities"),
        columns=_argument_columns,
        message_days=7,
    ),
    "emotional": AnalyzerSpec(
        kind="emotional",
        table="emotional_pattern_analyses",
        title="Emotional Pattern",
        focus="recurring emotional themes over time, what tends to bring the couple closer or create distance, and how emotional awareness is growing",
        extra_schema=(
            '  "emotional_trends": ["2-4 recurring emotional themes over the period"],\n'
            '  "growth_trajectory": "one sentence on how things seem to be moving"'
        ),
        extra_required=("emotional_trends",),
        columns=_emotional_columns,
        message_days=90,
    ),
}


def build_prompt(
    spec: AnalyzerSpec, transcript: str, context_note: str
) -> Tuple[str, str, List[str]]:
    system = SAFETY_RULES + (
        "\n\nYou are analyzing a couple's conversation. BOTH partners may read the result. Refer to the "
        'speakers only as "Partner A" and "Partner B". You may describe who did what as a pattern '
        '("Partner B asked more questions"), but never quote or closely paraphrase anything either '
        "partner wrote. Describe what happened between them, not who was right."
    )
    prompt = f"""Analyze this conversation, focusing on {spec.focus}.
{context_note}
CONVERSATION:
<<<
{transcript}
>>>

Return JSON with exactly these keys:
{{
  "summary": "2-3 sentences describing the main patterns",
  "overall_score": 0-100 (how healthy and connecting this exchange is; higher is healthier),
  "strengths": ["2-3 specific things that went well between them"],
  "patterns": [{{"pattern": "short name", "detail": "one sentence, no quotes"}}],
  "recommendations": ["2-3 concrete, shared suggestions"],
  "try_saying": ["2-3 example phrases either partner could use next time (new wording, not quotes)"],
  "strength_affirmation": "one sentence affirming a real strength",
{spec.extra_schema}
  "safety_note": null
}}"""
    required = [
        "summary",
        "overall_score",
        "strengths",
        "recommendations",
        "strength_affirmation",
        *spec.extra_required,
    ]
    return system, prompt, required


def clean_result(spec: AnalyzerSpec, raw: Dict[str, Any]) -> Dict[str, Any]:
    patterns = []
    for p in raw.get("patterns") or []:
        if isinstance(p, dict) and p.get("pattern"):
            patterns.append(
                {"pattern": _str(p["pattern"], 120), "detail": _str(p.get("detail"), 300)}
            )
    result: Dict[str, Any] = {
        "summary": _str(raw.get("summary"), 1200),
        "overall_score": _score(raw.get("overall_score")),
        "strengths": _list(raw.get("strengths")),
        "patterns": patterns[:5],
        "recommendations": _list(raw.get("recommendations")),
        "try_saying": _list(raw.get("try_saying"), limit=3),
        "strength_affirmation": _str(raw.get("strength_affirmation"), 400),
        "safety_note": raw.get("safety_note"),
    }
    if spec.kind == "communication":
        result.update(
            sentiment=_str(raw.get("sentiment"), 40),
            listening_score=_score(raw.get("listening_score")),
            engagement_score=_score(raw.get("engagement_score")),
        )
    elif spec.kind == "text":
        result.update(
            tone_variety_score=_score(raw.get("tone_variety_score")),
            emotional_depth_score=_score(raw.get("emotional_depth_score")),
            clarity_score=_score(raw.get("clarity_score")),
            dominant_tones=_list(raw.get("dominant_tones"), item_limit=30),
        )
    elif spec.kind == "argument":
        level = _str(raw.get("severity_level"), 20).lower()
        result.update(
            severity_level=level if level in ("low", "moderate", "high") else None,
            primary_concern=_str(raw.get("primary_concern"), 200) or None,
            escalation_patterns=_list(raw.get("escalation_patterns")),
            repair_opportunities=_list(raw.get("repair_opportunities")),
        )
    elif spec.kind == "emotional":
        result.update(
            emotional_trends=_list(raw.get("emotional_trends")),
            growth_trajectory=_str(raw.get("growth_trajectory"), 300) or None,
        )
    return result


_QUOTED = re.compile(r"[\"“”']([^\"“”']{12,})[\"“”']")
_WORD = re.compile(r"[a-z0-9']+")


def _words(text: str) -> List[str]:
    return _WORD.findall(text.lower())


def _echoes_source(text: str, source_words: str, window: int = 8) -> bool:
    words = _words(text)
    for i in range(0, max(0, len(words) - window + 1)):
        if " ".join(words[i : i + window]) in source_words:
            return True
    return False


def remove_quotes(value: Any, source: str) -> Any:
    """Strip anything in the output that reproduces the input: quoted passages found in the
    source, and any run of 8+ consecutive words copied from it."""
    source_words = " ".join(_words(source))
    if isinstance(value, str):
        cleaned = _QUOTED.sub(
            lambda m: "[a message]" if " ".join(_words(m.group(1))) in source_words else m.group(0),
            value,
        )
        if _echoes_source(cleaned, source_words):
            return "A moment in the conversation touched on this."
        return cleaned
    if isinstance(value, list):
        return [remove_quotes(v, source) for v in value]
    if isinstance(value, dict):
        return {k: remove_quotes(v, source) for k, v in value.items()}
    return value


def finalize(spec: AnalyzerSpec, raw: Dict[str, Any], source_text: str) -> Dict[str, Any]:
    result = clean_result(spec, raw)
    safety_note = result.pop("safety_note")
    result = remove_quotes(result, source_text)
    result["safety_note"] = safety_note
    return apply_safety(result, source_text=source_text)


def format_messages(messages: List[Dict[str, Any]], partner_a: str) -> str:
    """In-app messages as a transcript with anonymized, symmetric speaker labels."""
    lines = []
    for m in messages:
        speaker = "Partner A" if m["sender_id"] == partner_a else "Partner B"
        lines.append(f"{speaker}: {m['message_text']}")
    return "\n".join(lines)
