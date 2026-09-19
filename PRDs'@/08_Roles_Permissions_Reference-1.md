# Bond — Roles & Permissions Reference

**Governed by:** 00 — Master Index · Reference document

## 1. Roles (as implemented)

No admin/staff role exists anywhere in the schema — this is expected and correct for a consumer couples app with no institutional tier (unlike Sentient Self). The only "role" concept is implicit: `couple_units.user1_id` / `user2_id`, which is a slot assignment, not a permission tier. Both partners have identical capability.

## 2. Access Boundaries (RLS-enforced, per `bond_schema.sql`)

- A user can read/write their own `individual_assessments`
- A user can read `couple_results` only for a `couple_unit_id` they belong to
- Analyzer tables, Memory Lane, Bucket List, check-ins — all scoped to `couple_id`/`couple_unit_id`, readable only by the two members of that unit

## 3. Subscription/Billing Access

`subscriptions`, `payment_transactions`, `webhook_events` tables — billing appears to be tracked per-user (confirm whether a subscription covers one partner or the couple unit as a whole; this materially affects paywall UX — "your partner already has Premium, do you both get it?" is a real product question this audit didn't resolve).

## 4. Open Question (flag, not a drift)

If billing is per-user rather than per-couple, a couple where only one partner subscribes may hit inconsistent gating (one partner sees Premium features, the other doesn't, for a *shared* couple_unit resource like a paired assessment result). This needs a deliberate product decision — resolve it before Claude Code starts building anything paywall-adjacent, since the wrong assumption here creates a genuinely confusing couple experience.

---
**END OF ROLES & PERMISSIONS REFERENCE**
