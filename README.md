<div align="center">

  <img src="./assets/bond-logo.png" alt="Bond Logo" width="400"/>

  # Bond

  ### **STRENGTHEN YOUR RELATIONSHIP**

  *AI-powered assessments, insights, and shared activities designed for couples.*

  [How it Works](#) • [Features](#) • [Learning Library](#) • [Pricing](#)

  ---

</div>


Bond is a relationship-wellness app for couples.

## Repo layout

- `mobile/` — Expo/React Native app. This is the product; every real user-facing screen lives here. See `mobile/CLAUDE.md`.
- `backend/` — FastAPI thin services layer (AI insights, the four text analyzers, Stripe billing). Not a general CRUD API — the mobile app talks to Supabase directly for everything else.
- `frontend/` — Create React App scaffold. Vestigial; has no Bond-specific screens. See `frontend/README.md`.
- `supabase/` — Postgres schema, migrations, seeds. `supabase/bond_schema.sql` is the canonical source of truth for current tables (not the `migrations/` folder, which is incomplete).

Full product/architecture requirements live in `PRDs'@/` — read `PRDs'@/00_Master_Index-1.md` first. See the repo-root `CLAUDE.md` for the full set of binding project rules.

## Running each component

### Mobile (`mobile/`)

```bash
cd mobile
npm install
npm start          # Expo dev server
npm run ios        # or npm run android / npm run web
npm run lint
npm run type-check
npm test
```

### Backend (`backend/`)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in Supabase, Anthropic, and Stripe credentials
uvicorn server:app --reload
make check          # black + isort + flake8 + mypy
make test            # pytest
```

## Deployment

The backend deploys to **Render** — see `DEPLOY_RENDER_GUIDE.md` and the `render.yaml` Blueprint at the repo root. Other deployment guides (Fly, Railway, PythonAnywhere, Vercel) are kept for reference under `archive/deployment-guides/` but are not the deployment path in use.
