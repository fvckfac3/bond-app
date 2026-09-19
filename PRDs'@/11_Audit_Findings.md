# Bond — Audit Findings & Required Fixes

**Governed by:** 00 — Master Index
**Read this before writing any code against this repo.**

## 1. CRITICAL — Live credential exposed in committed markdown files

`EMERGENT_LLM_KEY=sk-emergent-your-key-here` (a real, non-placeholder API key) appears in plaintext across at least 10 committed files: `DEPLOY_VERCEL_GUIDE.md`, `SUPABASE_DEPLOYMENT_GUIDE.md`, `DEPLOY_FLY_GUIDE.md`, `DEPLOY_RAILWAY_GUIDE.md`, `INTEGRATION_COMPLETE.md`, `PHASE2_COMPLETE.md`, `COMPLETE_IMPLEMENTATION_AND_AUTOMATION.md`, `DEPLOY_RENDER_GUIDE.md`, `DEPLOY_PYTHONANYWHERE_GUIDE.md`, and referenced in `MONETIZATION_IMPLEMENTATION.md`. This repo is public.

**Action (do this before anything else, outside of the Claude Code task):**
1. Rotate/revoke this key with Emergent immediately.
2. Update `backend/.env` (untracked, confirmed safe) with the new key.
3. Scrub the old key value from every file listed above (find-and-replace to a placeholder like `sk-emergent-your-key-here`).
4. The old key will still be visible in git history even after step 3 — if that matters to you, this needs a history rewrite (`git filter-repo` or BFG), which is a separate, more invasive operation. At minimum, do steps 1–3 now.

**Not urgent, but note:** the Supabase anon/publishable key (`sb_publishable_...`) also appears repeated across the same files. This key is *designed* to be public if RLS is correctly enforced, and this audit confirmed RLS is extensively implemented (78 policies in `bond_schema.sql`). Lower priority than the LLM key, but still worth scrubbing from docs as a matter of hygiene — a publishable key hardcoded in ten places is still ten places to update if it ever needs rotating for an unrelated reason.

## 2. Environment variable name mismatch — will crash on missing var

Two different names are used for what should be the same Supabase service-role secret:
- `SUPABASE_SERVICE_KEY` — used by `backend/server.py` (hard `os.environ[...]`, no default — raises `KeyError` if unset) and `backend/routes/analyzers.py` (soft `.get()`, defaults to empty string)
- `SUPABASE_SERVICE_ROLE_KEY` — used by `backend/routes/payments.py` and `backend/routes/stripe_webhook.py`

**Fix:** standardize on one name (`SUPABASE_SERVICE_ROLE_KEY` is the more descriptive/conventional Supabase name) across all four files, and update whatever `.env` / deployment platform env config currently sets the old name.

## 3. Two competing assessment-content architectures — one is dormant

**Live path (confirmed via code):** `mobile/utils/allAssessments.js` + `assessmentEngine.js` + siblings ship all 16 assessments' questions and scoring logic client-side, in the app bundle. Results write to `individual_assessments`/`couple_results`.

**Dormant path (confirmed unused via code search):** `supabase/assessment_seed.sql` (60K), `supabase/bond_questions_seed.sql` (48K), and `migrations/003_assessment_content_schema.sql` define `assessment_questions`, `assessment_dimensions`, `assessment_bands` tables — fully schema'd, apparently seeded, but **no code path in `backend/` or `mobile/` was found querying these tables.**

This isn't a bug exactly — it's an unresolved architectural fork. Two real possibilities:
(a) This was the intended future direction (server-driven content so assessments can be updated without an app-store release) and the migration to it never happened.
(b) It's leftover from an earlier build pass that got superseded by the simpler client-side approach and was never cleaned up.

**Recommendation:** decide which one is true before Claude Code adds a 17th assessment or touches scoring logic — extending the client-side system while a parallel server-driven one sits unused (with ~100K of seed SQL) is exactly the kind of drift that produced Sentient Self's two-schema exercise file. If (b), consider dropping the unused tables to reduce surface area for a future agent to get confused by.

## 4. Two independent Stripe webhook handlers

