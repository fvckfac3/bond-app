# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project structure

Bond is a relationship-wellness app for couples. This repo holds four independent components sharing one repo — there is no root package.json/workspace linking them:

- `mobile/` — Expo/React Native app. **This is the product.** 100% of real user-facing screens live here. See `mobile/CLAUDE.md` for mobile-specific conventions.
- `backend/` — FastAPI thin services layer (AI insight generation, 5 communication analyzers, Stripe billing). Not a general CRUD API — mobile talks to Supabase directly for everything else. There is no MongoDB anywhere; the old Mongo-backed `routes/features.py` was removed.
- `frontend/` — Create React App + shadcn scaffold. **Vestigial — has no Bond-specific screens.** Do not build features against it unless a human has explicitly decided to revive a web client.
- `supabase/` — Postgres schema, migrations, seeds. `supabase/bond_schema.sql` (not the `migrations/` folder) is the canonical source of truth for current tables — the migrations folder is incomplete (missing 001 and 005). `supabase/bond_seed.sql` seeds only the `assessments` registry; content seeds are migrations 012–013.

Full product/architecture requirements live in `PRDs'@/` — read `PRDs'@/00_Master_Index-1.md` first; it states precedence rules and binding instructions for AI coding agents. `PRDs'@/11_Audit_Findings...md` is referenced throughout as the essential source for specific known bugs but may not exist yet in this checkout — check for it before assuming the list below is complete.

## Binding rules (from PRDs'@/00_Master_Index-1.md §7)

- Couple-scoped by default — most tables key off `couple_unit_id`, not just `user_id`. New features should default to couple-scoped unless there's a reason not to.
- Partners are symmetric (`couple_units.user1_id`/`user2_id`, no role distinction) — don't introduce an implicit "primary partner."
- AI insight, not AI arbitration — `backend/services/ai_insights.py` narrates/suggests; it must never take sides or score who's "right."
- Do not query or write the singular-named analyzer tables (`communication_analysis`, `text_message_analysis`, `argument_analysis`, `voice_tone_analysis`, `emotional_pattern_analysis`) — orphaned from `migrations/002_add_missing_features.sql`. Live code uses the plural-named tables (`communication_analyses`, etc.).
- Content is hybrid (decided 2026-09, PRD 10 "Content"). Assessments and all individual/couple scoring live in the app (`mobile/utils/allAssessments.js`, `assessmentEngine.js`, `coupleAssessment.js`); the old `assessment_questions`/`assessment_dimensions`/`assessment_bands`/couple-rule/onboarding-rule tables were dropped in migration 011 — `assessments` remains only as an id registry. Editorial content lives in Supabase: learning series/modules (migration 012), activities, daily questions, check-in topics, and deep-dive themes (migration 013). Every content row has `review_status`; drafts stay `draft` until a human approves them. The mobile app reads the library via `mobile/services/learning.ts` — don't reintroduce bundled content files.
- Never hardcode an API key or secret in a markdown file, even as a placeholder — this repo has had a real key exposure this way. Use `.env.example` with placeholder values only.
- Stripe webhooks are handled only by `backend/routes/stripe_webhook.py` (`POST /api/webhooks/stripe`); the duplicate handler in `payments.py` was removed. Idempotency is a claim-first insert into the `webhook_events` table (`event_id` UNIQUE), not in-memory — point the Stripe Dashboard at `/api/webhooks/stripe`.
- Memory Lane (`app/memory-lane.tsx`) and Bucket List (`app/bucket-list.tsx`) read and write the `memory_lane` / `bucket_list` tables directly from the app under couple-scoped RLS (migration 009). The other `src/screens/features/` prototypes (Daily Questions, Check-in Topics, Monthly Deep Dive) are unrouted and still call the removed `/api/features` endpoints — port them to Supabase the same way before routing them.
- Premium is per couple: a user is Premium if they or their active partner holds an active subscription. Mobile reads it via the `get_couple_subscription()` SQL function (defined at the end of `supabase/bond_schema.sql` — must be applied to the live DB); the backend's `/api/subscription/user/{id}` checks both partners. Free-tier usage limits (assessments/activities) are still counted per user.

## Backend env vars

The Supabase service-role secret is `SUPABASE_SERVICE_ROLE_KEY` in every backend file (`server.py`, `routes/analyzers.py`, `routes/payments.py`, `routes/stripe_webhook.py`) — the old `SUPABASE_SERVICE_KEY` name is gone, so deployment env config must set the new name. Don't reintroduce another name.

## Commands

- `mobile/`: `npm start` (Expo dev server), `npm run ios` / `npm run android` / `npm run web`, `npm run lint` (ESLint via `expo lint`, flat config in `mobile/eslint.config.js`). No test script is defined.
- `frontend/`: `npm start` (craco dev server), `npm run build`, `npm run test`. Scaffold only — see above.
- `backend/`: `make format` (black + isort), `make lint` (flake8), `make typecheck` (mypy), `make check` (all three), `make test` (pytest against `backend/tests/`). Config lives in `backend/pyproject.toml` and `backend/.flake8`. No CI is configured (`.github/` doesn't exist).

## Notes

- No formatter is configured for `frontend/` (no Prettier config) — match surrounding style by hand there. Mobile and backend now have lint/format tooling (see Commands above), but most existing files haven't been run through it yet — `make check` in `backend/` and `npm run lint` in `mobile/` both currently report pre-existing issues, including a few that look like real bugs (undefined names in `backend/routes/analyzers.py`/`server.py`, syntax parse errors in a couple of `mobile/src/screens/ai/*.tsx` files). Don't let unrelated pre-existing lint noise block a change — fix what's in scope for the task at hand.
- `backend/requirements.txt` was missing `stripe` (imported directly by `routes/payments.py` and `routes/stripe_webhook.py`) — added, along with `httpx` for FastAPI's `TestClient`. `emergentintegrations` (Emergent.sh-private, not on PyPI) still can't be installed outside their build image; `backend/tests/stubs/emergentintegrations/` provides a minimal stand-in so `routes/payments.py` is importable under pytest — see `backend/tests/conftest.py`.
- `backend/tests/` has real pytest coverage for `routes/payments.py` (checkout pricing integrity, checkout-status polling idempotency, usage limits) and `routes/stripe_webhook.py` (Supabase-backed webhook idempotency incl. restart-survival, signature checks, every subscription lifecycle handler).
- Analyzer endpoints (`backend/routes/analyzers.py`) require `Authorization: Bearer <Supabase session JWT>` (user identity comes from the token, never a client-supplied header) and 403 unless that user is in an ACTIVE couple unit matching the request's `couple_id`. Only derived scores are stored (never raw messages/transcripts). `voice/speaker-balance` and `emotional/trend` return 501 — the services have no such methods. `tests/stubs/emergentintegrations/llm/chat.py` stubs the LLM gateway so `test_analyzers.py` runs offline.
- Root has ~20 loose deployment/marketing `*.md` files; the project's own PRD audit calls most of them stale/redundant.
