-- BOND App Database Schema — Consolidated
-- Run this first. Deletes and recreates all BOND tables.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CORE
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  pair_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS couple_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  pair_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','inactive'))
);

CREATE TABLE IF NOT EXISTS individual_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  profile JSONB,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS couple_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_unit_id UUID NOT NULL REFERENCES couple_units(id) ON DELETE CASCADE,
  assessment_id TEXT NOT NULL,
  partner1_id UUID NOT NULL REFERENCES users(id),
  partner2_id UUID REFERENCES users(id),
  partner1_answers JSONB,
  partner2_answers JSONB,
  partner1_profile JSONB,
  partner2_profile JSONB,
  partner1_score JSONB,
  partner2_score JSONB,
  scores JSONB,
  dimension_comparisons JSONB,
  shared_strengths JSONB,
  shared_growth_areas JSONB,
  asymmetry_flags JSONB,
  relationship_pattern_key TEXT,
  relationship_pattern_title TEXT,
  relationship_pattern_summary TEXT,
  action_plan JSONB,
  conversation_scripts JSONB,
  couple_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scoring_version TEXT DEFAULT 'couple-v1'
);

CREATE TABLE IF NOT EXISTS daily_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  couple_unit_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  energy INTEGER CHECK (energy >= 1 AND energy <= 5),
  connection INTEGER CHECK (connection >= 1 AND connection <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS learning_series_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  couple_unit_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  series_key TEXT NOT NULL,
  module_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  shared_with_partner BOOLEAN NOT NULL DEFAULT FALSE,
  reflection TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, series_key, module_key)
);

-- ============================================================
-- 2. PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL,
  trial_days INTEGER NOT NULL DEFAULT 7,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'initiated',
  subscription_created BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  is_trial BOOLEAN DEFAULT TRUE,
  trial_ends_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  session_id TEXT UNIQUE REFERENCES payment_transactions(session_id),
  amount_paid DECIMAL(10,2) NOT NULL,
  interval TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_id TEXT UNIQUE NOT NULL,
  session_id TEXT,
  payment_status TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. ACTIVITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  category TEXT,
  duration TEXT,
  difficulty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  couple_unit_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. ASSESSMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  framework TEXT,
  description TEXT,
  estimated_time TEXT,
  questions_count INTEGER,
  icon TEXT,
  category TEXT,
  intro_title TEXT,
  intro_description TEXT,
  result_description TEXT,
  scoring_mode TEXT DEFAULT 'profile',
  content_version TEXT DEFAULT 'v2',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_dimensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  dimension_key TEXT NOT NULL,
  label TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('positive','risk')),
  weight NUMERIC(6,2) NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(assessment_id, dimension_key)
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
  UNIQUE(assessment_id, band_key)
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
  UNIQUE(assessment_id, question_key)
);

-- ============================================================
-- 5. COUPLE ASSESSMENT SCORING
-- ============================================================

ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS scoring_version TEXT DEFAULT 'couple-v1';
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS partner1_profile JSONB;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS partner2_profile JSONB;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS dimension_comparisons JSONB;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS shared_strengths JSONB;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS shared_growth_areas JSONB;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS asymmetry_flags JSONB;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS relationship_pattern_key TEXT;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS relationship_pattern_summary TEXT;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS action_plan JSONB;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS conversation_scripts JSONB;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS couple_summary TEXT;

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
  notes TEXT
);

CREATE TABLE IF NOT EXISTS assessment_couple_dimension_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  dimension_key TEXT NOT NULL,
  label TEXT NOT NULL,
  weight NUMERIC(6,2) NOT NULL DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'balance' CHECK (priority IN ('strength','support','risk','balance')),
  high_shared_text TEXT NOT NULL,
  shared_gap_text TEXT NOT NULL,
  asymmetry_text TEXT NOT NULL,
  action_text TEXT NOT NULL,
  guidance_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(assessment_id, dimension_key)
);

CREATE TABLE IF NOT EXISTS couple_relationship_patterns (
  pattern_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  default_action TEXT NOT NULL,
  default_script TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('low','moderate','high','critical')),
  applicable_assessments TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS assessment_couple_pattern_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  pattern_key TEXT NOT NULL REFERENCES couple_relationship_patterns(pattern_key) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('numeric','attachment-quadrant','values-profile','manual')),
  rule_data JSONB NOT NULL DEFAULT '{}',
  priority_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(assessment_id, pattern_key, match_type)
);

