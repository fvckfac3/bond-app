# Bond for Clinicians (`clinician-web/`)

Next.js 14 (App Router) dashboard for clinics using Bond with couples. Standalone: own `package.json`, no workspace link to `mobile/` or `backend/`. The data layer is `supabase/migrations/021_institutional_clinician_schema.sql`, mirrored at the end of `supabase/bond_schema.sql`.

Built to support HIPAA technical safeguards. **HIPAA compliance is not established** (see `LICENSE-POLICY.md` §6).

## What a clinician can see

- A couple only after **both partners consent** (`clinic_couples.status = 'active'`). Either partner can withdraw (`revoke_clinic_consent`), which ends access at once.
- Only clinic **admins** and the couple's **primary clinician** (the one who invited them) can open a couple.
- Reflections the author marked `shared_with_clinician`. `private_reflections` are author-only under RLS, with no exception.
- Counts since consent: exercise completions by week and category, daily check-ins, mean check-in connection rating, daily-question answers. No check-in notes, answers or other free text. Clinicians can't read `activity_completions`, `daily_check_ins` or `users` directly; the SECURITY DEFINER functions in 021 return aggregates only.

## Audit trail

`lib/audit.ts` → `logAuditEvent()` writes `audit_logs` with the service-role client (`lib/supabase/admin.ts`, the only place the service key is used). Writes happen **before** protected data is read, and a failed write throws, so the page doesn't render. Recorded actions: `VIEWED_DASHBOARD`, `VIEWED_COUPLE_RECORDS`, `VIEWED_SHARED_REFLECTIONS`, `INVITED_COUPLE`, `SEAT_LIMIT_BLOCKED`. The actor comes from the verified session. `audit_logs` is append-only: no UPDATE, DELETE or TRUNCATE for any API role, and a trigger rejects them even for the table owner. Only clinic admins can read it.

## Seats

`lib/institutional.ts` holds the tier schedule (`TIERS`), `seatLimitFor`, `monthlyPriceFor` and `checkActiveSeats(clinicId)`. An active seat is a link with status `active` and activity in the last 30 days. The count comes only from SQL `clinic_active_seat_count`. The real guard is the `clinic_couples_seat_limit` trigger, which locks the clinic row and rejects activation past `base_seat_limit + extra_seats`. Invites are pre-checked. A couple that consents when no seat is free stays `pending`. A dormant couple whose activity resumes can take the count over the limit; it is never blocked from using Bond.

## Invitations

A clinician enters one partner's Bond email. The app makes a 256-bit token and stores only its sha256 (`create_clinic_invitation`), then shows the code once. The partner redeems it with `accept_clinic_invitation(token)`, which records their consent. The other partner then calls `record_clinic_consent`. **The mobile screens for these steps don't exist yet**, so until they ship no real couple can become active. Email delivery is not built.

## Setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

There's no self-serve signup. Bond staff create the `clinics` and `clinicians` rows with the service role. A clinician signs in with their Bond (Supabase Auth) email and password.

## Checks

```bash
npm run type-check
npm run lint
npm test            # vitest: pricing, seat math, token hashing, IP parsing
npm run build
../supabase/tests/run_institutional_tests.sh   # needs a disposable local Postgres 15 (PGHOST/PGPORT/PGUSER)
```

## Not built yet

Mobile UI for writing reflections, choosing their share status, and accepting or withdrawing a clinic invite. Also not built: institutional Stripe billing (separate from consumer Premium), invite email delivery, private-reflection key management, admin tools (reassigning a primary clinician, archiving, adding clinicians) and clinician notes.
