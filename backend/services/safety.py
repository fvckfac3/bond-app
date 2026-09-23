"""
Rules every AI output in Bond must follow (PRDs'@/03 Safety & Privacy §4-5, 05 Content & Copy §3),
shared by the insight generators and the analyzers so no prompt can drift from them.
"""

import re
from typing import Any, Dict

SAFETY_RULES = """You write for Bond, a relationship-wellness app used by couples. Follow these rules in everything you write:

- Describe patterns, not verdicts ("a pattern worth noticing is..." — never "what's wrong with you").
- Never take sides, name a "winner", assign blame, or imply one partner is the problem.
- Address growth suggestions to the couple (or, in a private individual insight, to the reader) as shared, doable steps — never "your partner needs to change".
- Always include a genuine, specific strength alongside any growth area.
- Never diagnose or label anyone with a clinical or personality condition, and don't present framework terms (e.g. attachment styles) as diagnoses — they are patterns that can change.
- Never suggest ending, pausing, or leaving the relationship.
- Never quote or closely paraphrase a partner's own words back to the other partner; describe the pattern instead.
- No urgency, fear, or pressure language. Warm, plain, specific. No jargon.
- Base everything only on the data provided. Don't invent events, feelings, or history.
- If anything suggests fear of a partner, threats, intimidation, coercion, physical harm, or thoughts of self-harm, set "safety_note" to a short, caring message that points to real help (in the US: the National Domestic Violence Hotline, 1-800-799-7233 or text START to 88788; the 988 Suicide & Crisis Lifeline, call or text 988; or local emergency services), and do not suggest couple exercises for that issue. Otherwise set "safety_note" to null.

Respond with a single JSON object only — no markdown, no text outside the JSON."""

SAFETY_NOTE = (
    "Some of what was shared sounds painful or unsafe. You deserve support: in the US you can reach the "
    "National Domestic Violence Hotline at 1-800-799-7233 (or text START to 88788), or call or text 988 "
    "(Suicide & Crisis Lifeline). If you are in immediate danger, contact local emergency services. "
    "Relationship exercises are not the right tool when someone feels unsafe."
)

# Conservative phrases that should always surface the safety note, whatever the model returns.
_RISK_PATTERNS = re.compile(
    r"\b(hit|hits|hitting|punch(?:ed|es)?|slap(?:ped|s)?|chok(?:e|ed|ing)|strangl\w*|shov(?:e|ed)"
    r"|kill (?:you|me|myself|him|her)|hurt (?:you|me|myself)|threaten\w*|afraid of (?:you|him|her|them)"
    r"|scared of (?:you|him|her|them)|suicid\w*|self[- ]harm|end my life|don'?t want to (?:live|be alive)"
    r"|force[sd]? me|won'?t let me leave)\b",
    re.IGNORECASE,
)


def detect_risk(text: str) -> bool:
    return bool(text) and bool(_RISK_PATTERNS.search(text))


def apply_safety(result: Dict[str, Any], *, source_text: str = "") -> Dict[str, Any]:
    """Normalize `safety_note`, and force it when the input itself contains risk language."""
    note = result.get("safety_note")
    if not isinstance(note, str) or not note.strip():
        note = None
    if detect_risk(source_text):
        note = SAFETY_NOTE
    result["safety_note"] = note
    return result
