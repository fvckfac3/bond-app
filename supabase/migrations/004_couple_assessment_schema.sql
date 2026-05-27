-- BOND Couple Assessment Scoring Schema
-- Run after schema.sql, schema_phase2.sql, 003_assessment_content_schema.sql, and the assessment seed file.

ALTER TABLE couple_results
  ADD COLUMN IF NOT EXISTS scoring_version TEXT DEFAULT 'couple-v1',
  ADD COLUMN IF NOT EXISTS partner1_profile JSONB,
  ADD COLUMN IF NOT EXISTS partner2_profile JSONB,
  ADD COLUMN IF NOT EXISTS dimension_comparisons JSONB,
  ADD COLUMN IF NOT EXISTS shared_strengths JSONB,
  ADD COLUMN IF NOT EXISTS shared_growth_areas JSONB,
  ADD COLUMN IF NOT EXISTS asymmetry_flags JSONB,
  ADD COLUMN IF NOT EXISTS relationship_pattern_key TEXT,
  ADD COLUMN IF NOT EXISTS relationship_pattern_title TEXT,
  ADD COLUMN IF NOT EXISTS relationship_pattern_summary TEXT,
  ADD COLUMN IF NOT EXISTS action_plan JSONB,
  ADD COLUMN IF NOT EXISTS conversation_scripts JSONB,
  ADD COLUMN IF NOT EXISTS couple_summary TEXT;

CREATE TABLE IF NOT EXISTS assessment_couple_rules (
  assessment_id TEXT PRIMARY KEY REFERENCES assessments(id) ON DELETE CASCADE,
  scoring_version TEXT NOT NULL DEFAULT 'couple-v1',
  average_weight NUMERIC(5,2) NOT NULL DEFAULT 0.40,
  alignment_weight NUMERIC(5,2) NOT NULL DEFAULT 0.35,
  floor_weight NUMERIC(5,2) NOT NULL DEFAULT 0.25,
  high_gap_threshold NUMERIC(5,2) NOT NULL DEFAULT 25,
  shared_strength_threshold NUMERIC(5,2) NOT NULL DEFAULT 70,
  shared_growth_threshold NUMERIC(5,2) NOT NULL DEFAULT 55,
  low_floor_threshold NUMERIC(5,2) NOT NULL DEFAULT 45,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_couple_dimension_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  dimension_key TEXT NOT NULL,
  label TEXT NOT NULL,
  weight NUMERIC(6,2) NOT NULL DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'balance' CHECK (priority IN ('strength', 'support', 'risk', 'balance')),
  high_shared_text TEXT NOT NULL,
  shared_gap_text TEXT NOT NULL,
  asymmetry_text TEXT NOT NULL,
  action_text TEXT NOT NULL,
  guidance_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assessment_id, dimension_key)
);

CREATE TABLE IF NOT EXISTS couple_relationship_patterns (
  pattern_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  default_action TEXT NOT NULL,
  default_script TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
  applicable_assessments TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_couple_pattern_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  pattern_key TEXT NOT NULL REFERENCES couple_relationship_patterns(pattern_key) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('numeric', 'attachment-quadrant', 'values-profile', 'manual')),
  rule_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  priority_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assessment_id, pattern_key, match_type)
);

CREATE INDEX IF NOT EXISTS idx_assessment_couple_rules_version ON assessment_couple_rules(scoring_version);
CREATE INDEX IF NOT EXISTS idx_assessment_couple_dimension_rules_assessment ON assessment_couple_dimension_rules(assessment_id, guidance_order);
CREATE INDEX IF NOT EXISTS idx_couple_relationship_patterns_severity ON couple_relationship_patterns(severity);
CREATE INDEX IF NOT EXISTS idx_assessment_couple_pattern_rules_assessment ON assessment_couple_pattern_rules(assessment_id, priority_order);
CREATE INDEX IF NOT EXISTS idx_couple_results_relationship_pattern ON couple_results(relationship_pattern_key);
CREATE INDEX IF NOT EXISTS idx_couple_results_scoring_version ON couple_results(scoring_version);

ALTER TABLE assessment_couple_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_couple_dimension_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_relationship_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_couple_pattern_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY assessment_couple_rules_select_public ON assessment_couple_rules
  FOR SELECT USING (true);

CREATE POLICY assessment_couple_dimension_rules_select_public ON assessment_couple_dimension_rules
  FOR SELECT USING (true);

CREATE POLICY couple_relationship_patterns_select_public ON couple_relationship_patterns
  FOR SELECT USING (true);

CREATE POLICY assessment_couple_pattern_rules_select_public ON assessment_couple_pattern_rules
  FOR SELECT USING (true);
