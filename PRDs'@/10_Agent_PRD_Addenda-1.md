# Bond — Agent PRD Addenda

**Governed by:** 00 — Master Index
**Agent menu reference:** AppArchitect 14-agent canonical menu (Orchestrator + 13 domain agents)
**Activated for Bond:** 13 of 13 domain agents (unlike Sentient Self, Bond has no Realtime gap — messaging exists, see Realtime below) — confirm messaging's actual transport before treating Realtime as fully built.

## Frontend
**Built:** full mobile screen set (7 tabs + auth + assessment/results/activity flows + subscription), warm-romantic theme, animation stack (moti/reanimated/skia).
**Remaining:** Activity Completion screen (placeholder navigation per last audited status), confirm current status before assuming fixed.

## Backend
**Built:** FastAPI service layer for AI insights, analyzers, payments — 4 route files.
**Remaining:** consolidate the two Stripe webhook handlers (11 §4), remove dead `/api/status` MongoDB-scaffold code (11 §7), unify `SUPABASE_SERVICE_KEY`/`SUPABASE_SERVICE_ROLE_KEY` naming (11 §2).

## Database
**Built:** extensive RLS (78 policies confirmed), ~40 tables across a consolidated schema file.
**Remaining:** migration hygiene cleanup (11 §6) — renumber/consolidate so `migrations/` actually reflects deployable history; resolve the orphaned singular-named analyzer tables from migration 002 (drop them, or confirm nothing external depends on them first); resolve `daily_checkins` vs `daily_check_ins` naming (11 §5).

## Auth
**Built:** Supabase Auth, email/password + signup/login/welcome screens.
**Remaining:** confirm OAuth provider support (not conclusively found either way in this audit); confirm account/couple-unit deletion cascade (03 §8).

## AI
**Built:** insight generation (`ai_insights.py`) via Emergent LLM gateway, five independent analyzers with full + quick-score modes.
**Remaining:** rotate the exposed `EMERGENT_LLM_KEY` (11 §1) — this is an AI-agent-owned credential, so this agent should be the one to update the code/env references once rotated, in coordination with DevOps.

## DevOps
**Built:** Sentry + PostHog genuinely wired (ahead of where Sentient Self was on this front).
**Remaining:** pick ONE deployment target from the five documented guides and delete the rest (11 §8); scrub the leaked key from every markdown file it appears in (11 §1) — this agent should own the actual `git filter-repo`/history-scrub if the key needs removing from history, not just from HEAD.

## QA
**Built:** `test_reports/pytest` directory exists, `tests/` scaffold present.
**Remaining:** no test coverage was confirmed for the analyzers, payments, or webhook logic during this audit — given the webhook duplication and idempotency fragility found (11 §4), this is the highest-value place to add tests before further feature work.

## Experience
**Built:** 7-tab navigation, partner pairing flow, assessment/results flow.
**Remaining:** resolve the open question on whether the app is usable pre-pairing or effectively gated (02 §3) — this is a UX decision with no clear answer from the code alone.

## Integration
**Built:** Stripe checkout, customer portal, subscription status, webhook handling (albeit duplicated).
**Remaining:** confirm whether billing is per-user or per-couple (08 §3-4) — resolve before building any new paywall-gated couple feature.

## Content
**Built:** 16 assessments with framework citations, learning series content, all client-side.
**Remaining:** decide the fate of the dormant Supabase assessment-content schema (11 §3) — either commit to client-side content permanently (and consider dropping the unused tables) or plan a migration to server-driven content (and actually wire it up). Living with both unresolved is the worst option — every new assessment added under the current pattern deepens the eventual migration cost if server-driven content is ever chosen.

## Documentation
**Built:** this suite, plus an unusually large volume of status/guide markdown in the repo root (20+ files: `*_COMPLETE.md`, `*_GUIDE.md`, deployment guides).
**Remaining:** most of those root-level docs are either stale (reference a March 2025 assessment date, predate the current schema) or redundant (5 deployment guides for one decision). Recommend archiving or deleting superseded docs once a canonical deploy target is chosen — a coding agent pointed at this repo will otherwise have to guess which doc is current.

## Analytics
**Built:** PostHog wired, Progress tab with chart visualization (echarts/chart-kit).
**Remaining:** streak tracking status unconfirmed (06 §6, 01 §4) — verify `streaks` functionality actually exists in the current schema before assuming feature parity with what `schema.sql` implies.

## Realtime
**Built:** a Messages tab exists in navigation.
**Remaining:** this audit did not confirm whether messaging is realtime (Supabase Realtime subscriptions, websockets) or polling/request-based. Given no realtime library (socket.io, Supabase Realtime channel usage) was found in the mobile dependency list search performed, treat Messages as **not yet confirmed realtime** — verify before assuming this agent's work is done. If it's polling-based today, that's a legitimate v1 choice, not necessarily a defect — just document which it is.

---
**END OF AGENT PRD ADDENDA**
