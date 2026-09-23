"""
The one way the backend talks to the LLM gateway (emergentintegrations' LlmChat, keyed by
EMERGENT_LLM_KEY). Every AI feature — insights and analyzers — goes through `generate_json`.

It never invents output: a missing key, a gateway error, unparseable JSON, or a response
without the required fields raises, so callers can report failure instead of saving
canned text as if the model had written it.
"""

import json
import logging
import os
import re
from typing import Any, Dict, Iterable

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-5.1")


class LLMUnavailable(Exception):
    """The gateway isn't configured (no EMERGENT_LLM_KEY)."""


class LLMError(Exception):
    """The gateway failed or returned something we can't use."""


def llm_configured() -> bool:
    return bool(os.getenv("EMERGENT_LLM_KEY"))


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
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        raise LLMUnavailable("EMERGENT_LLM_KEY is not set")

    chat = LlmChat(api_key=api_key, session_id=session_id, system_message=system).with_model(
        LLM_PROVIDER, LLM_MODEL
    )
    try:
        raw = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:  # gateway/network failure
        logger.error("LLM gateway error (%s): %s", session_id, e)
        raise LLMError(f"LLM gateway error: {e}")

    data = parse_json_object(raw)
    missing = [key for key in required if data.get(key) in (None, "", [], {})]
    if missing:
        raise LLMError(f"Model reply is missing {', '.join(missing)}")
    return data
