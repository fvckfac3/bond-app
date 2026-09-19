# Bond — Experience & Access PRD

**Governed by:** 00 — Master Index

## 1. Purpose
Governs auth, onboarding, navigation, and screen hierarchy for the mobile app (the only real client — see 00 §2).

## 2. Authentication (as implemented)
`mobile/app/(auth)/`: `welcome.tsx`, `login.tsx`, `signup.tsx`. Backed by Supabase Auth (`@supabase/supabase-js` in mobile deps). Confirm exact provider set (email/password only, or OAuth too) against `mobile/services/` at implementation time — not conclusively determined in this audit pass.

## 3. Partner Pairing (distinct from generic onboarding)
Signup → couple linking via `pair_code` (see 01 §2) is a required early step for most features to be meaningful (assessments are more useful paired, though `individual_assessments` can exist solo pre-pairing). Confirm whether the app allows meaningful solo use pre-pairing or gates most tabs behind an active couple unit — this determines whether "invite your partner" is a soft prompt or a hard gate, and isn't settled by the schema alone.

## 4. Global Navigation (as implemented)

`mobile/app/(tabs)/`: **Dashboard, Assessments, Activities, Messages, Partner, Profile, Progress** (7 tabs — confirm actual tab-bar visible set against `_layout.tsx`, since not all files under `(tabs)/` are necessarily in the visible tab bar).

## 5. Screen Hierarchy (as implemented)

1. Welcome / Login / Signup
2. Dashboard (tab, likely default landing)
3. Assessments (tab) → Assessment detail (`assessment/[id].tsx`) → Results (`results/[assessmentId].tsx`)
4. Activities (tab) → Activity Complete (`activity-complete/[id].tsx`) — **flagged incomplete in DEPLOYMENT_ASSESSMENT.md** (placeholder navigation as of that doc's date; confirm current status before assuming it's finished)
5. Messages (tab)
6. Partner (tab) — pairing/partner-management screen
7. Progress (tab)
8. Profile (tab)
9. Subscription (`subscription/plans.tsx`, `success.tsx`, `cancel.tsx`)

## 6. Known Incomplete Items (as of last audited status doc — reverify against current code)
- Activity completion screen: placeholder navigation, not wired to actually mark completion
- Push notification token: generated but not persisted to the database (per `services/pushNotifications.js`), meaning targeted push notifications can't be sent even though local/scheduled daily reminders still work

## 7. Acceptance Criteria
- No feature assumes a completed couple pairing unless explicitly gated for that
- Tab navigation reflects actual visible tabs in `_layout.tsx`, not just files present in the directory
- Activity completion actually persists completion state before this is considered done (see 11 Audit Findings)

---
**END OF EXPERIENCE & ACCESS PRD**
