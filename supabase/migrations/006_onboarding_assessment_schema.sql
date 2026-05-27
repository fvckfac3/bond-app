-- BOND Onboarding Assessment Schema
-- Run after schema.sql and schema_phase2.sql.

CREATE TABLE IF NOT EXISTS onboarding_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  couple_unit_id UUID REFERENCES couple_units(id) ON DELETE SET NULL,
  assessment_id TEXT REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  assessment_kind TEXT NOT NULL DEFAULT 'onboarding',
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  individual_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  couple_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommended_assessments TEXT[] NOT NULL DEFAULT '{}'::text[],
  recommended_series TEXT[] NOT NULL DEFAULT '{}'::text[],
  feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, assessment_id)
);

CREATE TABLE IF NOT EXISTS onboarding_assessment_recommendation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  assessment_ids TEXT[] NOT NULL DEFAULT '{}'::text[],
  series_keys TEXT[] NOT NULL DEFAULT '{}'::text[],
  min_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 100,
  match_type TEXT NOT NULL DEFAULT 'general',
  priority_order INTEGER NOT NULL DEFAULT 100,
  summary TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_assessment_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  signal_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_action TEXT NOT NULL,
  default_script TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_assessment_dimensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id TEXT REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  dimension_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  good_floor INTEGER NOT NULL DEFAULT 60,
  concern_floor INTEGER NOT NULL DEFAULT 45,
  recommendation TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  UNIQUE(assessment_id, dimension_key)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_assessments_user ON onboarding_assessments(user_id, completed DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_assessments_couple ON onboarding_assessments(couple_unit_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_assessment_rules_priority ON onboarding_assessment_recommendation_rules(priority_order);
CREATE INDEX IF NOT EXISTS idx_onboarding_assessment_patterns_severity ON onboarding_assessment_patterns(severity);

ALTER TABLE onboarding_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_assessment_recommendation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_assessment_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_assessment_dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_assessments_select_own ON onboarding_assessments
  FOR SELECT USING (auth.uid()::uuid = user_id OR auth.uid()::uuid IN (
    SELECT user1_id FROM couple_units WHERE id = couple_unit_id
    UNION
    SELECT user2_id FROM couple_units WHERE id = couple_unit_id
  ));

CREATE POLICY onboarding_assessments_insert_own ON onboarding_assessments
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY onboarding_assessments_update_own ON onboarding_assessments
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY onboarding_rules_select_public ON onboarding_assessment_recommendation_rules
  FOR SELECT USING (true);

CREATE POLICY onboarding_patterns_select_public ON onboarding_assessment_patterns
  FOR SELECT USING (true);

CREATE POLICY onboarding_dimensions_select_public ON onboarding_assessment_dimensions
  FOR SELECT USING (true);
