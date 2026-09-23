"""
Best-effort Expo push notifications. A failure here never fails the request that triggered it.
Tokens come from user_push_tokens (registered by the app's services/pushNotifications.js).
"""

import logging
from typing import Any, Dict, Iterable, Optional

import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push(
    db, user_ids: Iterable[str], title: str, body: str, data: Optional[Dict[str, Any]] = None
) -> int:
    """Send one notification to each user with a registered token; returns how many were sent."""
    ids = [u for u in user_ids if u]
    if not ids:
        return 0
    try:
        rows = db.table("user_push_tokens").select("token").in_("user_id", ids).execute().data or []
        messages = [
            {"to": r["token"], "title": title, "body": body, "data": data or {}, "sound": "default"}
            for r in rows
            if r.get("token")
        ]
        if not messages:
            return 0
        async with httpx.AsyncClient(timeout=10) as client:
            (await client.post(EXPO_PUSH_URL, json=messages)).raise_for_status()
        return len(messages)
    except Exception as e:
        logger.warning("Push notification failed: %s", e)
        return 0