-- ============================================================
-- 6. ONBOARDING
-- ============================================================

CREATE TABLE IF NOT EXISTS onboarding_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  couple_unit_id UUID REFERENCES couple_units(id) ON DELETE SET NULL,
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  assessment_kind TEXT NOT NULL DEFAULT 'onboarding',
  answers JSONB NOT NULL DEFAULT '{}',
  individual_profile JSONB NOT NULL DEFAULT '{}',
  couple_profile JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB NOT NULL DEFAULT '{}',
  recommended_assessments TEXT[] NOT NULL DEFAULT '{}',
  recommended_series TEXT[] NOT NULL DEFAULT '{}',
  feedback JSONB NOT NULL DEFAULT '{}',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, assessment_id)
);

CREATE TABLE IF NOT EXISTS onboarding_assessment_recommendation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  assessment_ids TEXT[] NOT NULL DEFAULT '{}',
  series_keys TEXT[] NOT NULL DEFAULT '{}',
  min_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 100,
  match_type TEXT NOT NULL DEFAULT 'general',
  priority_order INTEGER NOT NULL DEFAULT 100,
  summary TEXT NOT NULL,
  recommendation TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS onboarding_assessment_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  signal_rules JSONB NOT NULL DEFAULT '{}',
  default_action TEXT NOT NULL,
  default_script TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate'
);

CREATE TABLE IF NOT EXISTS onboarding_assessment_dimensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  dimension_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  good_floor INTEGER NOT NULL DEFAULT 60,
  concern_floor INTEGER NOT NULL DEFAULT 45,
  recommendation TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  UNIQUE(assessment_id, dimension_key)
);

-- ============================================================
-- 7. LEARNING SERIES
-- ============================================================

CREATE TABLE IF NOT EXISTS learning_series (
  series_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_series_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_key TEXT NOT NULL REFERENCES learning_series(series_key) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  duration TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(series_key, module_key)
);

-- ============================================================
-- 8. AI COMMUNICATION ANALYSIS
-- ============================================================

CREATE TABLE IF NOT EXISTS communication_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couple_units(id) ON DELETE CASCADE,
  analysis_date TIMESTAMPTZ,
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 100),
  response_time_score INTEGER CHECK (response_time_score >= 1 AND overall_score <= 100),
  listening_score INTEGER CHECK (listening_score >= 1 AND listening_score <= 100),
  tone_consistency_score INTEGER CHECK (tone_consistency_score >= 1 AND tone_consistency_score <= 100),
  strengths TEXT[],
  areas_for_growth TEXT[],
  recommendations TEXT[],
  sample_interaction_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS text_message_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couple_units(id) ON DELETE CASCADE,
  analysis_date TIMESTAMPTZ,
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 100),
  tone_variety_score INTEGER CHECK (tone_variety_score >= 1 AND tone_variety_score <= 100),
  emotional_expression_score INTEGER CHECK (emotional_expression_score >= 1 AND emotional_expression_score <= 100),
  clarity_score INTEGER CHECK (clarity_score >= 1 AND clarity_score <= 100),
  engagement_score INTEGER CHECK (engagement_score >= 1 AND engagement_score <= 100),
  patterns JSONB,
  tone_breakdown JSONB,
  growth_suggestions TEXT[],
  sample_message_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. DAILY QUESTIONS & CHECK-INS
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  category TEXT,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 3),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_question_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  question_id UUID REFERENCES daily_questions(id) ON DELETE SET NULL,
  answer TEXT NOT NULL,
  response_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id, response_date)
);

