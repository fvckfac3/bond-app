"""
Builds the data an AI insight is written from, loaded server-side with the service role.

Privacy (PRDs'@/03 Safety & Privacy): only *derived* data goes to the model — scores,
bands, dimension labels, patterns, counts and averages. Never free text a person wrote
(check-in notes, activity responses, answers to open prompts), so nothing one partner wrote
can be echoed to the other. A partner's individual results are included only where the app
would already show them to the reader: assessments both partners have completed.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

HISTORY_DAYS = 90
CHECKIN_DAYS = 30


def _day(value: Optional[str]) -> Optional[str]:
    return value[:10] if isinstance(value, str) else None


def _labels(items, limit=3) -> List[str]:
    out = []
    for item in items or []:
        label = item.get("label") if isinstance(item, dict) else item
        if label and label not in out:
            out.append(label)
    return out[:limit]


class InsightContext:
    """Read-only loader for one user's (and their couple's) insight inputs."""

    def __init__(self, db):
        self.db = db
        self._assessments: Optional[Dict[str, Dict[str, Any]]] = None

    # ---------------------------------------------------------------- basics
    def couple_for(self, user_id: str) -> Optional[Dict[str, Any]]:
        """The user's ACTIVE couple: {id, user1_id, user2_id, partner_id} or None."""
        rows = (
            self.db.table("couple_units")
            .select("id, user1_id, user2_id")
            .eq("status", "active")
            .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")
            .execute()
            .data
            or []
        )
        if not rows:
            return None
        row = rows[0]
        row["partner_id"] = row["user2_id"] if row["user1_id"] == user_id else row["user1_id"]
        return row

    def first_names(self, *user_ids: str) -> Dict[str, str]:
        ids = [u for u in user_ids if u]
        if not ids:
            return {}
        rows = self.db.table("users").select("id, name").in_("id", ids).execute().data or []
        names = {r["id"]: (r.get("name") or "").strip().split(" ")[0] for r in rows}
        out: Dict[str, str] = {}
        for i, uid in enumerate(ids):
            name = names.get(uid) or f"Partner {'AB'[i] if i < 2 else i + 1}"
            # Names key per-partner data, so two partners called "Alex" must stay distinct.
            while name in out.values():
                name = f"{name} ({i + 1})"
            out[uid] = name
        return out

    def assessment_meta(self, assessment_id: str) -> Dict[str, Any]:
        if self._assessments is None:
            rows = self.db.table("assessments").select("id, name, framework").execute().data or []
            self._assessments = {r["id"]: r for r in rows}
        return self._assessments.get(assessment_id) or {
            "id": assessment_id,
            "name": assessment_id,
            "framework": None,
        }

    # ---------------------------------------------------------------- assessments
    def summarize_scores(
        self, assessment_id: str, scores: Dict[str, Any], completed_at: Optional[str]
    ) -> Dict[str, Any]:
        """An assessment result as the model sees it (scores are 0-100, higher = healthier)."""
        meta = self.assessment_meta(assessment_id)
        scores = scores or {}
        dimensions = []
        for d in scores.get("dimensionScores") or []:
            if not isinstance(d, dict) or d.get("score") is None:
                continue
            entry = {"dimension": d.get("label") or d.get("key"), "score": round(float(d["score"]))}
            if d.get("direction") == "risk":
                entry["note"] = "risk pattern: a higher score means less of it"
            dimensions.append(entry)
        return {
            "assessment": meta.get("name"),
            "framework": meta.get("framework"),
            "completed_on": _day(completed_at),
            "overall_score": scores.get("overallScore"),
            "band": (scores.get("band") or {}).get("title"),
            "profile": (scores.get("profileType") or {}).get("title"),
            "dimensions": dimensions,
            "strongest_areas": _labels(scores.get("strengths")),
            "growth_areas": _labels(scores.get("growthAreas")),
        }

    def completed_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        return (
            self.db.table("assessment_sessions")
            .select("id, assessment_id, scores, submitted_at")
            .eq("user_id", user_id)
            .eq("completed", True)
            .order("submitted_at", desc=True)
            .execute()
            .data
            or []
        )

    def summaries_for(
        self, sessions: List[Dict[str, Any]], exclude_session: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return [
            self.summarize_scores(s["assessment_id"], s.get("scores"), s.get("submitted_at"))
            for s in sessions
            if s["id"] != exclude_session and s["assessment_id"] != "onboarding-assessment"
        ]

    def partner_visible_summaries(self, user_id: str, partner_id: str) -> List[Dict[str, Any]]:
        """The partner's results for assessments the reader has also completed (the app's paired gate)."""
        mine = {s["assessment_id"] for s in self.completed_sessions(user_id)}
        theirs = [s for s in self.completed_sessions(partner_id) if s["assessment_id"] in mine]
        return self.summaries_for(theirs)

    def couple_result_summaries(
        self, couple_id: str, exclude_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        rows = (
            self.db.table("couple_results")
            .select(
                "id, assessment_id, compatibility_score, relationship_pattern_title, "
                "shared_strengths, shared_growth_areas, created_at"
            )
            .eq("couple_unit_id", couple_id)
            .order("created_at", desc=True)
            .execute()
            .data
            or []
        )
        return [
            {
                "assessment": self.assessment_meta(r["assessment_id"]).get("name"),
                "completed_on": _day(r.get("created_at")),
                "combined_score": r.get("compatibility_score"),
                "pattern": r.get("relationship_pattern_title"),
                "shared_strengths": _labels(r.get("shared_strengths")),
                "shared_growth_areas": _labels(r.get("shared_growth_areas")),
            }
            for r in rows
            if r["id"] != exclude_id
        ]

    # ---------------------------------------------------------------- everyday activity
    def checkin_trends(self, couple_id: Optional[str], user_ids: List[str]) -> Dict[str, Any]:
        since = (datetime.now(timezone.utc) - timedelta(days=CHECKIN_DAYS)).date().isoformat()
        query = (
            self.db.table("daily_check_ins")
            .select("user_id, date, connection_score")
            .gte("date", since)
        )
        query = (
            query.eq("couple_unit_id", couple_id) if couple_id else query.in_("user_id", user_ids)
        )
        rows = query.execute().data or []
        out = {"period_days": CHECKIN_DAYS}
        for uid in user_ids:
            scores = [
                r["connection_score"]
                for r in rows
                if r["user_id"] == uid and r.get("connection_score")
            ]
            out[uid] = {
                "check_ins": len([r for r in rows if r["user_id"] == uid]),
                "average_connection_out_of_10": (
                    round(sum(scores) / len(scores), 1) if scores else None
                ),
            }
        return out

    def activity_summary(self, user_id: str, partner_id: Optional[str]) -> Dict[str, Any]:
        """Completed activities in the last 90 days: the reader's own plus the partner's shared ones."""
        since = (datetime.now(timezone.utc) - timedelta(days=HISTORY_DAYS)).isoformat()
        rows = (
            self.db.table("activity_completions")
            .select("user_id, shared_with_partner, activities(title, category)")
            .in_("user_id", [u for u in (user_id, partner_id) if u])
            .gte("completed_at", since)
            .execute()
            .data
            or []
        )
        visible = [r for r in rows if r["user_id"] == user_id or r.get("shared_with_partner")]
        titles = []
        for r in visible:
            title = (r.get("activities") or {}).get("title")
            if title and title not in titles:
                titles.append(title)
        return {
            "period_days": HISTORY_DAYS,
            "completed": len(visible),
            "recent_activities": titles[:8],
        }

    def learning_summary(self, user_id: str) -> Dict[str, Any]:
        rows = (
            self.db.table("learning_series_progress")
            .select("series_key, module_key")
            .eq("user_id", user_id)
            .eq("completed", True)
            .execute()
            .data
            or []
        )
        return {"lessons_completed": len(rows), "series": sorted({r["series_key"] for r in rows})}

    def onboarding(self, user_id: str) -> Optional[Dict[str, Any]]:
        rows = (
            self.db.table("onboarding_assessments")
            .select("recommendations, feedback")
            .eq("user_id", user_id)
            .eq("completed", True)
            .execute()
            .data
            or []
        )
        if not rows:
            return None
        feedback = rows[0].get("feedback") or {}
        return {
            "starting_point": (rows[0].get("recommendations") or {}).get("headline"),
            "stage": feedback.get("stageSummary"),
        }

    # ---------------------------------------------------------------- bundles for each insight
    def for_individual(self, user_id: str, session: Dict[str, Any]) -> Dict[str, Any]:
        couple = self.couple_for(user_id)
        partner_id = couple["partner_id"] if couple else None
        ctx: Dict[str, Any] = {
            "this_result": self.summarize_scores(
                session["assessment_id"], session.get("scores"), session.get("submitted_at")
            ),
            "your_other_results": self.summaries_for(
                self.completed_sessions(user_id), exclude_session=session["id"]
            )[:8],
            "your_learning": self.learning_summary(user_id),
            "your_starting_point": self.onboarding(user_id),
            "paired": bool(couple and partner_id),
        }
        if couple and partner_id:
            trends = self.checkin_trends(couple["id"], [user_id, partner_id])
            ctx.update(
                partner_results_you_can_both_see=self.partner_visible_summaries(
                    user_id, partner_id
                )[:6],
                couple_results=self.couple_result_summaries(couple["id"])[:6],
                check_ins={
                    "you": trends[user_id],
                    "partner": trends[partner_id],
                    "period_days": trends["period_days"],
                },
                activities=self.activity_summary(user_id, partner_id),
            )
        else:
            ctx["check_ins"] = {"you": self.checkin_trends(None, [user_id])[user_id]}
            ctx["activities"] = self.activity_summary(user_id, None)
        return ctx

    def for_couple(
        self, result: Dict[str, Any], sessions: Dict[str, Dict[str, Any]], names: Dict[str, str]
    ) -> Dict[str, Any]:
        """`sessions` maps partner id -> their session for this assessment."""
        p1, p2 = result["partner1_id"], result["partner2_id"]
        comparisons = []
        for c in result.get("dimension_comparisons") or []:
            if isinstance(c, dict):
                comparisons.append(
                    {
                        "dimension": c.get("label") or c.get("key"),
                        names[p1]: c.get("leftScore"),
                        names[p2]: c.get("rightScore"),
                        "gap": c.get("gap"),
                    }
                )
        trends = self.checkin_trends(result["couple_unit_id"], [p1, p2])
        return {
            "assessment": self.assessment_meta(result["assessment_id"]).get("name"),
            "framework": self.assessment_meta(result["assessment_id"]).get("framework"),
            "partners": [names[p1], names[p2]],
            "results": {
                names[p1]: self.summarize_scores(
                    result["assessment_id"],
                    sessions[p1].get("scores"),
                    sessions[p1].get("submitted_at"),
                ),
                names[p2]: self.summarize_scores(
                    result["assessment_id"],
                    sessions[p2].get("scores"),
                    sessions[p2].get("submitted_at"),
                ),
            },
            "comparison": {
                "combined_score": result.get("compatibility_score"),
                "dimensions": comparisons,
                "shared_strengths": _labels(result.get("shared_strengths")),
                "shared_growth_areas": _labels(result.get("shared_growth_areas")),
                "differences_to_explore": _labels(result.get("asymmetry_flags")),
                "pattern": {
                    "title": result.get("relationship_pattern_title"),
                    "summary": result.get("relationship_pattern_summary"),
                },
                "app_action_plan": result.get("action_plan") or [],
                "app_warnings": (result.get("combined_scores") or {}).get("warnings") or [],
                "top_preferences": {
                    names[p1]: ((result.get("combined_scores") or {}).get("topPreferences") or {}).get("partner1"),
                    names[p2]: ((result.get("combined_scores") or {}).get("topPreferences") or {}).get("partner2"),
                },
            },
            "other_couple_results": self.couple_result_summaries(
                result["couple_unit_id"], exclude_id=result["id"]
            )[:6],
            "check_ins": {
                names[p1]: trends[p1],
                names[p2]: trends[p2],
                "period_days": trends["period_days"],
            },
        }

    def for_summary(self, couple: Dict[str, Any], names: Dict[str, str]) -> Dict[str, Any]:
        p1, p2 = couple["user1_id"], couple["user2_id"]
        trends = self.checkin_trends(couple["id"], [p1, p2])
        since = (datetime.now(timezone.utc) - timedelta(days=HISTORY_DAYS)).isoformat()
        activities = (
            self.db.table("activity_completions")
            .select("id", count="exact")
            .eq("couple_unit_id", couple["id"])
            .gte("completed_at", since)
            .execute()
        )
        deep_dives = (
            self.db.table("couple_deep_dives")
            .select("theme_key, month, completed_weeks, status")
            .eq("couple_unit_id", couple["id"])
            .order("month", desc=True)
            .limit(3)
            .execute()
            .data
            or []
        )
        return {
            "partners": [names[p1], names[p2]],
            "couple_results": self.couple_result_summaries(couple["id"])[:8],
            "check_ins": {
                names[p1]: trends[p1],
                names[p2]: trends[p2],
                "period_days": trends["period_days"],
            },
            "activities_completed_last_90_days": activities.count or 0,
            "recent_deep_dives": [
                {
                    "theme": d["theme_key"],
                    "month": _day(d.get("month")),
                    "weeks_done": len(d.get("completed_weeks") or []),
                    "status": d.get("status"),
                }
                for d in deep_dives
            ],
            "learning": {
                names[p1]: self.learning_summary(p1),
                names[p2]: self.learning_summary(p2),
            },
        }
