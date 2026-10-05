"""
The one way the backend talks to the LLM (Anthropic's Messages API, keyed by
ANTHROPIC_API_KEY). Every AI feature — insights and analyzers — goes through `generate_json`.

It never invents output: a missing key, a gateway error, unparseable JSON, or a response
without the required fields raises, so callers can report failure instead of saving
canned text as if the model had written it.
"""

import json
import logging
import os
import re
from typing import Any, Dict, Iterable

import anthropic

logger = logging.getLogger(__name__)

ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")
MAX_TOKENS = int(os.getenv("ANTHROPIC_MAX_TOKENS", "4096"))


class LLMUnavailable(Exception):
    """The gateway isn't configured (no ANTHROPIC_API_KEY)."""


class LLMError(Exception):
    """The gateway failed or returned something we can't use."""


def llm_configured() -> bool:
    return bool(os.getenv("ANTHROPIC_API_KEY"))


def parse_json_object(raw: str) -> Dict[str, Any]:
    """The JSON object in a model reply, tolerating ```json fences or text around it."""
    if not isinstance(raw, str):
        raise LLMError("Model reply was not text")
    text = raw.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1).strip()
    try:
        value = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end <= start:
            raise LLMError("Model reply contained no JSON object")
        try:
            value = json.loads(text[start : end + 1])
        except json.JSONDecodeError as e:
            raise LLMError(f"Model reply was not valid JSON: {e}")
    if not isinstance(value, dict):
        raise LLMError("Model reply was not a JSON object")
    return value


async def generate_json(
    *, system: str, prompt: str, session_id: str, required: Iterable[str] = ()
) -> Dict[str, Any]:
    """Send one prompt and return the parsed JSON object; raise if anything is off."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise LLMUnavailable("ANTHROPIC_API_KEY is not set")

    client = anthropic.AsyncAnthropic(api_key=api_key)
    try:
        message = await client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=MAX_TOKENS,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as e:  # gateway/network failure
        logger.error("LLM gateway error (%s): %s", session_id, e)
        raise LLMError(f"LLM gateway error: {e}")

    raw = "".join(block.text for block in message.content if getattr(block, "type", None) == "text")
    data = parse_json_object(raw)
    missing = [key for key in required if data.get(key) in (None, "", [], {})]
    if missing:
        raise LLMError(f"Model reply is missing {', '.join(missing)}")
    return data