CREATE TABLE IF NOT EXISTS check_in_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  prompt_questions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS check_in_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  couple_unit_id UUID NOT NULL REFERENCES couple_units(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES check_in_topics(id) ON DELETE CASCADE,
  response JSONB,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. MEMORY LANE & BUCKET LIST
-- ============================================================

CREATE TABLE IF NOT EXISTS memory_lane (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  couple_unit_id UUID NOT NULL REFERENCES couple_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  memory_date DATE,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('milestone','adventure','overcome','everyday','other')),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bucket_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  couple_unit_id UUID NOT NULL REFERENCES couple_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'adventure' CHECK (category IN ('adventure','outdoor','cultural','give_back','relaxation','other')),
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  estimated_cost_range TEXT CHECK (estimated_cost_range IN ('low','medium','high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ANALYZER RESULTS TABLES (migrated from MongoDB → Supabase)
-- Stores outputs from the 5 AI analyzer endpoints
-- ============================================================================

CREATE TABLE IF NOT EXISTS communication_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couple_units(id),
  user_id UUID REFERENCES users(id),
  overall_score INTEGER,
  key_positive TEXT[],
  key_negative TEXT[],
  sentiment TEXT,
  listening_score INTEGER,
  response_time_score INTEGER,
  engagement_score INTEGER,
  recommendations TEXT[],
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS text_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couple_units(id),
  user_id UUID REFERENCES users(id),
  tone_variety_score INTEGER,
  dominant_tones TEXT[],
  emotional_depth_score INTEGER,
  clarity_score INTEGER,
  recommendations TEXT[],
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS argument_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couple_units(id),
  user_id UUID REFERENCES users(id),
  conflict_score INTEGER,
  escalation_patterns TEXT[],
  repair_opportunities TEXT[],
  communication_breakdowns TEXT[],
  recommendations TEXT[],
  quick_score INTEGER,
  severity_level TEXT,
  primary_concern TEXT,
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voice_tone_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couple_units(id),
  user_id UUID REFERENCES users(id),
  overall_tone_score INTEGER,
  speaker_breakdown JSONB,
  tension_indicators TEXT[],
  warmth_indicators TEXT[],
  speaking_balance JSONB,
  recommendations TEXT[],
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emotional_pattern_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couple_units(id),
  user_id UUID REFERENCES users(id),
  pattern_summary TEXT,
  emotional_trends JSONB,
  trigger_maps JSONB,
  growth_trajectory TEXT,
  historical_comparison JSONB,
  recommendations TEXT[],
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analyzer result tables
CREATE INDEX IF NOT EXISTS idx_communication_analyses_couple ON communication_analyses(couple_id);
CREATE INDEX IF NOT EXISTS idx_text_analyses_couple ON text_analyses(couple_id);
CREATE INDEX IF NOT EXISTS idx_argument_analyses_couple ON argument_analyses(couple_id);
CREATE INDEX IF NOT EXISTS idx_voice_tone_analyses_couple ON voice_tone_analyses(couple_id);
CREATE INDEX IF NOT EXISTS idx_emotional_pattern_analyses_couple ON emotional_pattern_analyses(couple_id);

-- RLS for analyzer results
ALTER TABLE communication_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE argument_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_tone_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_pattern_analyses ENABLE ROW LEVEL SECURITY;

-- Users can read their couple's analyzer results. No client INSERT policy: results are
-- written only by the backend (service role, which bypasses RLS) after a pairing check.
CREATE POLICY analyzer_select ON communication_analyses FOR SELECT USING (couple_id IN (SELECT id FROM couple_units WHERE user1_id = auth.uid() OR user2_id = auth.uid()));
CREATE POLICY analyzer_select ON text_analyses FOR SELECT USING (couple_id IN (SELECT id FROM couple_units WHERE user1_id = auth.uid() OR user2_id = auth.uid()));
CREATE POLICY analyzer_select ON argument_analyses FOR SELECT USING (couple_id IN (SELECT id FROM couple_units WHERE user1_id = auth.uid() OR user2_id = auth.uid()));
CREATE POLICY analyzer_select ON voice_tone_analyses FOR SELECT USING (couple_id IN (SELECT id FROM couple_units WHERE user1_id = auth.uid() OR user2_id = auth.uid()));
CREATE POLICY analyzer_select ON emotional_pattern_analyses FOR SELECT USING (couple_id IN (SELECT id FROM couple_units WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

-- ============================================================================
-- STATUS CHECKS TABLE (migrated from MongoDB → Supabase)
-- ============================================================================

CREATE TABLE IF NOT EXISTS status_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Public read, authenticated write
ALTER TABLE status_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY status_checks_select ON status_checks FOR SELECT USING (true);
CREATE POLICY status_checks_insert ON status_checks FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_pair_code ON users(pair_code);
CREATE INDEX IF NOT EXISTS idx_couple_units_pair_code ON couple_units(pair_code);
CREATE INDEX IF NOT EXISTS idx_couple_units_user1 ON couple_units(user1_id);
CREATE INDEX IF NOT EXISTS idx_couple_results_couple ON couple_results(couple_unit_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user ON daily_check_ins(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_learning_series_progress_user ON learning_series_progress(user_id, series_key);
CREATE INDEX IF NOT EXISTS idx_learning_series_progress_couple ON learning_series_progress(couple_unit_id, series_key);
CREATE INDEX IF NOT EXISTS idx_assessment_dimensions ON assessment_dimensions(assessment_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_assessment_bands ON assessment_bands(assessment_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_assessment_questions ON assessment_questions(assessment_id, category);
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_assessments(user_id, completed DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_rules_priority ON onboarding_assessment_recommendation_rules(priority_order);
CREATE INDEX IF NOT EXISTS idx_couple_pattern ON assessment_couple_pattern_rules(assessment_id, priority_order);
CREATE INDEX IF NOT EXISTS idx_learning_series_modules ON learning_series_modules(series_key, sort_order);

-- ============================================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_couple_units_updated_at BEFORE UPDATE ON couple_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_onboarding_updated_at BEFORE UPDATE ON onboarding_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_series_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_couple_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_couple_dimension_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_relationship_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_couple_pattern_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_assessment_recommendation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_assessment_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_assessment_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_series_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_message_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_lane ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_list ENABLE ROW LEVEL SECURITY;

-- Public read policies (catalog data — safe to expose)
CREATE POLICY p_users_read_public ON users FOR SELECT USING (true);
CREATE POLICY p_assessments_read_public ON assessments FOR SELECT USING (true);
CREATE POLICY p_assessment_dimensions_read_public ON assessment_dimensions FOR SELECT USING (true);
CREATE POLICY p_assessment_bands_read_public ON assessment_bands FOR SELECT USING (true);
CREATE POLICY p_assessment_questions_read_public ON assessment_questions FOR SELECT USING (true);
CREATE POLICY p_couple_rules_read_public ON assessment_couple_rules FOR SELECT USING (true);
CREATE POLICY p_couple_dim_rules_read_public ON assessment_couple_dimension_rules FOR SELECT USING (true);
CREATE POLICY p_couple_patterns_read_public ON couple_relationship_patterns FOR SELECT USING (true);
CREATE POLICY p_couple_pat_rules_read_public ON assessment_couple_pattern_rules FOR SELECT USING (true);
CREATE POLICY p_onboarding_rules_read_public ON onboarding_assessment_recommendation_rules FOR SELECT USING (true);
CREATE POLICY p_onboarding_patterns_read_public ON onboarding_assessment_patterns FOR SELECT USING (true);
CREATE POLICY p_onboarding_dims_read_public ON onboarding_assessment_dimensions FOR SELECT USING (true);
CREATE POLICY p_learning_series_read_public ON learning_series FOR SELECT USING (true);
CREATE POLICY p_learning_modules_read_public ON learning_series_modules FOR SELECT USING (true);
CREATE POLICY p_activities_read_public ON activities FOR SELECT USING (true);
CREATE POLICY p_check_in_topics_read_public ON check_in_topics FOR SELECT USING (true);

-- Auth policies
CREATE POLICY p_payment_transactions_select ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY p_payment_transactions_all ON payment_transactions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY p_subscriptions_select ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY p_subscriptions_all ON subscriptions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY p_webhook_events_all ON webhook_events
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY p_onboarding_assessments_select ON onboarding_assessments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY p_onboarding_assessments_insert ON onboarding_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY p_onboarding_assessments_update ON onboarding_assessments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY p_learning_series_progress_select ON learning_series_progress
  FOR SELECT USING (
    auth.uid() = user_id
    OR (couple_unit_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM couple_units cu WHERE cu.id = learning_series_progress.couple_unit_id
      AND (cu.user1_id = auth.uid() OR cu.user2_id = auth.uid())
    ))
  );
CREATE POLICY p_learning_series_progress_insert ON learning_series_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY p_learning_series_progress_update ON learning_series_progress
  FOR UPDATE USING (auth.uid() = user_id);
-- ============================================================
-- COUPLE-SCOPED PREMIUM
-- Premium belongs to the couple: a user is covered if they or their active
-- partner holds a subscription. RLS on `subscriptions` only exposes a user's
-- own row, so this SECURITY DEFINER function returns the couple's subscriptions
-- (best first) with billing details (amounts, Stripe/session ids) left out.
-- ============================================================
CREATE OR REPLACE FUNCTION get_couple_subscription()
RETURNS TABLE (
  owner_id UUID,
  is_own BOOLEAN,
  status TEXT,
  is_trial BOOLEAN,
  trial_ends_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  package_id TEXT,
  "interval" TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH members AS (
    SELECT auth.uid() AS uid
    UNION
    SELECT CASE WHEN cu.user1_id = auth.uid() THEN cu.user2_id ELSE cu.user1_id END
    FROM couple_units cu
    WHERE cu.status = 'active' AND auth.uid() IN (cu.user1_id, cu.user2_id)
  )
  SELECT s.user_id, s.user_id = auth.uid(), s.status, s.is_trial, s.trial_ends_at,
         s.expires_at, s.package_id, s."interval"
  FROM subscriptions s
  JOIN members m ON s.user_id = m.uid
  WHERE m.uid IS NOT NULL
  ORDER BY (s.status IN ('active', 'trialing') AND s.expires_at > NOW()) DESC,
           (s.user_id = auth.uid()) DESC,
           s.expires_at DESC
$$;

REVOKE ALL ON FUNCTION get_couple_subscription() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_couple_subscription() TO authenticated;

-- ============================================================
-- MESSAGING, ACTIVITY COMPLETION, COUPLE ACCESS
-- `messages` previously existed only in schema_phase2.sql, and
-- `activity_completions` lacked the columns the app writes. Idempotent.
-- ============================================================

-- SECURITY DEFINER so policies don't depend on RLS of couple_units itself.
CREATE OR REPLACE FUNCTION is_couple_member(cu_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM couple_units cu
    WHERE cu.id = cu_id AND auth.uid() IN (cu.user1_id, cu.user2_id)
  )
$$;
REVOKE ALL ON FUNCTION is_couple_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_couple_member(UUID) TO authenticated;

DROP POLICY IF EXISTS p_couple_units_select ON couple_units;
CREATE POLICY p_couple_units_select ON couple_units
  FOR SELECT USING (auth.uid() IN (user1_id, user2_id));

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_unit_id UUID NOT NULL REFERENCES couple_units(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_couple ON messages(couple_unit_id, created_at DESC);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_messages_select ON messages;
CREATE POLICY p_messages_select ON messages
  FOR SELECT USING (is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_messages_insert ON messages;
CREATE POLICY p_messages_insert ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id AND is_couple_member(couple_unit_id));
-- Only the recipient (not the sender) may update, i.e. mark as read.
DROP POLICY IF EXISTS p_messages_update ON messages;
CREATE POLICY p_messages_update ON messages
  FOR UPDATE USING (is_couple_member(couple_unit_id) AND sender_id <> auth.uid());

-- Supabase Realtime only streams tables in this publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

ALTER TABLE activity_completions ADD COLUMN IF NOT EXISTS response JSONB;
ALTER TABLE activity_completions ADD COLUMN IF NOT EXISTS shared_with_partner BOOLEAN DEFAULT FALSE;

-- Own completions always; a partner's only when they chose to share.
DROP POLICY IF EXISTS p_activity_completions_select ON activity_completions;
CREATE POLICY p_activity_completions_select ON activity_completions
  FOR SELECT USING (
    auth.uid() = user_id
    OR (shared_with_partner AND couple_unit_id IS NOT NULL AND is_couple_member(couple_unit_id))
  );
DROP POLICY IF EXISTS p_activity_completions_insert ON activity_completions;
CREATE POLICY p_activity_completions_insert ON activity_completions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (couple_unit_id IS NULL OR is_couple_member(couple_unit_id))
  );
