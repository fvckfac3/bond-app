-- 019: wire onboarding into the same server-side AI insight pipeline as every other assessment
-- (PRDs'@/03 §4, 05 §3; see migration 016 for the pattern this follows).
--
--   1. onboarding_assessments gains baseline_scores: a scored sweep across the relationship
--      domains covered by the expanded onboarding questionnaire (mobile/utils/onboardingAssessment.js),
--      shaped exactly like a regular assessment's `scores` column.
--   2. onboarding_individual_insights: a private AI insight on one person's onboarding baseline,
--      mirroring individual_insights but keyed to the onboarding row instead of a session.
--   3. onboarding_couple_insights: the shared AI insight once both partners finish onboarding,
--      mirroring relationship_summaries / couple_results.ai_* — one row per couple, backend-only.
--
-- Safe to re-run.

ALTER TABLE onboarding_assessments ADD COLUMN IF NOT EXISTS baseline_scores JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ============================================================
-- 1. ONBOARDING INDIVIDUAL INSIGHTS (private to the person who onboarded)
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_individual_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  onboarding_assessment_id UUID NOT NULL UNIQUE REFERENCES onboarding_assessments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
  content JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_individual_insights_user ON onboarding_individual_insights(user_id, created_at DESC);
ALTER TABLE onboarding_individual_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_onboarding_individual_insights_select ON onboarding_individual_insights;
CREATE POLICY p_onboarding_individual_insights_select ON onboarding_individual_insights
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
-- No insert/update/delete policies: only the backend (service role) writes insights.

-- ============================================================
-- 2. ONBOARDING COUPLE INSIGHTS (one per couple, readable by both partners)
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_couple_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_unit_id UUID NOT NULL UNIQUE REFERENCES couple_units(id) ON DELETE CASCADE,
  partner1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ai_status TEXT CHECK (ai_status IS NULL OR ai_status IN ('pending', 'ready', 'failed')),
  ai_insight JSONB,
  ai_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE onboarding_couple_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_onboarding_couple_insights_select ON onboarding_couple_insights;
CREATE POLICY p_onboarding_couple_insights_select ON onboarding_couple_insights
  FOR SELECT USING (is_couple_member(couple_unit_id));
-- No insert/update/delete policies: only the backend (service role) writes this row.

-- The onboarding questionnaire grew from 4 routing questions to a 20-question baseline sweep.
UPDATE assessments
SET estimated_time = '8-10 min', questions_count = 20
WHERE id = 'onboarding-assessment';

GRANT SELECT ON onboarding_individual_insights, onboarding_couple_insights TO authenticated;
GRANT ALL ON onboarding_individual_insights, onboarding_couple_insights TO service_role;
