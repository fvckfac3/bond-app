-- BOND Assessment Content Schema
-- Run after schema.sql and before seeding assessment content.

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS intro_title TEXT,
  ADD COLUMN IF NOT EXISTS intro_description TEXT,
  ADD COLUMN IF NOT EXISTS result_description TEXT,
  ADD COLUMN IF NOT EXISTS scoring_mode TEXT DEFAULT 'profile',
  ADD COLUMN IF NOT EXISTS content_version TEXT DEFAULT 'v2';

CREATE TABLE IF NOT EXISTS assessment_dimensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  dimension_key TEXT NOT NULL,
  label TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('positive', 'risk')),
  weight NUMERIC(6,2) NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assessment_id, dimension_key)
);

CREATE TABLE IF NOT EXISTS assessment_bands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  band_key TEXT NOT NULL,
  min_score NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assessment_id, band_key)
);

CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_key INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'likert',
  scale INTEGER NOT NULL DEFAULT 5,
  category TEXT NOT NULL,
  reverse BOOLEAN NOT NULL DEFAULT FALSE,
  options JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assessment_id, question_key)
);

CREATE INDEX IF NOT EXISTS idx_assessment_dimensions_assessment ON assessment_dimensions(assessment_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_assessment_bands_assessment ON assessment_bands(assessment_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_category ON assessment_questions(assessment_id, category);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY assessments_select_public ON assessments
  FOR SELECT USING (true);

CREATE POLICY assessment_dimensions_select_public ON assessment_dimensions
  FOR SELECT USING (true);

CREATE POLICY assessment_bands_select_public ON assessment_bands
  FOR SELECT USING (true);

CREATE POLICY assessment_questions_select_public ON assessment_questions