- `routes/payments.py`: `POST /api/webhook/stripe` (singular "webhook")
- `routes/stripe_webhook.py`: `POST /api/webhooks/stripe` (plural "webhooks")

These don't collide as routes, but only one can be the endpoint actually configured in your Stripe Dashboard. The other is dead code that looks alive. Additionally, `stripe_webhook.py`'s idempotency tracking (`EventTracker`, an in-memory dict) does not survive a process restart — if this backend is ever deployed to a serverless target (a `vercel.json` config exists for it), every invocation is a fresh process, and this idempotency mechanism does nothing at all.

**Fix:** (1) check the Stripe Dashboard to see which URL is actually configured, (2) delete the other handler entirely, (3) if the survivor needs real idempotency and might run serverless, move event-ID tracking into a Supabase table (a `webhook_events` table already exists in `payment_tables_schema.sql` — likely intended for exactly this, confirm and wire it up instead of the in-memory dict).

## 5. Table naming drift: `daily_checkins` vs `daily_check_ins`

`supabase/schema.sql` (older) defines `daily_checkins`. `supabase/bond_schema.sql` (current, larger) defines `daily_check_ins`. These are different table names for what appears to be the same feature area. Confirm which one the live database actually has, and drop/rename the other — don't let both exist with code split between them.

## 6. Migration folder doesn't reflect actual schema history

`migrations/` contains 002, 003, 004, 006 — **001 is missing** (likely `schema.sql`/`schema_phase2.sql` predate the numbering convention — fine, but should be renamed into the sequence for clarity) and **005 exists but sits outside the `migrations/` folder** (`005_learning_series_schema.sql` is at the `supabase/` root). Additionally, migration 002 created five analyzer tables (`communication_analysis`, `text_message_analysis`, `argument_analysis`, `voice_tone_analysis`, `emotional_pattern_analysis` — all singular) that **no code currently queries** — the live code uses a differently-named plural set (`communication_analyses`, etc., confirmed in `routes/analyzers.py`) that has no corresponding migration file at all, meaning it was likely created directly against the database (dashboard SQL editor, or a one-off script) and never captured as a migration.

**Fix:** (1) move `005_learning_series_schema.sql` into `migrations/`, renumber for a clean sequence, (2) write a migration that captures the actual plural-named analyzer tables as they exist in the live DB (using `bond_schema.sql` as the source of truth), (3) either drop the orphaned singular-named tables from migration 002 or write a follow-up migration that explicitly drops them — don't leave them silently unused in the live database.

## 7. Dead code: undefined `db` reference

`backend/server.py`'s `create_status_check` (`POST /api/status`) calls `db.status_checks.insert_one(doc)` — `db` is never defined anywhere in the file (only `supabase` is instantiated). This is leftover from the Emergent.sh scaffold template (evidenced by `emergentintegrations` in `requirements.txt` and the generic `/api/status` MongoDB-style endpoint pattern) and was never finished when the app moved to Supabase. Calling this endpoint will raise a `NameError` at runtime.

**Fix:** either delete this endpoint (it's not used by the mobile app, per this audit) or finish migrating it to Supabase (`await supabase.table('status_checks').insert(doc).execute()`).

## 8. Deployment guide sprawl

Five separate, fully-written deployment guides exist for the backend (Railway, Render, Fly, PythonAnywhere, Vercel), none marked canonical. This isn't a bug, but it's a real cost for whoever (human or agent) next needs to deploy — they have no signal for which one reflects what's actually running in production, if anything is.

**Fix:** pick one, delete the other four (or move them to an `/archive` folder if you want to keep them for reference), and state the canonical choice explicitly at the top of `README.md` (which currently just says "Here are your Instructions" — also worth fixing while you're there, since that's a scaffold placeholder that was never replaced).

## 9. Vestigial `frontend/` web app

`frontend/` (324K) contains only generic Create-React-App/shadcn scaffold — no Bond-specific screens, a 54-line `App.js`. This is not a maintained second client. Leaving it in the repo isn't harmful, but a coding agent given a vague instruction like "improve the web experience" could easily start building it out under the mistaken impression it's a real, partially-built client. Recommend either deleting it or adding a one-line note at its root confirming it's unmaintained scaffold.

---
**END OF AUDIT FINDINGS**
