# Bond — Technical Architecture PRD

**Governed by:** 00 — Master Index

## 1. Architectural Principles (Binding)
- Mobile (Expo/React Native) is the product. Backend (FastAPI) is a thin services layer for AI insights, analyzers, and payments — not a general API for CRUD the mobile client can't already do directly against Supabase.
- Supabase is the source of truth for data + auth + RLS; the FastAPI backend uses the **service-role** key for privileged operations only (AI generation, Stripe webhooks) — it should never be a second, looser path around RLS for anything the mobile client could do directly with its own (anon-key, RLS-governed) Supabase session.

## 2. Stack (as implemented)

| Layer | Built |
|---|---|
| Mobile | Expo (~55), React Native 0.83, Expo Router, TypeScript, Zustand, React Query, React Navigation |
| Mobile UI | react-native-paper, moti, react-native-reanimated, react-native-skia, echarts/chart-kit for data viz |
| Mobile observability | `@sentry/react-native` (initialized in `services/sentry.js`, wired in `app/_layout.tsx`), `posthog-react-native` (initialized in `services/analytics.js`) — both genuinely wired, not just installed |
| Backend | FastAPI, Python, `supabase-py` client |
| Backend AI | `emergentintegrations` package + `EMERGENT_LLM_KEY` (Emergent's LLM gateway — proxies to underlying model providers) |
| Payments | Stripe (`stripe` Python package + webhook handling) |
| Database | Supabase (Postgres + RLS + Auth) |
| Web (vestigial) | Create React App-derived scaffold in `frontend/` — no real screens, don't build against it (00 §2) |

## 3. Backend Route Map (as implemented)

| Prefix | File | Covers |
|---|---|---|
| `/api` (root) | `server.py` | Health check, legacy `/api/status` (dead — see 11 §7), `/api/generate-insights` |
| `/api/analyzers/*` | `routes/analyzers.py` | 5 analyzer types, full + quick-score endpoints, history/summary |
| `/api/features/*` | `routes/features.py` | Memory Lane, Bucket List CRUD |
| `/api` (payments) | `routes/payments.py` | Checkout, customer portal, subscription status, packages, **and its own `/webhook/stripe`** |
| `/api/webhooks/*` | `routes/stripe_webhook.py` | **A second, independent** Stripe webhook handler at `/webhooks/stripe` |

See 11 Audit Findings §4 for why the two webhook handlers are a problem, not a redundancy feature.

## 4. Environment Variables (as implemented — inconsistent, see 11 §2)

| Variable | Used by |
|---|---|
| `SUPABASE_URL` | all backend files |
| `SUPABASE_SERVICE_KEY` | `server.py`, `routes/analyzers.py` |
| `SUPABASE_SERVICE_ROLE_KEY` | `routes/payments.py`, `routes/stripe_webhook.py` |
| `EMERGENT_LLM_KEY` | `services/ai_insights.py` |
| `STRIPE_API_KEY` | `routes/payments.py`, `routes/stripe_webhook.py` |
| `STRIPE_WEBHOOK_SECRET` | `routes/stripe_webhook.py` |
| `CORS_ORIGINS` | `server.py` |

**`SUPABASE_SERVICE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are two different names for what should be the same secret.** Whichever one isn't set in the actual deployment environment will cause a hard crash (`server.py` uses `os.environ['SUPABASE_SERVICE_KEY']` — bracket access, no default, raises `KeyError` on missing).

## 5. Database (see 01 Core Systems, 11 Audit Findings for the full drift picture)

Canonical current schema is `supabase/bond_schema.sql` (728 lines, ~40 tables) — treat this file, not the numbered `migrations/` folder, as ground truth for "what tables currently exist," since the migrations folder is incomplete (missing 001, missing 005 which sits outside the folder) and contains at least one migration (002) whose tables are now orphaned. See 11 §6 for the recommended fix to migration hygiene going forward.

## 6. Deployment

Multiple deploy guides exist for the backend (Railway, Render, Fly, PythonAnywhere, Vercel — 5 separate guides) with no single one marked canonical. **Pick one and delete the other four guides** — maintaining five deployment paths for one FastAPI service is pure drift risk; the next person (or agent) to touch deployment will not know which is current. See 11 §8.

## 7. Security

RLS extensively implemented (03 §6). CORS currently defaults to `*` unless `CORS_ORIGINS` env var is set (per `server.py`) — confirm this is actually restricted in whatever production environment is live; the DEPLOYMENT_ASSESSMENT.md flagged this as open and nothing in this audit confirms it was closed.

## 8. Acceptance Criteria
- Backend never becomes a second unrestricted data-access path around Supabase RLS
- Single canonical Stripe webhook handler, single canonical deploy target, single canonical service-role env var name
- Sentry/PostHog remain wired for every new mobile screen (they already are for existing ones — don't regress this)

---
**END OF TECHNICAL ARCHITECTURE PRD**
