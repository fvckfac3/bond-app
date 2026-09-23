-- 011: content architecture (hybrid).
--
-- Decision (resolves PRD 11 §3 / 10 "Content"): assessments and their scoring live in the
-- app (mobile/utils/allAssessments.js, assessmentEngine.js, coupleAssessment.js). Editorial
-- content that grows over time lives here: learning series, activities, daily questions,
-- check-in topics, and monthly deep-dive themes.
--
--   1. Drop the unused, divergent database copies of assessment content and scoring rules.
--      Nothing reads them; the app is the single source. `assessments` stays as a thin
--      registry because onboarding_assessments references it.
--   2. Give content tables the fields the app renders, a stable key for re-runnable seeds,
--      and a review_status so draft content can be tracked until it is approved.
--   3. Couple-scoped progress for daily questions, check-in topics, and deep dives, with RLS
--      in this same migration (PRD 03 §6).
--
-- Safe to re-run.

-- ============================================================
-- 1. DROP UNUSED ASSESSMENT-CONTENT COPIES
-- ============================================================
DROP TABLE IF EXISTS
  assessment_couple_pattern_rules,
  couple_relationship_patterns,
  assessment_couple_dimension_rules,
  assessment_couple_rules,
  assessment_questions,
  assessment_dimensions,
  assessment_bands,
  onboarding_assessment_recommendation_rules,
  onboarding_assessment_patterns,
  onboarding_assessment_dimensions;

-- ============================================================
-- 2. EDITORIAL CONTENT
-- ============================================================

-- Learning modules carry their full lesson (same shape the app renders:
-- content = { introduction, sections[{ title, body, research?, example?, tip? }], conclusion }).
ALTER TABLE learning_series ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE learning_series_modules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE learning_series_modules ADD COLUMN IF NOT EXISTS content JSONB;
ALTER TABLE learning_series_modules ADD COLUMN IF NOT EXISTS key_takeaways JSONB NOT NULL DEFAULT '[]';
ALTER TABLE learning_series_modules ADD COLUMN IF NOT EXISTS exercises JSONB NOT NULL DEFAULT '[]';
ALTER TABLE learning_series_modules ADD COLUMN IF NOT EXISTS reflection JSONB;
ALTER TABLE learning_series_modules ADD COLUMN IF NOT EXISTS frameworks TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE learning_series_modules ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'draft';

ALTER TABLE activities ADD COLUMN IF NOT EXISTS activity_key TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS framework TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 100;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'draft';
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_key ON activities(activity_key);

ALTER TABLE daily_questions ADD COLUMN IF NOT EXISTS depth TEXT NOT NULL DEFAULT 'light';
ALTER TABLE daily_questions ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE daily_questions ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'draft';
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_questions_question ON daily_questions(question);

ALTER TABLE check_in_topics ADD COLUMN IF NOT EXISTS topic_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_check_in_topics_key ON check_in_topics(topic_key);
ALTER TABLE check_in_topics ADD COLUMN IF NOT EXISTS depth_level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE check_in_topics ADD COLUMN IF NOT EXISTS framework TEXT;
ALTER TABLE check_in_topics ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 100;
ALTER TABLE check_in_topics ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'draft';

