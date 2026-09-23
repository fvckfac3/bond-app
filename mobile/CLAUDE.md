# CLAUDE.md

This file provides guidance to Claude Code when working within `mobile/`. See the root `CLAUDE.md` for repo-wide context.

## Stack

- Expo (~55), React Native 0.83, Expo Router (file-based routing under `app/`), TypeScript with `"strict": false` in `tsconfig.json` (non-default for Expo's base config — don't assume strict-mode guarantees).
- State: Zustand + TanStack Query. UI: react-native-paper, moti, react-native-reanimated, react-native-skia, echarts/chart-kit for data viz.
- Observability: Sentry (`services/sentry.js`, wired in `app/_layout.tsx`) and PostHog (`services/analytics.js`) are both genuinely wired, not just installed — keep them wired for any new screen, don't regress this.
- Talks to Supabase directly via `services/supabase.js` with the anon key (RLS-governed) for anything the backend doesn't need to do privately.

## Content model

Assessment content (16 modules: Gottman Method, EFT, Attachment Theory, NVC, Five Love Languages, Polyvagal Theory) and all scoring ship in-app — see `utils/allAssessments.js`, `assessmentEngine.js`, `coupleAssessment.js` (every assessment needs an entry in both `coupleRuleConfigByAssessment` and `assessmentActions`; `npm test` checks this).

Editorial content is read from Supabase, not bundled: the learning library through `services/learning.ts` (series list, series screen `app/learning/[seriesKey]/index.tsx`, lesson screen `app/learning/[seriesKey]/[moduleKey].tsx`, progress in `learning_series_progress`), and activities from the `activities` table ordered by `sort_order`. Content changes are SQL migrations, not app releases.

Assessment flow: on submit the app scores the answers (`assessmentEngine.js`), saves them to the session, and opens the individual result (`app/results/session/[sessionId].tsx`); the second partner to finish also creates the `couple_results` row (`coupleAssessment.js`) and asks the backend for the couple insight. AI never runs on the device — screens call the backend through `services/insights.ts` and render with `hooks/useInsight.ts` + `components/insights/InsightCard.tsx`. Analyzers live at `app/ai/`.

Couple-scoped screens get the signed-in user and active couple from `services/couple.ts` (`getCoupleContext`). The daily question is picked client-side by `utils/dailyQuestion.js` (same question for everyone on a calendar day, rotating through active questions by `sort_order`) — both partners must compute the same one, so keep it a pure function of the date.

## Commands

`npm start` / `npm run ios` / `npm run android` / `npm run web` / `npm run lint` (ESLint via `expo lint`, config in `eslint.config.js`) / `npm run type-check` / `npm test` (Node's built-in test runner over `utils/*.test.mjs`; `test/register.mjs` lets Node resolve the app's extensionless imports). There's no React component test runner — screens are verified by bundling and on-device.

## Env

`.env.example` lists `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_BACKEND_URL`, and optional `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_POSTHOG_API_KEY`/`_HOST`.
