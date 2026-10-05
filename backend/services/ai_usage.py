"""
AI allowance per couple and plan tier. One definition, used by the subscription/usage endpoint,
the insight endpoints and the analyzers.

Plans are per couple: the couple's tier is the best active subscription held by either partner.
AI uses (insights generated + analyzer runs) are counted for the couple together — partners share
one monthly allowance (calendar month, UTC):

    free     FREE_AI_INSIGHTS_PER_MONTH   (5)
    plus     PLUS_AI_INSIGHTS_PER_MONTH   (25)
    premium  unlimited

A user who isn't paired has an allowance of their own, counted the same way.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional

FREE_AI_INSIGHTS_PER_MONTH = 5
PLUS_AI_INSIGHTS_PER_MONTH = 25
TIER_AI_LIMITS: Dict[str, Optional[int]] = {
    "free": FREE_AI_INSIGHTS_PER_MONTH,
    "plus": PLUS_AI_INSIGHTS_PER_MONTH,
    "premium": None,  # unlimited
}
TIER_RANK = {"free": 0, "plus": 1, "premium": 2}
TIER_NAMES = {"free": "Free", "plus": "Plus", "premium": "Premium"}
ACTIVE_STATUSES = ("active", "trialing")

ANALYZER_TABLES = (
    "communication_analyses",
    "text_analyses",
    "argument_analyses",
    "emotional_pattern_analyses",
)


def month_start(now: datetime = None) -> datetime:
    now = now or datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def package_tier(package_id: Optional[str]) -> str:
    """plus_monthly / plus_annual -> plus; everything else a paid subscription can be -> premium."""
    return "plus" if (package_id or "").startswith("plus") else "premium"


def active_couple(db, user_id: str) -> Optional[Dict[str, Any]]:
    rows = (
        db.table("couple_units")
        .select("id, user1_id, user2_id")
        .eq("status", "active")
        .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")
        .execute()
        .data
        or []
    )
    return rows[0] if rows else None


def couple_member_ids(db, user_id: str) -> List[str]:
    couple = active_couple(db, user_id) or {}
    ids = [user_id]
    for member in (couple.get("user1_id"), couple.get("user2_id")):
        if member and member not in ids:
            ids.append(member)
    return ids


def couple_tier(db, member_ids: Iterable[str]) -> str:
    """The best tier among the members' active, unexpired subscriptions ('free' if none)."""
    now = datetime.now(timezone.utc)
    rows = (
        db.table("subscriptions")
        .select("package_id, status, expires_at")
        .in_("user_id", list(member_ids))
        .execute()
        .data
        or []
    )
    best = "free"
    for row in rows:
        if row.get("status") not in ACTIVE_STATUSES:
            continue
        try:
            expires = datetime.fromisoformat(str(row["expires_at"]).replace("Z", "+00:00"))
        except (KeyError, TypeError, ValueError):
            continue
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires <= now:
            continue
        tier = package_tier(row.get("package_id"))
        if TIER_RANK[tier] > TIER_RANK[best]:
            best = tier
    return best


def is_couple_premium(db, member_ids: Iterable[str]) -> bool:
    """True for any paid tier (Plus or Premium): paid features are shared by the couple."""
    return couple_tier(db, member_ids) != "free"


def ai_uses_this_month(db, user_id: str) -> int:
    """AI uses this month for the user's couple (or the user alone if unpaired): individual and
    onboarding insights of either partner, couple insights (including onboarding) and relationship
    summaries for the couple, and analyzer runs.
    """
    since = month_start().isoformat()
    couple = active_couple(db, user_id)
    members = couple_member_ids(db, user_id)

    counts = [
        db.table("individual_insights")
        .select("id", count="exact")
        .in_("user_id", members)
        .eq("status", "ready")
        .gte("created_at", since)
        .execute(),
        db.table("onboarding_individual_insights")
        .select("id", count="exact")
        .in_("user_id", members)
        .eq("status", "ready")
        .gte("created_at", since)
        .execute(),
    ]
    if couple and couple.get("id"):
        counts += [
            db.table("couple_results")
            .select("id", count="exact")
            .eq("couple_unit_id", couple["id"])
            .eq("ai_status", "ready")
            .gte("ai_updated_at", since)
            .execute(),
            db.table("relationship_summaries")
            .select("id", count="exact")
            .eq("couple_unit_id", couple["id"])
            .eq("status", "ready")
            .gte("created_at", since)
            .execute(),
            db.table("onboarding_couple_insights")
            .select("id", count="exact")
            .eq("couple_unit_id", couple["id"])
            .eq("ai_status", "ready")
            .gte("ai_updated_at", since)
            .execute(),
        ]
        counts += [
            db.table(table)
            .select("id", count="exact")
            .eq("couple_id", couple["id"])
            .gte("analysis_date", since)
            .execute()
            for table in ANALYZER_TABLES
        ]
    return sum((r.count or 0) for r in counts)


# Kept for callers that only need the number (e.g. the usage endpoint).
insights_used_this_month = ai_uses_this_month


def ai_allowance(db, user_id: str) -> Dict[str, Any]:
    """{tier, limit (None = unlimited), used, remaining (None = unlimited)} for the user's couple."""
    tier = couple_tier(db, couple_member_ids(db, user_id))
    limit = TIER_AI_LIMITS[tier]
    used = ai_uses_this_month(db, user_id)
    return {
        "tier": tier,
        "limit": limit,
        "used": used,
        "remaining": None if limit is None else max(0, limit - used),
    }


def can_generate(db, user_id: str) -> bool:
    allowance = ai_allowance(db, user_id)
    return allowance["limit"] is None or allowance["used"] < allowance["limit"]


def limit_message(tier: str) -> str:
    """What to tell a couple who has used their monthly AI allowance."""
    if tier == "free":
        return (
            f"You've used your {FREE_AI_INSIGHTS_PER_MONTH} free AI insights for this month. "
            f"Plus includes {PLUS_AI_INSIGHTS_PER_MONTH} a month, and Premium is unlimited."
        )
    return (
        f"You've used your {PLUS_AI_INSIGHTS_PER_MONTH} AI insights for this month. "
        "Premium includes unlimited insights and analyses."
    )
