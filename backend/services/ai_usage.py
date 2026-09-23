"""
AI insight allowance. Premium is per couple (either partner's active subscription covers both);
free users get FREE_AI_INSIGHTS_PER_MONTH generated insights per calendar month (UTC).
One definition, used by both the subscription/usage endpoint and the insight endpoints.
"""

from datetime import datetime, timezone
from typing import Iterable, List

FREE_AI_INSIGHTS_PER_MONTH = 5
ANALYZER_TABLES = (
    "communication_analyses",
    "text_analyses",
    "argument_analyses",
    "emotional_pattern_analyses",
)


def month_start(now: datetime = None) -> datetime:
    now = now or datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def couple_member_ids(db, user_id: str) -> List[str]:
    ids = [user_id]
    rows = (
        db.table("couple_units")
        .select("user1_id, user2_id")
        .eq("status", "active")
        .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")
        .execute()
        .data
        or []
    )
    for row in rows:
        for member in (row.get("user1_id"), row.get("user2_id")):
            if member and member not in ids:
                ids.append(member)
    return ids


def is_couple_premium(db, member_ids: Iterable[str]) -> bool:
    now = datetime.now(timezone.utc)
    rows = (
        db.table("subscriptions")
        .select("expires_at")
        .in_("user_id", list(member_ids))
        .eq("status", "active")
        .execute()
        .data
        or []
    )
    for row in rows:
        try:
            if datetime.fromisoformat(row["expires_at"]) > now:
                return True
        except (KeyError, TypeError, ValueError):
            continue
    return False


def insights_used_this_month(db, user_id: str) -> int:
    """AI uses this month: the user's individual insights, couple insights on results they're part of,
    relationship summaries they requested, and analyzer runs they started."""
    since = month_start().isoformat()
    individual = (
        db.table("individual_insights")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("status", "ready")
        .gte("created_at", since)
        .execute()
    )
    couple = (
        db.table("couple_results")
        .select("id", count="exact")
        .or_(f"partner1_id.eq.{user_id},partner2_id.eq.{user_id}")
        .eq("ai_status", "ready")
        .gte("ai_updated_at", since)
        .execute()
    )
    summaries = (
        db.table("relationship_summaries")
        .select("id", count="exact")
        .eq("requested_by", user_id)
        .eq("status", "ready")
        .gte("created_at", since)
        .execute()
    )
    analyses = [
        db.table(table)
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("analysis_date", since)
        .execute()
        for table in ANALYZER_TABLES
    ]
    return sum((r.count or 0) for r in (individual, couple, summaries, *analyses))


def can_generate(db, user_id: str) -> bool:
    if is_couple_premium(db, couple_member_ids(db, user_id)):
        return True
    return insights_used_this_month(db, user_id) < FREE_AI_INSIGHTS_PER_MONTH