CREATE TABLE IF NOT EXISTS deep_dive_themes (
  theme_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  framework TEXT,
  focus_questions JSONB NOT NULL DEFAULT '[]',
  weekly_activities JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 100,
  review_status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE deep_dive_themes ENABLE ROW LEVEL SECURITY;

-- Content is readable by signed-in users (catalog tables already had public read policies).
DROP POLICY IF EXISTS p_daily_questions_read ON daily_questions;
CREATE POLICY p_daily_questions_read ON daily_questions FOR SELECT USING ((SELECT auth.role()) = 'authenticated');
DROP POLICY IF EXISTS p_deep_dive_themes_read ON deep_dive_themes;
CREATE POLICY p_deep_dive_themes_read ON deep_dive_themes FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 3. COUPLE-SCOPED PROGRESS
-- ============================================================

-- Daily questions: both partners answer the same question each day. A partner's answer
-- becomes visible only once you've answered that question yourself (enforced here, not in the UI).
ALTER TABLE daily_question_responses ADD COLUMN IF NOT EXISTS couple_unit_id UUID REFERENCES couple_units(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_daily_question_responses_couple ON daily_question_responses(couple_unit_id, response_date);

CREATE OR REPLACE FUNCTION has_answered_daily_question(q_id UUID, day DATE)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM daily_question_responses r
    WHERE r.user_id = (SELECT auth.uid()) AND r.question_id = q_id AND r.response_date = day
  )
$$;
REVOKE ALL ON FUNCTION has_answered_daily_question(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION has_answered_daily_question(UUID, DATE) TO authenticated;

ALTER TABLE daily_question_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_daily_question_responses_select ON daily_question_responses;
CREATE POLICY p_daily_question_responses_select ON daily_question_responses FOR SELECT USING (
  (SELECT auth.uid()) = user_id
  OR (
    couple_unit_id IS NOT NULL
    AND is_couple_member(couple_unit_id)
    AND has_answered_daily_question(question_id, response_date)
  )
);
DROP POLICY IF EXISTS p_daily_question_responses_insert ON daily_question_responses;
CREATE POLICY p_daily_question_responses_insert ON daily_question_responses FOR INSERT WITH CHECK (
  (SELECT auth.uid()) = user_id AND (couple_unit_id IS NULL OR is_couple_member(couple_unit_id))
);
DROP POLICY IF EXISTS p_daily_question_responses_update ON daily_question_responses;
CREATE POLICY p_daily_question_responses_update ON daily_question_responses FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id AND (couple_unit_id IS NULL OR is_couple_member(couple_unit_id)));

-- Check-in topics: responses are shared with the couple.
ALTER TABLE check_in_responses ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_check_in_responses_couple ON check_in_responses(couple_unit_id, created_at DESC);
DROP POLICY IF EXISTS p_check_in_responses_select ON check_in_responses;
CREATE POLICY p_check_in_responses_select ON check_in_responses
  FOR SELECT USING (is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_check_in_responses_insert ON check_in_responses;
CREATE POLICY p_check_in_responses_insert ON check_in_responses
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id AND is_couple_member(couple_unit_id));

-- Learning progress: partners see each other's progress; a row can only be attached to the
-- writer's own couple (previously any couple_unit_id was accepted).
DROP POLICY IF EXISTS p_learning_series_progress_insert ON learning_series_progress;
CREATE POLICY p_learning_series_progress_insert ON learning_series_progress
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id AND (couple_unit_id IS NULL OR is_couple_member(couple_unit_id)));
DROP POLICY IF EXISTS p_learning_series_progress_update ON learning_series_progress;
CREATE POLICY p_learning_series_progress_update ON learning_series_progress
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id AND (couple_unit_id IS NULL OR is_couple_member(couple_unit_id)));

-- Monthly deep dives: one per couple per month, worked on together.
CREATE TABLE IF NOT EXISTS couple_deep_dives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_unit_id UUID NOT NULL REFERENCES couple_units(id) ON DELETE CASCADE,
  theme_key TEXT NOT NULL REFERENCES deep_dive_themes(theme_key),
  month DATE NOT NULL,
  completed_weeks INTEGER[] NOT NULL DEFAULT '{}',
  reflection TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (couple_unit_id, month)
);
ALTER TABLE couple_deep_dives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_couple_deep_dives_select ON couple_deep_dives;
CREATE POLICY p_couple_deep_dives_select ON couple_deep_dives
  FOR SELECT USING (is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_couple_deep_dives_insert ON couple_deep_dives;
CREATE POLICY p_couple_deep_dives_insert ON couple_deep_dives
  FOR INSERT WITH CHECK (is_couple_member(couple_unit_id) AND (SELECT auth.uid()) = created_by);
DROP POLICY IF EXISTS p_couple_deep_dives_update ON couple_deep_dives;
CREATE POLICY p_couple_deep_dives_update ON couple_deep_dives
  FOR UPDATE USING (is_couple_member(couple_unit_id)) WITH CHECK (is_couple_member(couple_unit_id));

-- New tables get the standard privileges (the 008 default privileges also cover them).
GRANT SELECT ON deep_dive_themes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON couple_deep_dives TO authenticated;
GRANT ALL ON deep_dive_themes, couple_deep_dives TO service_role;
