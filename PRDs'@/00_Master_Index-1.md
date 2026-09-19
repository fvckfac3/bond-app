# Bond — Master PRD Index

**Status:** Authoritative · Regenerated from live codebase audit (fvckfac3/bond-app)
**Audit basis:** repo structure, backend/server.py + routes + services, mobile/app + utils + constants, supabase/*.sql (7 schema files + 4 numbered migrations + 1 unnumbered), package.json/requirements.txt, DEPLOYMENT_ASSESSMENT.md — as of repo state Sep 2026 snapshot
**Purpose statement for Claude Code:** this suite is written to be pointed at directly by an autonomous coding agent. Section 7 (Instructions to AI Coding Agents) and document 11 (Audit Findings) are the two most load-bearing sections — read those before touching code.

## 1. Purpose

Single entry point for all Bond PRDs. No functional requirements live here — only structure, ownership, precedence, and the state of the actual codebase versus what it should be.

## 2. Product Overview

**Name:** Bond
**Description:** Relationship wellness app for couples — science-backed assessments (16 modules across Gottman Method, EFT, Attachment Theory, NVC, Five Love Languages, Polyvagal Theory), AI-generated relationship insights, daily check-ins, communication analyzers, shared memory/goals tools, and a structured learning series.

**Primary client:** mobile (Expo/React Native) — this is where 100% of real product surface lives.
**Non-primary:** a `frontend/` React web app exists in the repo but contains only generic scaffold (shadcn/ui components, no Bond-specific screens) — treat it as vestigial unless you're deliberately reviving a web client. Don't build against it assuming it's a real second client.

## 3. Target Audience (Canonical)

Couples (two-partner units) seeking to strengthen or repair their relationship — ranges from proactively growth-oriented couples to those navigating active conflict. Content and AI tone must work for both ends of that range without assuming either.

## 4. Core Product Principles (Binding — inferred from build evidence, make explicit here since no source PRD stated them)

1. **Couple-scoped by default** — nearly every data table is scoped to a `couple_unit_id`, not just a `user_id`. Any new feature must ask "does this belong to one partner or the pair?" before modeling it.
2. **Assessment content ships in the app, not the database** — see 05 Content & Copy and 11 Audit Findings for why this matters architecturally.
3. **Symmetric partners, no hierarchy** — `couple_units` has `user1_id`/`user2_id` with no role distinction. Don't introduce an implicit "primary partner" anywhere without a deliberate decision.
4. **AI insight, not AI arbitration** — the AI insight generator (backend `ai_insights.py`) narrates and suggests; nothing in the build has it taking sides or scoring "who's right." Preserve this.
5. **Sensitive-by-nature data** — communication/argument/voice-tone analyzers process a couple's real conflict content. Treat this at the same privacy bar as health data even though it isn't clinically regulated.

## 5. Document Suite

### Base Documents
| Doc | Governs |
|---|---|
| 01 — Core Systems | Assessment engine, couple linking, daily check-ins, communication analyzers, memory lane/bucket list, learning series, streaks |
| 02 — Experience & Access | Auth, onboarding, tab navigation, screen hierarchy |
| 03 — Safety & Privacy | Sensitive-data handling for conflict/communication content, AI role boundaries, couple-scoped RLS |
| 04 — Technical Architecture | Stack (FastAPI + Supabase + Expo/React Native), API contracts, billing, deployment |
| 05 — Content & Copy | 16-assessment content model, therapeutic framework sourcing, learning series content |

### Reference Documents
| Doc | Governs |
|---|---|
| 06 — Error & State Reference | Assessment flow states, webhook idempotency, error taxonomy |
| 07 — Design System Reference | Color/spacing tokens, component inventory |
| 08 — Roles & Permissions Reference | Couple-unit membership model, RLS boundaries |

### Auxiliary
| Doc | Governs |
|---|---|
| 09 — Collaboration Map | Cross-system dependencies, agent ownership |

### Agent & Audit Documents
| Doc | Governs |
|---|---|
| 10 — Agent PRD Addenda | Build-specific requirements for the 13 activated domain agents |
| 11 — Audit Findings & Required Fixes | Concrete bugs and architectural forks found in this audit — read before writing code |

## 6. Precedence Rules

1. Safety & Privacy PRD overrides all
2. 11 — Audit Findings overrides silence in any other doc (if a doc doesn't mention a known issue, 11 still applies)
3. Core Systems PRD overrides Experience & Access PRD
4. Experience & Access PRD overrides Technical Architecture PRD

## 7. Instructions to AI Coding Agents (Binding — read before any commit)

- **Do not add features to `frontend/`.** It's scaffold, not a maintained client. If web is wanted later, that's a scoping decision for a human, not an inference to make from this suite.
- **Do not query or write to the singular-named analyzer tables** (`communication_analysis`, `text_message_analysis`, `argument_analysis`, `voice_tone_analysis`, `emotional_pattern_analysis`) — these are orphaned from `migrations/002_add_missing_features.sql` and unused. Live code uses the plural-named set (`communication_analyses`, etc. — see 11 §2).
- **Do not assume `assessment_questions`/`assessment_dimensions`/`assessment_bands` (Supabase tables) are the assessment content source.** They are not currently read by any code path. The live source is `mobile/utils/allAssessments.js` and sibling files. See 11 §3 before deciding which to extend.
- **Do not hardcode any API key, even as a "temporary" placeholder, in a markdown file.** This repo already has one live exposure — see 11 §1. Use `.env.example` with placeholder values only.
- **Before touching Stripe webhook logic, read 11 §4** — there are two independent handlers at different paths and only one should be treated as canonical.
- Where this suite documents something as broken (11) rather than as intended behavior (01–05), fixing it is in scope; silently working around it and leaving the bug in place is not.

---
**END OF MASTER INDEX**
