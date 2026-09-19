# Bond — Error & State Reference

**Governed by:** 00 — Master Index · Reference document

## 1. Couple Unit States
`pending` → `active` (partner redeems `pair_code`) → `inactive` (unpairing/deactivation — trigger condition not confirmed in this audit; verify against actual unpair flow if one exists).

## 2. Assessment States
Per `individual_assessments`: `completed` boolean (no richer in-progress state persisted server-side — confirm whether partial/in-progress answers are saved incrementally or only on full completion; the schema's single `completed` boolean suggests the latter, which means a user closing the app mid-assessment may lose progress).

## 3. Subscription States (Stripe-driven, via `routes/payments.py` + `routes/stripe_webhook.py`)
Standard Stripe lifecycle: checkout → active → past_due/canceled, mapped via `_map_stripe_status` in `stripe_webhook.py`. **Caveat:** this mapping only reliably fires if the correct webhook endpoint is the one actually configured in the Stripe dashboard — see 11 §4.

## 4. Stripe Webhook Idempotency (as implemented — fragile)

`routes/stripe_webhook.py` uses an in-memory `EventTracker` dict keyed by Stripe event ID, with a 24-hour logical TTL, to avoid double-processing. **This state does not survive a process restart.** If deployed to any serverless/ephemeral target (Vercel functions, for instance — `backend/vercel.json` exists as a deploy option), every invocation is a fresh process and this in-memory tracker provides zero actual idempotency protection. If deployed to a long-running server (Railway/Render/Fly), it works until the next deploy or restart, then resets. See 11 §4 for the fix.

## 5. HTTP Error Taxonomy
Analyzer endpoints: `503` when the analyzer service isn't available (explicit check via `analyzers_available` flag), `500` on unexpected failure. Payments endpoints: standard 4xx for user errors. No universal error-shape convention confirmed across all route files — worth standardizing if this becomes an agent-driven codebase (inconsistent error shapes make it harder for an AI agent to write generic error-handling client code).

## 6. Known Gaps (not drift — genuinely unspecified)
- Account/couple-unit deletion cascade behavior (see 03 §8)
- Whether assessment progress is saved incrementally or only on completion
- Exact trigger for `couple_units.status = 'inactive'`

---
**END OF ERROR & STATE REFERENCE**
