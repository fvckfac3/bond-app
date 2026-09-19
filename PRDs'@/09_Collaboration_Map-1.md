# Bond — Collaboration Map

**Governed by:** 00 — Master Index · Auxiliary document

## 1. Dependency Graph (text form)

```
couple_units (pair_code redemption)
  → gates → paired features: couple_results, shared Memory Lane/Bucket List views
  → individual_assessments do NOT require an active couple_unit (solo use possible)

Assessment content (mobile/utils/allAssessments.js, client-side)
  → individual_assessments (per-user results)
  → when both partners complete same assessment_id → couple_results
  → couple_results + AI insight endpoint → ai_insights.py → narrative/recommendations

Communication/Text/Argument/Voice/Emotional analyzers
  → each independent, each own plural-named table
  → all read by /api/analyzers/history + /summary (aggregates across all 5)
  → HIGH sensitivity tier (03 Safety & Privacy §3) — any new analyzer must slot into this same tier, not a lighter one

Stripe billing
  → checkout (routes/payments.py) → Stripe → webhook (TWO possible handlers, 11 §4)
  → subscription status → gates Premium features (which specific features — not fully enumerated in this audit, confirm against mobile paywall gating code)

Supabase RLS
  → governs every couple-scoped and user-scoped table
  → new tables MUST ship RLS in the same migration (03 §6) — this is the single highest-leverage rule for whoever builds next, since drift here is invisible until a data leak surfaces it
```

## 2. Agent Ownership (summary — full detail in 10)

| Surface | Primary Agent | Secondary |
|---|---|---|
| Assessment content & scoring | Content | Frontend (mobile) |
| Couple linking, pairing flow | Backend | Auth |
| Analyzers (5x) | AI | Backend |
| Stripe billing + webhooks | Integration | Backend |
| Mobile screens, navigation, theme | Frontend | Experience |
| Supabase schema/RLS/migrations | Database | — |
| Sentry/PostHog instrumentation | DevOps | — |
| Test infra | QA | — |
| This PRD suite | Documentation | — |
| Analytics (progress tab, streaks) | Analytics | Frontend |

## 3. Handoff Risk Points

- **Assessment content ↔ Database:** the dormant `assessment_questions`/`assessment_dimensions`/`assessment_bands` schema (11 §3) is a trap for a future agent that assumes "the database has the content" without checking whether anything reads it. Content and Database agents must agree on which architecture is canonical before either touches it.
- **Stripe webhooks ↔ Integration:** whichever handler is NOT the one configured in the live Stripe dashboard is dead code that looks alive. Confirm in the Stripe dashboard directly, not by reading code alone, before assuming either path is canonical.
- **RLS ↔ every other agent:** any agent adding a table without looping in Database for RLS creates a silent data-exposure risk that won't show up in normal testing — it only shows up when someone queries cross-couple data and it works when it shouldn't.

---
**END OF COLLABORATION MAP**
