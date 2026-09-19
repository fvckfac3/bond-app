# Bond — Content & Copy PRD

**Governed by:** 00 — Master Index

## 1. Purpose
Governs the 16-assessment content model, therapeutic framework sourcing/citation, learning series content, and tone rules for a product that discusses real relationship conflict.

## 2. The 16 Assessments (source: `mobile/utils/allAssessments.js` + siblings)

Frameworks cited across the library (per repo memory + confirmed in code): Gottman Method (Four Horsemen), Emotionally Focused Therapy (EFT), Attachment Theory (Bowlby & Ainsworth), Nonviolent Communication (Rosenberg), Five Love Languages (Gary Chapman), Polyvagal Theory. Each assessment object carries its own `framework` citation string — **rule: never ship an assessment without one.** This is the credibility backbone of a "science-backed" positioning; an uncited assessment reads as generic personality-quiz content, not a therapeutic tool.

## 3. Tone Rules (binding, new — inferred from AI insight output shape)

- Narrative insights describe patterns, not verdicts ("here's a pattern we noticed" not "here's what's wrong with you")
- Growth recommendations are addressed to the couple, not to "the partner who needs to change"
- Strength affirmations are mandatory alongside growth areas in every insight generation call (confirmed in `ai_insights.py`'s output shape) — don't let a future edit drop this in favor of an all-critique output

## 4. Learning Series Content

`mobile/content/series/`: `relationshipFoundations.js`, `repairAndCommunication.ts`, `seriesContent.ts`, `learningLibrary.ts`. Same client-side-content pattern as the assessments — see 11 Audit Findings §3 for the architectural question this raises (client-shipped content vs. server-driven content, and why a large parallel Supabase schema for this exists but isn't used).

## 5. Legal & Disclosure Copy

`legal/PRIVACY_POLICY.md`, `legal/TERMS_OF_SERVICE.md` exist. Given 03 Safety & Privacy §8 (account deletion behavior unverified), audit these two documents specifically for any deletion-timeline claim and confirm it matches actual backend behavior before treating it as accurate — a privacy policy overstating what the product actually does is a real liability, not just a documentation nit.

## 6. Subscription/Paywall Copy

Tier-gating and upgrade prompts should avoid urgency/scarcity framing for the same reason as any relationship-wellness product — a couple already navigating stress doesn't need manufactured urgency layered on top. Apply the same standard used in the Sentient Self suite's Content & Copy PRD if useful as a reference point.

## 7. Acceptance Criteria
- Every assessment has a non-empty, accurate `framework` citation
- AI-generated insights always include at least one strength affirmation alongside growth areas
- No paywall/upgrade copy uses urgency or scarcity language

---
**END OF CONTENT & COPY PRD**
