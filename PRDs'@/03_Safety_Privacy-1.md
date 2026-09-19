# Bond — Safety & Privacy PRD

**Status:** Overrides all other PRDs where applicable
**Governed by:** 00 — Master Index

## 1. Purpose
Bond isn't a clinical or crisis-response product like a therapy app, but it processes a couple's real conflict content (via the five analyzers, 01 §5) and deeply personal relational data (attachment style, love languages, argument patterns). That data can reveal or intersect with abuse dynamics even though the product isn't designed to detect abuse. This PRD sets the bar accordingly.

## 2. Design Assumptions (Binding)
- A meaningful fraction of users will be in relationships with active conflict, not just proactive growth-seekers
- Analyzer input (real messages, voice recordings, argument transcripts) may contain content one partner wouldn't want the other to see verbatim, even if both consented to using the analyzer
- Neither partner should be able to use Bond's own tools (analyzers, AI insights) as a weapon in an argument ("the app said you're the problem")

## 3. Data Sensitivity Tiers (new — not previously documented anywhere in the repo)

| Tier | Examples | Handling |
|---|---|---|
| High | Raw analyzer input (message text, voice audio, argument transcripts) | Minimum retention necessary for the analysis + immediate history record; never surfaced verbatim to the *other* partner without the authoring partner's awareness |
| Medium | Assessment answers, scores, profiles | Couple-scoped, RLS-protected, not shared outside the couple unit |
| Standard | Memory Lane entries, Bucket List, check-in responses | Couple-scoped, lower sensitivity, still private to the couple unit |

## 4. AI Role Boundaries

The AI insight generator (`ai_insights.py`) must never: declare a "winner" of a disagreement, diagnose either partner with a clinical condition, suggest the relationship should end, or generate content that reads as if it's taking one partner's side against the other. Its role is narrative synthesis and growth suggestion — consistent with how it's currently built (returns `narrative`, `growth_recommendations`, `strength_affirmation`, `communication_scripts` — no "fault" or "score comparison" field exists, which is correct and should stay that way).

## 5. Analyzer-Specific Rules (binding, new)

- Voice tone analysis: audio should not be retained longer than needed to produce the analysis result unless the user explicitly opts into storing recordings — confirm current retention behavior in `voice_tone_analyzer.py` against this rule, since it wasn't explicitly documented as a retention policy anywhere in the audited files
- Argument/communication analyzers: when a summary is shown, it should characterize patterns ("more interruptions from Partner A in this exchange"), not reproduce a partner's message verbatim to the other partner without that partner knowing their words are being shared this way

## 6. Couple-Scoped Data Boundaries (RLS)

`bond_schema.sql` implements RLS extensively (78 policy/enable statements confirmed in this audit) — this is a genuine strength of the current build, not a gap. The binding rule going forward: **any new table storing couple- or user-scoped data must ship with RLS policies in the same migration that creates it.** Given the schema drift already found (11 Audit Findings), a table created without RLS is easy to miss until it's already in production.

## 7. Third-Party Data Exposure

Given the exposed `EMERGENT_LLM_KEY` (11 §1), assume analyzer/insight content sent to the Emergent LLM gateway in the recent past should be treated as having gone through a channel with a compromised credential — this doesn't mean the LLM provider itself was breached, but it means the access-control assumption ("only our backend can call this key") was false for as long as the key sat exposed. Rotating the key closes this going forward; it doesn't retroactively un-expose anything already sent.

## 8. Account & Data Deletion

Not conclusively found in this audit — no explicit account-deletion endpoint or cascade-delete confirmation was located in `backend/routes/`. **Treat this as an open requirement, not a confirmed gap or a confirmed feature** — verify against the actual Supabase Auth user-deletion flow and whether it cascades to `couple_units`, `individual_assessments`, `couple_results`, and all five analyzer tables before shipping any privacy-policy claim about deletion.

## 9. Acceptance Criteria
- No analyzer output surfaces a partner's raw input to the other partner without their knowledge
- AI insights never assign blame or suggest relationship dissolution
- Every new table ships with RLS in the same migration
- Account deletion behavior is verified end-to-end before the Privacy Policy's deletion claims (see `legal/PRIVACY_POLICY.md`) are treated as accurate

---
**END OF SAFETY & PRIVACY PRD**
