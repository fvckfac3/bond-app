# Bond — Core Systems PRD

**Governed by:** 00 — Master Index

## 1. Systems Covered

1. Couple Linking & Identity
2. Assessment Engine (16 modules)
3. Daily Check-Ins & Streaks
4. Communication/Text/Argument/Voice/Emotional Analyzers
5. Memory Lane & Bucket List
6. Learning Series
7. AI Insight Generation

## 2. System 1: Couple Linking & Identity

### 2.1 Data Model (as implemented)
`couple_units`: `user1_id`, `user2_id` (nullable until partner joins), `pair_code` (unique, used for partner invite), `status` (`pending`/`active`/`inactive`).

**Rules:**
- A couple unit exists in `pending` status with only `user1_id` set until the invited partner redeems the `pair_code`
- No implicit hierarchy between user1/user2 — see Core Product Principle 3
- Nearly every downstream table (`couple_results`, `daily_check_ins`, analyzer tables, `memory_lane`, `bucket_list`) scopes by `couple_unit_id` — a feature that only makes sense per-individual (e.g. `individual_assessments`) is the exception, not the norm

## 3. System 2: Assessment Engine

### 3.1 The 16 Assessments (as implemented, `mobile/utils/allAssessments.js`)
Each assessment: `id`, `name`, `framework` (cited source, e.g. "Five Love Languages (Gary Chapman)", "Gottman Method", "Nonviolent Communication (Rosenberg)"), `description`, `estimatedTime`, `questionsCount`, `category`, intro/result copy.

**Rule (binding):** every assessment must cite its framework source in the `framework` field — this is a credibility feature for a science-backed positioning, not decoration. Don't add an assessment without one.

### 3.2 Execution Flow (as implemented)
`mobile/utils/assessmentEngine.js` imports question banks and scoring from `allAssessments.js` and runs entirely client-side. Individual results write to `individual_assessments` (`user_id`, `assessment_id`, `answers` JSONB, `score`, `profile` JSONB, `completed`). When both partners complete the same assessment, a `couple_results` row is created (`couple_unit_id`, `assessment_id`, both partner IDs) — this is where paired comparison/insight generation happens.

**Critical architectural note:** this client-side execution model is one of two competing assessment architectures found in this codebase — see 11 Audit Findings §3 before extending this system. Don't assume the Supabase `assessment_questions`/`assessment_dimensions`/`assessment_bands` tables are involved; they currently aren't.

### 3.3 Onboarding Assessment (separate subsystem)
`onboarding_assessments`, `onboarding_assessment_recommendation_rules`, `onboarding_assessment_patterns`, `onboarding_assessment_dimensions` (migration 006) — a distinct, smaller assessment run at signup to drive initial recommendations. Confirm at implementation time whether this one *is* server-driven (its own migration file suggests more deliberate DB design than the main 16) before assuming it follows the client-side pattern above.

## 4. System 3: Daily Check-Ins & Streaks

`daily_check_ins` (note: underscored — see 11 §5 for a naming mismatch with an older `daily_checkins` table in `schema.sql`), `daily_questions`, `daily_question_responses`, `check_in_topics`, `check_in_responses`. A `streaks` table exists in the older `schema.sql` only — confirm whether streak tracking migrated into `bond_schema.sql` under a different name or was dropped; don't assume it's live without checking the actual DB.

## 5. System 4: Communication/Text/Argument/Voice/Emotional Analyzers

### 5.1 Purpose
Five independent analyzers (`backend/services/`: `communication_analyzer.py`, `text_analyzer.py`, `argument_analyzer.py`, `voice_tone_analyzer.py`, `emotional_pattern_analyzer.py`), each with a full-analysis endpoint and a quick-score endpoint under `/api/analyzers/*`.

### 5.2 Data Contracts
Each analyzer writes to its own plural-named table (`communication_analyses`, `text_analyses`, `argument_analyses`, `voice_tone_analyses`, `emotional_pattern_analyses`), all scoped by `couple_id`. History and summary endpoints (`/api/analyzers/history/{couple_id}`, `/api/analyzers/summary/{couple_id}`) read across all five.

**Rule (binding, from Core Product Principle 5):** this is a couple's real conflict/communication content flowing through an LLM. Whatever the Safety & Privacy PRD (03) says about data minimization and retention applies here with zero exceptions — this is the most sensitive data surface in the app, more so than assessment answers.

## 6. System 5: Memory Lane & Bucket List

CRUD features (`memory_lane`, `bucket_list`), couple-scoped, under `/api/features/*`. Memory Lane has a timeline view (`/memory-lane/{couple_id}/timeline`); Bucket List has a stats view (`/bucket-list/{couple_id}/stats`). Straightforward, no notable drift found.

## 7. System 6: Learning Series

`learning_series`, `learning_series_modules`, `learning_series_progress` (schema in the misplaced `005_learning_series_schema.sql` — see 11 §6). Content lives in `mobile/content/series/` (`relationshipFoundations.js`, `repairAndCommunication.ts`, `seriesContent.ts`, `learningLibrary.ts`) — same client-side-content pattern as the main assessments (§3.3 architectural note applies here too).

## 8. System 7: AI Insight Generation

`backend/services/ai_insights.py`, called via `POST /api/generate-insights` with both partners' assessment scores. Uses `EMERGENT_LLM_KEY` (Emergent's LLM gateway — see 11 §1 for the exposure issue with this specific credential) to generate: narrative, growth recommendations, strength affirmation, communication scripts, framework tags. On failure, returns a graceful fallback message rather than a raw error — good existing behavior, preserve it.

## 9. Cross-System Rules

- No couple-scoped write without a valid, active `couple_unit_id`
- Individual assessment results are visible to the completing user only until the partner also completes the same assessment (paired-comparison gate) — confirm this gate is enforced server-side, not just by the mobile UI not showing a "compare" button
- Analyzer content should never be summarized or excerpted back to a user in a way that quotes their partner's exact words without the partner's awareness this is happening — a fairness/trust issue, not just a technical one

---
**END OF CORE SYSTEMS PRD**
