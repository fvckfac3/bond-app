"""
Prompts and output shapes for the three AI insights. Each builder returns (system, prompt,
required_fields); `clean_*` trims the model's JSON to the documented shape before it's stored.
"""

import json
from typing import Any, Dict, List, Tuple

from services.safety import SAFETY_RULES

SCORE_NOTE = (
    "All scores are 0-100 where higher is healthier. For dimensions marked 'risk pattern', a higher "
    "score means less of that pattern (e.g. Attachment Anxiety 85 = low anxiety). Scores are "
    "self-reported snapshots, not measurements of who someone is."
)


def _data(payload: Dict[str, Any]) -> str:
    return json.dumps(payload, indent=2, ensure_ascii=False, default=str)


def _str(value: Any, limit: int = 1200) -> str:
    return str(value).strip()[:limit] if isinstance(value, (str, int, float)) else ""


def _list(value: Any, limit: int = 4, item_limit: int = 300) -> List[str]:
    if not isinstance(value, list):
        return []
    return [
        str(v).strip()[:item_limit]
        for v in value
        if isinstance(v, (str, int, float)) and str(v).strip()
    ][:limit]


# --------------------------------------------------------------------------- individual
def individual_prompt(context: Dict[str, Any]) -> Tuple[str, str, List[str]]:
    system = SAFETY_RULES + (
        "\n\nThis is a PRIVATE insight for one person about their own result. Only they will read it. "
        "Speak to them directly as 'you'. If partner data is included, use it only to explain how the two "
        "of you fit together — never to critique the partner."
    )
    prompt = f"""Write a personal insight about the result below, connecting it to everything else we know about this person and, where available, their relationship.

{SCORE_NOTE}

DATA:
{_data(context)}

Return JSON with exactly these keys:
{{
  "headline": "one warm sentence (max 14 words) capturing the main pattern",
  "summary": "2 short paragraphs: what this result says about how you tend to show up, in plain words, tied to specific scores",
  "strengths": ["2-3 specific strengths shown by the scores"],
  "growth_edges": ["2-3 gentle, specific areas to grow, framed as patterns"],
  "connections": "1 short paragraph linking this result to your other results, check-ins, activities or learning — or null if there is nothing meaningful to connect",
  "try_this_week": ["2-3 small, concrete things to try this week"],
  "reflection_question": "one open question to reflect on",
  "safety_note": null
}}"""
    return system, prompt, ["headline", "summary", "strengths", "growth_edges", "try_this_week"]


def clean_individual(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "headline": _str(raw.get("headline"), 200),
        "summary": _str(raw.get("summary"), 2000),
        "strengths": _list(raw.get("strengths")),
        "growth_edges": _list(raw.get("growth_edges")),
        "connections": _str(raw.get("connections"), 1200) or None,
        "try_this_week": _list(raw.get("try_this_week")),
        "reflection_question": _str(raw.get("reflection_question"), 300) or None,
        "safety_note": raw.get("safety_note"),
    }


# --------------------------------------------------------------------------- couple
def couple_prompt(context: Dict[str, Any]) -> Tuple[str, str, List[str]]:
    system = SAFETY_RULES + (
        "\n\nThis insight is shared: BOTH partners will read the same text. Treat them with complete "
        "symmetry — equal warmth, equal attention, no partner framed as the one with the problem. "
        "Differences are described as differences in style or need, not as right and wrong."
    )
    names = " and ".join(context.get("partners", []))
    prompt = f"""Write a couple insight for {names} about the assessment they have both completed, using their two results, how the results compare, and their wider history in the app.

{SCORE_NOTE}
If "app_warnings" is not empty, include it gently in growth_opportunities as a shared priority (never naming which partner), and mention that a couples counselor can help. If "top_preferences" is present, use each partner's top preferences to make "try_together" concrete.

DATA:
{_data(context)}

Return JSON with exactly these keys:
{{
  "headline": "one warm sentence (max 14 words) about this couple's pattern",
  "narrative": "2-3 short paragraphs describing how their results fit together, using their names evenly",
  "shared_strengths": ["2-3 specific things that work well between them"],
  "growth_opportunities": ["2-3 areas to grow together, framed as a shared project"],
  "how_you_differ": "1 short paragraph on the biggest difference, framed as two valid styles and how to bridge them — or null if they are closely aligned",
  "conversation_starters": ["2-3 gentle opening lines either partner could say to start a conversation"],
  "try_together": ["2-3 small, concrete things to try together this week"],
  "strength_affirmation": "one sentence affirming a real strength of this couple",
  "safety_note": null
}}"""
    return (
        system,
        prompt,
        [
            "headline",
            "narrative",
            "shared_strengths",
            "growth_opportunities",
            "try_together",
            "strength_affirmation",
        ],
    )


def clean_couple(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "headline": _str(raw.get("headline"), 200),
        "narrative": _str(raw.get("narrative"), 3000),
        "shared_strengths": _list(raw.get("shared_strengths")),
        "growth_opportunities": _list(raw.get("growth_opportunities")),
        "how_you_differ": _str(raw.get("how_you_differ"), 1200) or None,
        "conversation_starters": _list(raw.get("conversation_starters")),
        "try_together": _list(raw.get("try_together")),
        "strength_affirmation": _str(raw.get("strength_affirmation"), 400),
        "safety_note": raw.get("safety_note"),
    }


# --------------------------------------------------------------------------- relationship summary
def summary_prompt(context: Dict[str, Any], period_label: str) -> Tuple[str, str, List[str]]:
    system = SAFETY_RULES + (
        "\n\nThis summary is shared: BOTH partners read it. Treat them symmetrically. It looks across "
        "everything they have done in Bond, not at any single result."
    )
    names = " and ".join(context.get("partners", []))
    prompt = f"""Write a relationship summary for {names} for {period_label}, looking across their assessments, check-ins, activities, deep dives and learning.

{SCORE_NOTE}

DATA:
{_data(context)}

Return JSON with exactly these keys:
{{
  "headline": "one warm sentence (max 14 words) summing up where they are",
  "overview": "2 short paragraphs on the overall picture and how it has been moving",
  "highlights": ["2-4 specific things they did or showed that are worth celebrating"],
  "patterns": ["1-3 patterns across their data worth being aware of, framed gently"],
  "focus_for_next_month": ["2-3 concrete, shared focus areas for the coming month, each pointing to something they can do in the app or at home"],
  "strength_affirmation": "one sentence affirming a real strength of this couple",
  "safety_note": null
}}"""
    return (
        system,
        prompt,
        ["headline", "overview", "highlights", "focus_for_next_month", "strength_affirmation"],
    )


def clean_summary(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "headline": _str(raw.get("headline"), 200),
        "overview": _str(raw.get("overview"), 2500),
        "highlights": _list(raw.get("highlights")),
        "patterns": _list(raw.get("patterns"), limit=3),
        "focus_for_next_month": _list(raw.get("focus_for_next_month"), limit=3),
        "strength_affirmation": _str(raw.get("strength_affirmation"), 400),
        "safety_note": raw.get("safety_note"),
    }
