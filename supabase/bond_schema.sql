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
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_assessments(user_id, completed DESC);
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
ALTER TABLE onboarding_assessments ENABLE ROW LEVEL SECURITY;
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

-- ============================================================
-- ASSESSMENT SESSIONS + STRIPE CORRELATION
-- `assessment_sessions` is what app/assessment/[id].tsx writes and what free-tier
-- usage counting reads, but it was only defined in the older schema.sql.
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  scores JSONB,
  completed BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  answer_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user ON assessment_sessions(user_id, assessment_id);
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_assessment_sessions_select ON assessment_sessions;
CREATE POLICY p_assessment_sessions_select ON assessment_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS p_assessment_sessions_insert ON assessment_sessions;
CREATE POLICY p_assessment_sessions_insert ON assessment_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS p_assessment_sessions_update ON assessment_sessions;
CREATE POLICY p_assessment_sessions_update ON assessment_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Lets later Stripe events (subscription.updated/deleted, invoices) find the row.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);

-- ============================================================
-- PUSH TOKENS
-- One Expo push token per user (latest device wins). Written by the mobile app.
-- ============================================================
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_user_push_tokens_select ON user_push_tokens;
CREATE POLICY p_user_push_tokens_select ON user_push_tokens FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS p_user_push_tokens_insert ON user_push_tokens;
CREATE POLICY p_user_push_tokens_insert ON user_push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS p_user_push_tokens_update ON user_push_tokens;
CREATE POLICY p_user_push_tokens_update ON user_push_tokens
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- CORE FLOWS: SIGNUP, PAIRING, PAIRED RESULTS, CHECK-INS
-- ============================================================

-- Signup: the profile row is created by the database from auth signup metadata, so
-- it works whether or not email confirmation leaves the client without a session.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  code TEXT := upper(coalesce(NEW.raw_user_meta_data->>'pair_code', ''));
BEGIN
  WHILE code !~ '^[A-Z0-9]{6}$' OR EXISTS (SELECT 1 FROM users WHERE pair_code = code) LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1);
    END LOOP;
  END LOOP;
  INSERT INTO users (id, email, name, pair_code)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', code)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Users: you can read yourself and your partner — not everyone (the old public read
-- policy exposed every user's email to anyone holding the app's anon key).
CREATE OR REPLACE FUNCTION is_partner_of(other UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM couple_units cu
    WHERE cu.status = 'active'
      AND ((cu.user1_id = auth.uid() AND cu.user2_id = other)
        OR (cu.user2_id = auth.uid() AND cu.user1_id = other))
  )
$$;
REVOKE ALL ON FUNCTION is_partner_of(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_partner_of(UUID) TO authenticated;

DROP POLICY IF EXISTS p_users_read_public ON users;
DROP POLICY IF EXISTS p_users_select ON users;
CREATE POLICY p_users_select ON users FOR SELECT USING (auth.uid() = id OR is_partner_of(id));
DROP POLICY IF EXISTS p_users_update_own ON users;
CREATE POLICY p_users_update_own ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Pairing: redeem a partner's pair code. Runs server-side so the caller never needs
-- to read other users' rows, and so both "not already paired" checks are enforced.
ALTER TABLE couple_units ALTER COLUMN pair_code
  SET DEFAULT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12));

CREATE OR REPLACE FUNCTION pair_with_partner(partner_code TEXT)
RETURNS couple_units
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  partner users%ROWTYPE;
  result couple_units%ROWTYPE;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  SELECT * INTO partner FROM users WHERE pair_code = upper(replace(partner_code, '-', ''));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;
  IF partner.id = me THEN
    RAISE EXCEPTION 'self_pairing';
  END IF;
  IF EXISTS (SELECT 1 FROM couple_units WHERE status = 'active' AND me IN (user1_id, user2_id)) THEN
    RAISE EXCEPTION 'already_paired';
  END IF;
  IF EXISTS (SELECT 1 FROM couple_units WHERE status = 'active' AND partner.id IN (user1_id, user2_id)) THEN
    RAISE EXCEPTION 'partner_already_paired';
  END IF;
  INSERT INTO couple_units (user1_id, user2_id, status)
  VALUES (me, partner.id, 'active')
  RETURNING * INTO result;
  RETURN result;
END
$$;
REVOKE ALL ON FUNCTION pair_with_partner(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pair_with_partner(TEXT) TO authenticated;

-- Assessment sessions: a partner's completed session becomes readable only once you
-- have completed the same assessment (the paired-comparison gate, 01 Core Systems §9).
CREATE OR REPLACE FUNCTION can_view_partner_session(owner UUID, assessment TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT is_partner_of(owner)
     AND EXISTS (
       SELECT 1 FROM assessment_sessions s
       WHERE s.user_id = auth.uid() AND s.assessment_id = assessment AND s.completed
     )
$$;
REVOKE ALL ON FUNCTION can_view_partner_session(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION can_view_partner_session(UUID, TEXT) TO authenticated;

DROP POLICY IF EXISTS p_assessment_sessions_select ON assessment_sessions;
CREATE POLICY p_assessment_sessions_select ON assessment_sessions FOR SELECT USING (
  auth.uid() = user_id OR (completed AND can_view_partner_session(user_id, assessment_id))
);

-- Paired results: columns the app writes, one result per couple per assessment, and a
-- server-side check that BOTH partners completed before a result can be created.
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS user1_session_id UUID REFERENCES assessment_sessions(id);
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS user2_session_id UUID REFERENCES assessment_sessions(id);
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS compatibility_score NUMERIC;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS combined_scores JSONB;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS ai_narrative TEXT;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS ai_growth_recommendations JSONB;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS ai_strength_affirmation TEXT;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS ai_communication_scripts JSONB;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS framework_tags JSONB;
CREATE UNIQUE INDEX IF NOT EXISTS idx_couple_results_couple_assessment
  ON couple_results(couple_unit_id, assessment_id);

CREATE OR REPLACE FUNCTION both_partners_completed(cu_id UUID, assessment TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM couple_units cu
    WHERE cu.id = cu_id AND cu.status = 'active' AND cu.user2_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM assessment_sessions s
                  WHERE s.user_id = cu.user1_id AND s.assessment_id = assessment AND s.completed)
      AND EXISTS (SELECT 1 FROM assessment_sessions s
                  WHERE s.user_id = cu.user2_id AND s.assessment_id = assessment AND s.completed)
  )
$$;
REVOKE ALL ON FUNCTION both_partners_completed(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION both_partners_completed(UUID, TEXT) TO authenticated;

DROP POLICY IF EXISTS p_couple_results_select ON couple_results;
CREATE POLICY p_couple_results_select ON couple_results
  FOR SELECT USING (is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_couple_results_insert ON couple_results;
CREATE POLICY p_couple_results_insert ON couple_results FOR INSERT WITH CHECK (
  is_couple_member(couple_unit_id) AND both_partners_completed(couple_unit_id, assessment_id)
);
DROP POLICY IF EXISTS p_couple_results_update ON couple_results;
CREATE POLICY p_couple_results_update ON couple_results
  FOR UPDATE USING (is_couple_member(couple_unit_id))
  WITH CHECK (is_couple_member(couple_unit_id) AND both_partners_completed(couple_unit_id, assessment_id));

-- Daily check-ins: the fields the check-in screen collects (connection is 1-10 there).
ALTER TABLE daily_check_ins ADD COLUMN IF NOT EXISTS connection_score INTEGER
  CHECK (connection_score BETWEEN 1 AND 10);
ALTER TABLE daily_check_ins ADD COLUMN IF NOT EXISTS mood_note TEXT;
ALTER TABLE daily_check_ins ADD COLUMN IF NOT EXISTS appreciation TEXT;

DROP POLICY IF EXISTS p_daily_check_ins_select ON daily_check_ins;
CREATE POLICY p_daily_check_ins_select ON daily_check_ins FOR SELECT USING (
  auth.uid() = user_id OR (couple_unit_id IS NOT NULL AND is_couple_member(couple_unit_id))
);
DROP POLICY IF EXISTS p_daily_check_ins_insert ON daily_check_ins;
CREATE POLICY p_daily_check_ins_insert ON daily_check_ins FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (couple_unit_id IS NULL OR is_couple_member(couple_unit_id))
);
DROP POLICY IF EXISTS p_daily_check_ins_update ON daily_check_ins;
CREATE POLICY p_daily_check_ins_update ON daily_check_ins FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND (couple_unit_id IS NULL OR is_couple_member(couple_unit_id)));

-- ============================================================
-- TABLE PRIVILEGES
-- The Data API roles need table privileges before RLS is even consulted. The live
-- project had none (every client query failed with "permission denied"), including
-- service_role, which bypasses RLS but not privileges. RLS decides which rows.
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Signed-out clients may only read the public catalog (still filtered by RLS).
GRANT SELECT ON activities, assessments, learning_series, learning_series_modules,
  check_in_topics TO anon;

-- Tables created later in this schema get the same privileges automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- ============================================================
-- ADVISOR FIXES + MEMORY LANE / BUCKET LIST (migration 009)
-- Later sections supersede earlier policy definitions above.
-- ============================================================

-- ============================================================
-- 1. SECURITY
-- ============================================================

-- Trigger-only function: nobody should be able to call it through the API.
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC, anon, authenticated;
-- Supabase Auth inserts into auth.users as supabase_auth_admin; keep its access explicit.
GRANT EXECUTE ON FUNCTION handle_new_user() TO supabase_auth_admin;

ALTER FUNCTION update_updated_at_column() SET search_path = public;

-- Only answers for the caller's own couple (it was callable for any couple id).
CREATE OR REPLACE FUNCTION both_partners_completed(cu_id UUID, assessment TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM couple_units cu
    WHERE cu.id = cu_id AND cu.status = 'active' AND cu.user2_id IS NOT NULL
      AND (SELECT auth.uid()) IN (cu.user1_id, cu.user2_id)
      AND EXISTS (SELECT 1 FROM assessment_sessions s
                  WHERE s.user_id = cu.user1_id AND s.assessment_id = assessment AND s.completed)
      AND EXISTS (SELECT 1 FROM assessment_sessions s
                  WHERE s.user_id = cu.user2_id AND s.assessment_id = assessment AND s.completed)
  )
$$;

-- ============================================================
-- 2. RLS PERFORMANCE: (select auth.uid()) is evaluated once per statement
-- ============================================================

-- service_role bypasses RLS, so these policies never did anything; they only
-- added a second permissive policy to evaluate on every client query.
DROP POLICY IF EXISTS p_payment_transactions_all ON payment_transactions;
DROP POLICY IF EXISTS p_subscriptions_all ON subscriptions;
DROP POLICY IF EXISTS p_webhook_events_all ON webhook_events;

DROP POLICY IF EXISTS p_payment_transactions_select ON payment_transactions;
CREATE POLICY p_payment_transactions_select ON payment_transactions
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS p_subscriptions_select ON subscriptions;
CREATE POLICY p_subscriptions_select ON subscriptions
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS p_users_select ON users;
CREATE POLICY p_users_select ON users
  FOR SELECT USING ((SELECT auth.uid()) = id OR is_partner_of(id));
DROP POLICY IF EXISTS p_users_update_own ON users;
CREATE POLICY p_users_update_own ON users
  FOR UPDATE USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS p_couple_units_select ON couple_units;
CREATE POLICY p_couple_units_select ON couple_units
  FOR SELECT USING ((SELECT auth.uid()) IN (user1_id, user2_id));

DROP POLICY IF EXISTS p_onboarding_assessments_select ON onboarding_assessments;
CREATE POLICY p_onboarding_assessments_select ON onboarding_assessments
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS p_onboarding_assessments_insert ON onboarding_assessments;
CREATE POLICY p_onboarding_assessments_insert ON onboarding_assessments
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS p_onboarding_assessments_update ON onboarding_assessments;
CREATE POLICY p_onboarding_assessments_update ON onboarding_assessments
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS p_learning_series_progress_select ON learning_series_progress;
CREATE POLICY p_learning_series_progress_select ON learning_series_progress
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id
    OR (couple_unit_id IS NOT NULL AND is_couple_member(couple_unit_id))
  );
DROP POLICY IF EXISTS p_learning_series_progress_insert ON learning_series_progress;
CREATE POLICY p_learning_series_progress_insert ON learning_series_progress
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS p_learning_series_progress_update ON learning_series_progress;
CREATE POLICY p_learning_series_progress_update ON learning_series_progress
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS analyzer_select ON communication_analyses;
CREATE POLICY analyzer_select ON communication_analyses FOR SELECT USING (is_couple_member(couple_id));
DROP POLICY IF EXISTS analyzer_select ON text_analyses;
CREATE POLICY analyzer_select ON text_analyses FOR SELECT USING (is_couple_member(couple_id));
DROP POLICY IF EXISTS analyzer_select ON argument_analyses;
CREATE POLICY analyzer_select ON argument_analyses FOR SELECT USING (is_couple_member(couple_id));
DROP POLICY IF EXISTS analyzer_select ON voice_tone_analyses;
CREATE POLICY analyzer_select ON voice_tone_analyses FOR SELECT USING (is_couple_member(couple_id));
DROP POLICY IF EXISTS analyzer_select ON emotional_pattern_analyses;
CREATE POLICY analyzer_select ON emotional_pattern_analyses FOR SELECT USING (is_couple_member(couple_id));

DROP POLICY IF EXISTS status_checks_insert ON status_checks;
CREATE POLICY status_checks_insert ON status_checks
  FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS p_messages_insert ON messages;
CREATE POLICY p_messages_insert ON messages
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = sender_id AND is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_messages_update ON messages;
CREATE POLICY p_messages_update ON messages
  FOR UPDATE USING (is_couple_member(couple_unit_id) AND sender_id <> (SELECT auth.uid()));

DROP POLICY IF EXISTS p_activity_completions_select ON activity_completions;
CREATE POLICY p_activity_completions_select ON activity_completions
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id
    OR (shared_with_partner AND couple_unit_id IS NOT NULL AND is_couple_member(couple_unit_id))
  );
DROP POLICY IF EXISTS p_activity_completions_insert ON activity_completions;
CREATE POLICY p_activity_completions_insert ON activity_completions
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = user_id AND (couple_unit_id IS NULL OR is_couple_member(couple_unit_id))
  );

DROP POLICY IF EXISTS p_assessment_sessions_select ON assessment_sessions;
CREATE POLICY p_assessment_sessions_select ON assessment_sessions
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id OR (completed AND can_view_partner_session(user_id, assessment_id))
  );
DROP POLICY IF EXISTS p_assessment_sessions_insert ON assessment_sessions;
CREATE POLICY p_assessment_sessions_insert ON assessment_sessions
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS p_assessment_sessions_update ON assessment_sessions;
CREATE POLICY p_assessment_sessions_update ON assessment_sessions
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS p_user_push_tokens_select ON user_push_tokens;
CREATE POLICY p_user_push_tokens_select ON user_push_tokens
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS p_user_push_tokens_insert ON user_push_tokens;
CREATE POLICY p_user_push_tokens_insert ON user_push_tokens
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS p_user_push_tokens_update ON user_push_tokens;
CREATE POLICY p_user_push_tokens_update ON user_push_tokens
  FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS p_daily_check_ins_select ON daily_check_ins;
CREATE POLICY p_daily_check_ins_select ON daily_check_ins
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id OR (couple_unit_id IS NOT NULL AND is_couple_member(couple_unit_id))
  );
DROP POLICY IF EXISTS p_daily_check_ins_insert ON daily_check_ins;
CREATE POLICY p_daily_check_ins_insert ON daily_check_ins
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = user_id AND (couple_unit_id IS NULL OR is_couple_member(couple_unit_id))
  );
DROP POLICY IF EXISTS p_daily_check_ins_update ON daily_check_ins;
CREATE POLICY p_daily_check_ins_update ON daily_check_ins
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND (couple_unit_id IS NULL OR is_couple_member(couple_unit_id))
  );

-- ============================================================
-- 3. MEMORY LANE + BUCKET LIST (were MongoDB-backed; now Supabase, used directly by
--    the app under RLS). Both tables are shared by the couple: either partner can
--    add, edit, and remove entries.
-- ============================================================

-- Memory Lane: the app's memory types, plus location and tags.
ALTER TABLE memory_lane ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE memory_lane ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE memory_lane ALTER COLUMN category SET DEFAULT 'moment';
ALTER TABLE memory_lane DROP CONSTRAINT IF EXISTS memory_lane_category_check;
ALTER TABLE memory_lane ADD CONSTRAINT memory_lane_category_check
  CHECK (category IN ('milestone', 'moment', 'date', 'achievement', 'other'));

-- Bucket List: the app's categories, free-text cost, target date, and archiving.
-- priority stays 1-5 (1 = highest); the app uses 1 high / 3 medium / 5 low.
ALTER TABLE bucket_list ADD COLUMN IF NOT EXISTS estimated_cost TEXT;
ALTER TABLE bucket_list ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE bucket_list DROP CONSTRAINT IF EXISTS bucket_list_category_check;
ALTER TABLE bucket_list ADD CONSTRAINT bucket_list_category_check
  CHECK (category IN ('travel', 'adventure', 'learning', 'family', 'romance', 'other'));
ALTER TABLE bucket_list DROP CONSTRAINT IF EXISTS bucket_list_status_check;
ALTER TABLE bucket_list ADD CONSTRAINT bucket_list_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'archived'));

CREATE INDEX IF NOT EXISTS idx_memory_lane_couple ON memory_lane(couple_unit_id, memory_date DESC);
CREATE INDEX IF NOT EXISTS idx_bucket_list_couple ON bucket_list(couple_unit_id);

DROP POLICY IF EXISTS p_memory_lane_select ON memory_lane;
CREATE POLICY p_memory_lane_select ON memory_lane
  FOR SELECT USING (is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_memory_lane_insert ON memory_lane;
CREATE POLICY p_memory_lane_insert ON memory_lane
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id AND is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_memory_lane_update ON memory_lane;
CREATE POLICY p_memory_lane_update ON memory_lane
  FOR UPDATE USING (is_couple_member(couple_unit_id)) WITH CHECK (is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_memory_lane_delete ON memory_lane;
CREATE POLICY p_memory_lane_delete ON memory_lane
  FOR DELETE USING (is_couple_member(couple_unit_id));

DROP POLICY IF EXISTS p_bucket_list_select ON bucket_list;
CREATE POLICY p_bucket_list_select ON bucket_list
  FOR SELECT USING (is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_bucket_list_insert ON bucket_list;
CREATE POLICY p_bucket_list_insert ON bucket_list
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id AND is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_bucket_list_update ON bucket_list;
CREATE POLICY p_bucket_list_update ON bucket_list
  FOR UPDATE USING (is_couple_member(couple_unit_id)) WITH CHECK (is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_bucket_list_delete ON bucket_list;
CREATE POLICY p_bucket_list_delete ON bucket_list
  FOR DELETE USING (is_couple_member(couple_unit_id));

-- Indexes for the per-user / per-couple lookups the app and backend run most.
CREATE INDEX IF NOT EXISTS idx_activity_completions_user ON activity_completions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_activity_completions_couple ON activity_completions(couple_unit_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- ============================================================
-- ONBOARDING ROW + STREAKS (migration 010)
-- ============================================================

INSERT INTO assessments (id, name, framework, description, estimated_time, questions_count, icon, category, scoring_mode)
VALUES (
  'onboarding-assessment',
  'Couple Onboarding',
  'BOND onboarding (needs-based recommendations)',
  'Start here to find the best assessments and learning series for where your relationship is right now.',
  '3 min',
  4,
  '🧭',
  'onboarding',
  'recommendation'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  estimated_time = EXCLUDED.estimated_time,
  questions_count = EXCLUDED.questions_count;

-- A couple's streak: consecutive days on which at least one partner checked in.
-- current_streak counts a run that ends today or yesterday (so it doesn't reset before
-- today's check-in). SECURITY INVOKER: it only sees check-ins the caller's RLS allows.
CREATE OR REPLACE FUNCTION get_couple_streak(cu_id UUID)
RETURNS TABLE (current_streak INTEGER, longest_streak INTEGER)
LANGUAGE sql STABLE SET search_path = public AS $$
  WITH days AS (
    SELECT DISTINCT date FROM daily_check_ins WHERE couple_unit_id = cu_id
  ),
  runs AS (
    SELECT max(date) AS end_date, count(*)::int AS len
    FROM (SELECT date, date - (ROW_NUMBER() OVER (ORDER BY date))::int AS grp FROM days) numbered
    GROUP BY grp
  )
  SELECT
    coalesce((SELECT len FROM runs WHERE end_date >= current_date - 1 ORDER BY end_date DESC LIMIT 1), 0),
    coalesce((SELECT max(len) FROM runs), 0)
$$;

REVOKE ALL ON FUNCTION get_couple_streak(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_couple_streak(UUID) TO authenticated;

-- ============================================================
-- CONTENT ARCHITECTURE (migration 011): editorial content
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
-- Couple-scoped progress for daily questions, check-in topics, deep dives
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

-- ============================================================
-- MEMORY LANE PHOTOS (migration 014): private bucket, couple-only access
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('memory-photos', 'memory-photos', FALSE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- The couple a photo belongs to = the first folder of its path; NULL when that isn't a UUID,
-- so a malformed path fails the policy instead of raising a cast error.
CREATE OR REPLACE FUNCTION public.memory_photo_couple(object_name TEXT)
RETURNS UUID
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN split_part(object_name, '/', 1) ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    THEN split_part(object_name, '/', 1)::uuid
  END
$$;
GRANT EXECUTE ON FUNCTION public.memory_photo_couple(TEXT) TO authenticated;

DROP POLICY IF EXISTS memory_photos_select ON storage.objects;
CREATE POLICY memory_photos_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'memory-photos' AND public.is_couple_member(public.memory_photo_couple(name)));

DROP POLICY IF EXISTS memory_photos_insert ON storage.objects;
CREATE POLICY memory_photos_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'memory-photos' AND public.is_couple_member(public.memory_photo_couple(name)));

DROP POLICY IF EXISTS memory_photos_delete ON storage.objects;
CREATE POLICY memory_photos_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'memory-photos' AND public.is_couple_member(public.memory_photo_couple(name)));

-- ============================================================
-- AI INSIGHTS (migration 016) — 1. INDIVIDUAL INSIGHTS (private to the person who took the assessment)
-- ============================================================
CREATE TABLE IF NOT EXISTS individual_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL UNIQUE REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  assessment_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
  content JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_individual_insights_user ON individual_insights(user_id, created_at DESC);
ALTER TABLE individual_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_individual_insights_select ON individual_insights;
CREATE POLICY p_individual_insights_select ON individual_insights
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
-- No insert/update/delete policies: only the backend (service role) writes insights.

-- ============================================================
-- 2. RELATIONSHIP SUMMARIES (one per couple per period, readable by both partners)
-- ============================================================
CREATE TABLE IF NOT EXISTS relationship_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_unit_id UUID NOT NULL REFERENCES couple_units(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
  content JSONB,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (couple_unit_id, period_start)
);
ALTER TABLE relationship_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_relationship_summaries_select ON relationship_summaries;
CREATE POLICY p_relationship_summaries_select ON relationship_summaries
  FOR SELECT USING (is_couple_member(couple_unit_id));

-- ============================================================
-- 3. COUPLE INSIGHTS on couple_results
-- ============================================================
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS ai_insight JSONB;
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS ai_status TEXT;
ALTER TABLE couple_results DROP CONSTRAINT IF EXISTS couple_results_ai_status_check;
ALTER TABLE couple_results ADD CONSTRAINT couple_results_ai_status_check
  CHECK (ai_status IS NULL OR ai_status IN ('pending', 'ready', 'failed'));
ALTER TABLE couple_results ADD COLUMN IF NOT EXISTS ai_updated_at TIMESTAMPTZ;

-- The app creates couple_results rows (both partners' scores, computed in the app), but the AI
-- columns belong to the backend: a signed-in client can neither set nor change them.
CREATE OR REPLACE FUNCTION protect_couple_result_ai()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT auth.role()) IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.ai_insight := NULL;
      NEW.ai_status := NULL;
      NEW.ai_updated_at := NULL;
      NEW.ai_narrative := NULL;
      NEW.ai_growth_recommendations := NULL;
      NEW.ai_strength_affirmation := NULL;
      NEW.ai_communication_scripts := NULL;
      NEW.framework_tags := NULL;
    ELSE
      NEW.ai_insight := OLD.ai_insight;
      NEW.ai_status := OLD.ai_status;
      NEW.ai_updated_at := OLD.ai_updated_at;
      NEW.ai_narrative := OLD.ai_narrative;
      NEW.ai_growth_recommendations := OLD.ai_growth_recommendations;
      NEW.ai_strength_affirmation := OLD.ai_strength_affirmation;
      NEW.ai_communication_scripts := OLD.ai_communication_scripts;
      NEW.framework_tags := OLD.framework_tags;
    END IF;
  END IF;
  RETURN NEW;
END
$$;
DROP TRIGGER IF EXISTS trg_protect_couple_result_ai ON couple_results;
CREATE TRIGGER trg_protect_couple_result_ai
  BEFORE INSERT OR UPDATE ON couple_results
  FOR EACH ROW EXECUTE FUNCTION protect_couple_result_ai();

-- ============================================================
-- 4. ANALYZER RESULTS: the full structured analysis (derived output only, never raw input)
-- ============================================================
ALTER TABLE communication_analyses ADD COLUMN IF NOT EXISTS result JSONB;
ALTER TABLE text_analyses ADD COLUMN IF NOT EXISTS result JSONB;
ALTER TABLE argument_analyses ADD COLUMN IF NOT EXISTS result JSONB;
ALTER TABLE emotional_pattern_analyses ADD COLUMN IF NOT EXISTS result JSONB;
CREATE INDEX IF NOT EXISTS idx_communication_analyses_couple ON communication_analyses(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_text_analyses_couple ON text_analyses(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_argument_analyses_couple ON argument_analyses(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotional_pattern_analyses_couple ON emotional_pattern_analyses(couple_id, created_at DESC);

GRANT SELECT ON individual_insights, relationship_summaries TO authenticated;
GRANT ALL ON individual_insights, relationship_summaries TO service_role;

-- ============================================================
-- ONBOARDING AI INSIGHTS (migration 019) — onboarding gets the same private/shared insight
-- pipeline as every other assessment, from a scored baseline sweep instead of a single result.
-- ============================================================
ALTER TABLE onboarding_assessments ADD COLUMN IF NOT EXISTS baseline_scores JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 1. Private, per-person insight on their onboarding baseline.
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

-- 2. Shared insight once both partners finish onboarding, one row per couple.
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

-- ============================================================
-- SOLO USE (migration 020): every user always has one active couple_units row.
-- Until they pair it is a "solo unit" (user2_id IS NULL), so every couple-scoped feature
-- (check-ins, deep dives, analyzers, memory lane, bucket list, progress) works for one person
-- with the existing tables and RLS. Pairing retires both partners' solo units and starts a
-- fresh shared one: nothing written while solo becomes visible to the partner.
-- ============================================================

-- The table has an updated_at trigger but never had the column, so any UPDATE failed.
ALTER TABLE couple_units ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_couple_units_one_active_solo
  ON couple_units(user1_id) WHERE user2_id IS NULL AND status = 'active';

-- Gives `uid` an active unit if they have none: their previous solo unit when there is one
-- (so solo data comes back after a couple is deactivated), otherwise a new one.
CREATE OR REPLACE FUNCTION ensure_solo_unit(uid UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF uid IS NULL OR NOT EXISTS (SELECT 1 FROM users WHERE id = uid) THEN
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM couple_units WHERE status = 'active' AND uid IN (user1_id, user2_id)) THEN
    RETURN;
  END IF;
  UPDATE couple_units SET status = 'active'
  WHERE id = (
    SELECT id FROM couple_units
    WHERE user1_id = uid AND user2_id IS NULL AND status = 'inactive'
    ORDER BY created_at DESC LIMIT 1
  );
  IF FOUND THEN
    RETURN;
  END IF;
  INSERT INTO couple_units (user1_id, status) VALUES (uid, 'active')
  ON CONFLICT DO NOTHING;
END
$$;
REVOKE ALL ON FUNCTION ensure_solo_unit(UUID) FROM PUBLIC, anon, authenticated;

-- Signup: profile row plus the solo unit.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  code TEXT := upper(coalesce(NEW.raw_user_meta_data->>'pair_code', ''));
BEGIN
  WHILE code !~ '^[A-Z0-9]{6}$' OR EXISTS (SELECT 1 FROM users WHERE pair_code = code) LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1);
    END LOOP;
  END LOOP;
  INSERT INTO users (id, email, name, pair_code)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', code)
  ON CONFLICT (id) DO NOTHING;
  PERFORM ensure_solo_unit(NEW.id);
  RETURN NEW;
END
$$;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO supabase_auth_admin;

-- Pairing: only a unit with two people counts as "already paired".
CREATE OR REPLACE FUNCTION pair_with_partner(partner_code TEXT)
RETURNS couple_units
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  partner users%ROWTYPE;
  result couple_units%ROWTYPE;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  SELECT * INTO partner FROM users WHERE pair_code = upper(replace(partner_code, '-', ''));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;
  IF partner.id = me THEN
    RAISE EXCEPTION 'self_pairing';
  END IF;
  IF EXISTS (SELECT 1 FROM couple_units
             WHERE status = 'active' AND user2_id IS NOT NULL AND me IN (user1_id, user2_id)) THEN
    RAISE EXCEPTION 'already_paired';
  END IF;
  IF EXISTS (SELECT 1 FROM couple_units
             WHERE status = 'active' AND user2_id IS NOT NULL AND partner.id IN (user1_id, user2_id)) THEN
    RAISE EXCEPTION 'partner_already_paired';
  END IF;
  UPDATE couple_units SET status = 'inactive'
  WHERE status = 'active' AND user2_id IS NULL AND user1_id IN (me, partner.id);
  INSERT INTO couple_units (user1_id, user2_id, status)
  VALUES (me, partner.id, 'active')
  RETURNING * INTO result;
  RETURN result;
END
$$;
REVOKE ALL ON FUNCTION pair_with_partner(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pair_with_partner(TEXT) TO authenticated;

-- A couple that stops being active (deactivated, or removed because one partner deleted their
-- account) hands each remaining partner their solo unit back.
CREATE OR REPLACE FUNCTION restore_solo_units()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'active' AND OLD.user2_id IS NOT NULL
     AND (TG_OP = 'DELETE' OR NEW.status IS DISTINCT FROM 'active') THEN
    PERFORM ensure_solo_unit(OLD.user1_id);
    PERFORM ensure_solo_unit(OLD.user2_id);
  END IF;
  RETURN NULL;
END
$$;
REVOKE ALL ON FUNCTION restore_solo_units() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS couple_units_restore_solo ON couple_units;
CREATE TRIGGER couple_units_restore_solo AFTER UPDATE OF status OR DELETE ON couple_units
  FOR EACH ROW EXECUTE FUNCTION restore_solo_units();

-- Existing users who aren't in an active unit.
SELECT ensure_solo_unit(id) FROM users;

-- ============================================================
-- INSTITUTIONAL CLINICIAN LAYER (migration 021): clinics link to existing couple_units through
-- clinic_couples, only after both partners consent. Clinicians see reflections an author marked
-- 'shared_with_clinician' and counts only; private_reflections is author-only; audit_logs is
-- append-only. Seat limits are enforced by trigger. See the migration file for the full notes.
-- ============================================================

-- ---- 021.1. TABLES

CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('private_practice', 'clinical_group', 'treatment_center', 'enterprise')),
  -- Seats included in the tier. Fixed for the scheduled tiers (must match TIERS in
  -- clinician-web/lib/institutional.ts); set by contract for enterprise.
  base_seat_limit INTEGER NOT NULL CHECK (base_seat_limit > 0),
  -- Purchased overage seats on top of the tier's base.
  extra_seats INTEGER NOT NULL DEFAULT 0 CHECK (extra_seats >= 0),
  billing_cycle TEXT NOT NULL DEFAULT 'annual' CHECK (billing_cycle IN ('monthly', 'annual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clinics_tier_base_seats CHECK (
    tier = 'enterprise'
    OR base_seat_limit = CASE tier
      WHEN 'private_practice' THEN 10
      WHEN 'clinical_group' THEN 50
      WHEN 'treatment_center' THEN 150
    END
  )
);

CREATE TABLE IF NOT EXISTS clinicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'clinician' CHECK (role IN ('admin', 'clinician')),
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clinic_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_clinicians_user ON clinicians(user_id);

CREATE TABLE IF NOT EXISTS clinic_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES clinicians(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  -- sha256 hex of the invite token; the token itself is only ever in the invite link.
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clinic_invitations_clinic ON clinic_invitations(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_clinic_invitations_invited_by ON clinic_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_clinic_invitations_accepted_by ON clinic_invitations(accepted_by);

CREATE TABLE IF NOT EXISTS clinic_couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  couple_unit_id UUID NOT NULL REFERENCES couple_units(id) ON DELETE CASCADE,
  primary_clinician_id UUID REFERENCES clinicians(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'archived')),
  -- Consent is per partner (couple_units.user1_id / user2_id); both are needed to go active.
  user1_consented_at TIMESTAMPTZ,
  user2_consented_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clinic_id, couple_unit_id),
  CONSTRAINT clinic_couples_active_needs_consent CHECK (
    status <> 'active' OR (user1_consented_at IS NOT NULL AND user2_consented_at IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_clinic_couples_couple ON clinic_couples(couple_unit_id);
CREATE INDEX IF NOT EXISTS idx_clinic_couples_seats ON clinic_couples(clinic_id, status, last_active_at);
CREATE INDEX IF NOT EXISTS idx_clinic_couples_primary ON clinic_couples(primary_clinician_id);

-- Strictly private to the author. Encrypted on the client before upload.
-- TODO(key-management): no key scheme exists yet; this table only stores ciphertext and nothing
-- writes to it until one is designed.
CREATE TABLE IF NOT EXISTS private_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_unit_id UUID NOT NULL REFERENCES couple_units(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_private_reflections_author ON private_reflections(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_reflections_couple ON private_reflections(couple_unit_id);

CREATE TABLE IF NOT EXISTS shared_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_unit_id UUID NOT NULL REFERENCES couple_units(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  exercise_title TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'shared_with_partner', 'shared_with_clinician')),
  clinician_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shared_reflections_couple ON shared_reflections(couple_unit_id, status, synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_reflections_author ON shared_reflections(author_id);
CREATE INDEX IF NOT EXISTS idx_shared_reflections_activity ON shared_reflections(activity_id);

-- Append-only. clinic_id is RESTRICT so deleting a clinic can't erase its trail. actor_id and
-- subject_couple_unit_id deliberately have no FK: a user or couple being deleted must neither
-- be blocked by nor rewrite the audit history.
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  actor_id UUID,
  subject_couple_unit_id UUID,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic ON audit_logs(clinic_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_subject ON audit_logs(subject_couple_unit_id, occurred_at DESC);

-- ---- 021.2. MEMBERSHIP HELPERS (SECURITY DEFINER so policies don't recurse through RLS)

CREATE OR REPLACE FUNCTION is_clinic_member(p_clinic_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM clinicians WHERE clinic_id = p_clinic_id AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION is_clinic_admin(p_clinic_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM clinicians WHERE clinic_id = p_clinic_id AND user_id = auth.uid() AND role = 'admin'
  )
$$;

-- True when the caller is an admin of, or the primary clinician for, a clinic that has an
-- active (both partners consented) link to this couple.
CREATE OR REPLACE FUNCTION clinician_can_view_couple(p_couple_unit_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM clinic_couples cc
    JOIN clinicians c ON c.clinic_id = cc.clinic_id AND c.user_id = auth.uid()
    WHERE cc.couple_unit_id = p_couple_unit_id
      AND cc.status = 'active'
      AND (c.role = 'admin' OR cc.primary_clinician_id = c.id)
  )
$$;

CREATE OR REPLACE FUNCTION is_clinic_linked_couple_member(p_clinic_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM clinic_couples cc
    WHERE cc.clinic_id = p_clinic_id AND is_couple_member(cc.couple_unit_id)
  )
$$;

-- ---- 021.3. SEATS — enforced in the database; the app's check is only a pre-check for the UI.
-- A seat is a clinic_couples row with status 'active' and activity in the last 30 days.

CREATE OR REPLACE FUNCTION clinic_active_seat_count_unchecked(p_clinic_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM clinic_couples
  WHERE clinic_id = p_clinic_id
    AND status = 'active'
    AND last_active_at >= NOW() - INTERVAL '30 days'
$$;

-- For clinic members (and the service role): seats in use and the clinic's limit.
CREATE OR REPLACE FUNCTION clinic_active_seat_count(p_clinic_id UUID)
RETURNS TABLE (used INTEGER, seat_limit INTEGER)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_clinic_member(p_clinic_id) AND coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'not_clinic_member' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT clinic_active_seat_count_unchecked(p_clinic_id), cl.base_seat_limit + cl.extra_seats
    FROM clinics cl WHERE cl.id = p_clinic_id;
END
$$;

-- Moving a link to 'active' (insert or status change) takes the clinic row lock so two
-- concurrent activations can't both squeeze into the last seat. Activity-driven
-- last_active_at updates never run this check, so a couple's own activity is never blocked.
CREATE OR REPLACE FUNCTION enforce_clinic_seat_limit()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  seat_cap INTEGER;
  in_use INTEGER;
BEGIN
  IF NEW.status <> 'active' OR (TG_OP = 'UPDATE' AND OLD.status = 'active') THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM couple_units WHERE id = NEW.couple_unit_id AND user2_id IS NULL) THEN
    RAISE EXCEPTION 'couple_not_paired' USING ERRCODE = 'P0001';
  END IF;
  SELECT base_seat_limit + extra_seats INTO seat_cap FROM clinics WHERE id = NEW.clinic_id FOR UPDATE;
  SELECT count(*) INTO in_use FROM clinic_couples
  WHERE clinic_id = NEW.clinic_id
    AND id <> NEW.id
    AND status = 'active'
    AND last_active_at >= NOW() - INTERVAL '30 days';
  IF in_use >= seat_cap THEN
    RAISE EXCEPTION 'seat_limit_reached' USING ERRCODE = 'P0001',
      DETAIL = format('%s of %s active seats in use', in_use, seat_cap);
  END IF;
  NEW.last_active_at := NOW();
  RETURN NEW;
END
$$;
DROP TRIGGER IF EXISTS clinic_couples_seat_limit ON clinic_couples;
CREATE TRIGGER clinic_couples_seat_limit BEFORE INSERT OR UPDATE OF status ON clinic_couples
  FOR EACH ROW EXECUTE FUNCTION enforce_clinic_seat_limit();

-- Keep clinic_couples.last_active_at current from the couple's activity.
-- daily_question_responses has no couple_unit_id, so it resolves the author's active couple.
CREATE OR REPLACE FUNCTION touch_clinic_couple_activity()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cu UUID;
BEGIN
  IF TG_TABLE_NAME = 'daily_question_responses' THEN
    SELECT id INTO cu FROM couple_units
    WHERE status = 'active' AND user2_id IS NOT NULL AND NEW.user_id IN (user1_id, user2_id)
    LIMIT 1;
  ELSE
    cu := NEW.couple_unit_id;
  END IF;
  IF cu IS NOT NULL THEN
    UPDATE clinic_couples SET last_active_at = NOW()
    WHERE couple_unit_id = cu AND status <> 'archived';
  END IF;
  RETURN NULL;
END
$$;
DROP TRIGGER IF EXISTS activity_completions_touch_clinic ON activity_completions;
CREATE TRIGGER activity_completions_touch_clinic AFTER INSERT ON activity_completions
  FOR EACH ROW EXECUTE FUNCTION touch_clinic_couple_activity();
DROP TRIGGER IF EXISTS daily_check_ins_touch_clinic ON daily_check_ins;
CREATE TRIGGER daily_check_ins_touch_clinic AFTER INSERT ON daily_check_ins
  FOR EACH ROW EXECUTE FUNCTION touch_clinic_couple_activity();
DROP TRIGGER IF EXISTS daily_question_responses_touch_clinic ON daily_question_responses;
CREATE TRIGGER daily_question_responses_touch_clinic AFTER INSERT ON daily_question_responses
  FOR EACH ROW EXECUTE FUNCTION touch_clinic_couple_activity();

-- ---- 021.4. AUDIT TRAIL IMMUTABILITY

CREATE OR REPLACE FUNCTION reject_audit_log_change()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only' USING ERRCODE = '42501';
END
$$;
DROP TRIGGER IF EXISTS audit_logs_append_only ON audit_logs;
CREATE TRIGGER audit_logs_append_only BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION reject_audit_log_change();
DROP TRIGGER IF EXISTS audit_logs_no_truncate ON audit_logs;
CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_log_change();

-- ---- 021.5. ROW-LEVEL SECURITY

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_reflections FORCE ROW LEVEL SECURITY;
ALTER TABLE shared_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_clinics_select ON clinics;
CREATE POLICY p_clinics_select ON clinics FOR SELECT
  USING (is_clinic_member(id) OR is_clinic_linked_couple_member(id));

DROP POLICY IF EXISTS p_clinicians_select ON clinicians;
CREATE POLICY p_clinicians_select ON clinicians FOR SELECT
  USING (is_clinic_member(clinic_id));

DROP POLICY IF EXISTS p_clinic_invitations_select ON clinic_invitations;
CREATE POLICY p_clinic_invitations_select ON clinic_invitations FOR SELECT
  USING (is_clinic_member(clinic_id));

DROP POLICY IF EXISTS p_clinic_couples_select ON clinic_couples;
CREATE POLICY p_clinic_couples_select ON clinic_couples FOR SELECT
  USING (is_clinic_member(clinic_id) OR is_couple_member(couple_unit_id));
-- No insert/update/delete policies on clinic tables: writes go through the functions below.

-- private_reflections: the author, and only the author. No other policy may reference it.
DROP POLICY IF EXISTS p_private_reflections_select ON private_reflections;
CREATE POLICY p_private_reflections_select ON private_reflections FOR SELECT
  USING ((SELECT auth.uid()) = author_id);
DROP POLICY IF EXISTS p_private_reflections_insert ON private_reflections;
CREATE POLICY p_private_reflections_insert ON private_reflections FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = author_id AND is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_private_reflections_update ON private_reflections;
CREATE POLICY p_private_reflections_update ON private_reflections FOR UPDATE
  USING ((SELECT auth.uid()) = author_id)
  WITH CHECK ((SELECT auth.uid()) = author_id AND is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_private_reflections_delete ON private_reflections;
CREATE POLICY p_private_reflections_delete ON private_reflections FOR DELETE
  USING ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS p_shared_reflections_author_select ON shared_reflections;
CREATE POLICY p_shared_reflections_author_select ON shared_reflections FOR SELECT
  USING ((SELECT auth.uid()) = author_id);
DROP POLICY IF EXISTS p_shared_reflections_partner_select ON shared_reflections;
CREATE POLICY p_shared_reflections_partner_select ON shared_reflections FOR SELECT
  USING (status IN ('shared_with_partner', 'shared_with_clinician') AND is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_shared_reflections_clinician_select ON shared_reflections;
CREATE POLICY p_shared_reflections_clinician_select ON shared_reflections FOR SELECT
  USING (status = 'shared_with_clinician' AND clinician_can_view_couple(couple_unit_id));
DROP POLICY IF EXISTS p_shared_reflections_insert ON shared_reflections;
CREATE POLICY p_shared_reflections_insert ON shared_reflections FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = author_id AND is_couple_member(couple_unit_id) AND clinician_read_at IS NULL);
DROP POLICY IF EXISTS p_shared_reflections_update ON shared_reflections;
CREATE POLICY p_shared_reflections_update ON shared_reflections FOR UPDATE
  USING ((SELECT auth.uid()) = author_id)
  WITH CHECK ((SELECT auth.uid()) = author_id AND is_couple_member(couple_unit_id));
DROP POLICY IF EXISTS p_shared_reflections_delete ON shared_reflections;
CREATE POLICY p_shared_reflections_delete ON shared_reflections FOR DELETE
  USING ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS p_audit_logs_admin_select ON audit_logs;
CREATE POLICY p_audit_logs_admin_select ON audit_logs FOR SELECT
  USING (is_clinic_admin(clinic_id));
-- No INSERT policy for authenticated (only the service role writes); no UPDATE/DELETE ever.

-- ---- 021.6. FUNCTIONS THE APPS CALL

-- Clinician side: create an invitation. The caller passes the sha256 hex of a token it
-- generated; the seat check is a pre-check (the trigger is the real guard at activation).
CREATE OR REPLACE FUNCTION create_clinic_invitation(p_clinic_id UUID, p_email TEXT, p_token_hash TEXT)
RETURNS clinic_invitations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me clinicians%ROWTYPE;
  seat_cap INTEGER;
  result clinic_invitations%ROWTYPE;
BEGIN
  SELECT * INTO me FROM clinicians WHERE clinic_id = p_clinic_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_clinic_member' USING ERRCODE = '42501';
  END IF;
  IF p_email IS NULL OR p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid_token_hash';
  END IF;
  SELECT base_seat_limit + extra_seats INTO seat_cap FROM clinics WHERE id = p_clinic_id;
  IF clinic_active_seat_count_unchecked(p_clinic_id) >= seat_cap THEN
    RAISE EXCEPTION 'seat_limit_reached' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO clinic_invitations (clinic_id, invited_by, email, token_hash, expires_at)
  VALUES (p_clinic_id, me.id, lower(trim(p_email)), p_token_hash, NOW() + INTERVAL '14 days')
  RETURNING * INTO result;
  RETURN result;
END
$$;

-- Records the caller's consent and activates the link once both partners have consented and a
-- seat is free. With no free seat the link stays 'pending' with both consents recorded.
CREATE OR REPLACE FUNCTION record_clinic_consent(p_clinic_couple_id UUID)
RETURNS clinic_couples
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  link clinic_couples%ROWTYPE;
  unit couple_units%ROWTYPE;
BEGIN
  SELECT * INTO link FROM clinic_couples WHERE id = p_clinic_couple_id FOR UPDATE;
  IF NOT FOUND OR link.status = 'archived' THEN
    RAISE EXCEPTION 'link_not_found';
  END IF;
  SELECT * INTO unit FROM couple_units WHERE id = link.couple_unit_id;
  IF me IS NULL OR me NOT IN (unit.user1_id, unit.user2_id) THEN
    RAISE EXCEPTION 'not_couple_member' USING ERRCODE = '42501';
  END IF;
  UPDATE clinic_couples SET
    user1_consented_at = CASE WHEN me = unit.user1_id THEN coalesce(user1_consented_at, NOW()) ELSE user1_consented_at END,
    user2_consented_at = CASE WHEN me = unit.user2_id THEN coalesce(user2_consented_at, NOW()) ELSE user2_consented_at END
  WHERE id = link.id
  RETURNING * INTO link;
  IF link.status = 'pending' AND link.user1_consented_at IS NOT NULL AND link.user2_consented_at IS NOT NULL THEN
    BEGIN
      UPDATE clinic_couples SET status = 'active' WHERE id = link.id RETURNING * INTO link;
    EXCEPTION WHEN raise_exception THEN
      IF SQLERRM <> 'seat_limit_reached' THEN
        RAISE;
      END IF;
    END;
  END IF;
  RETURN link;
END
$$;

-- Couple side: accept an invitation for the caller's active paired couple. The invite must be
-- addressed to the caller's email. Records the caller's consent; the partner still has to
-- call record_clinic_consent.
CREATE OR REPLACE FUNCTION accept_clinic_invitation(p_token TEXT)
RETURNS clinic_couples
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  invite clinic_invitations%ROWTYPE;
  unit couple_units%ROWTYPE;
  link clinic_couples%ROWTYPE;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  SELECT * INTO invite FROM clinic_invitations
  WHERE token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
  FOR UPDATE;
  IF NOT FOUND OR invite.status <> 'pending' THEN
    RAISE EXCEPTION 'invalid_invitation';
  END IF;
  IF invite.expires_at < NOW() THEN
    RAISE EXCEPTION 'invalid_invitation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = me AND lower(email) = invite.email) THEN
    RAISE EXCEPTION 'invitation_email_mismatch';
  END IF;
  SELECT * INTO unit FROM couple_units
  WHERE status = 'active' AND user2_id IS NOT NULL AND me IN (user1_id, user2_id);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'couple_not_paired';
  END IF;
  INSERT INTO clinic_couples (clinic_id, couple_unit_id, primary_clinician_id)
  VALUES (invite.clinic_id, unit.id, invite.invited_by)
  ON CONFLICT (clinic_id, couple_unit_id) DO UPDATE
    SET status = CASE WHEN clinic_couples.status = 'archived' THEN 'pending' ELSE clinic_couples.status END,
        primary_clinician_id = coalesce(clinic_couples.primary_clinician_id, EXCLUDED.primary_clinician_id)
  RETURNING * INTO link;
  UPDATE clinic_invitations SET status = 'accepted', accepted_by = me, accepted_at = NOW() WHERE id = invite.id;
  RETURN record_clinic_consent(link.id);
END
$$;

-- Either partner can withdraw at any time: the link is archived and both consents cleared,
-- which immediately removes clinician access (clinician_can_view_couple needs 'active').
CREATE OR REPLACE FUNCTION revoke_clinic_consent(p_clinic_couple_id UUID)
RETURNS clinic_couples
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  link clinic_couples%ROWTYPE;
BEGIN
  SELECT * INTO link FROM clinic_couples WHERE id = p_clinic_couple_id;
  IF NOT FOUND OR NOT is_couple_member(link.couple_unit_id) THEN
    RAISE EXCEPTION 'not_couple_member' USING ERRCODE = '42501';
  END IF;
  UPDATE clinic_couples
  SET status = 'archived', user1_consented_at = NULL, user2_consented_at = NULL
  WHERE id = link.id
  RETURNING * INTO link;
  RETURN link;
END
$$;

-- Clinician side: mark a couple's clinician-shared reflections as read. Only touches
-- clinician_read_at; clinicians have no UPDATE policy on shared_reflections.
CREATE OR REPLACE FUNCTION mark_shared_reflections_read(p_couple_unit_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  n INTEGER;
BEGIN
  IF NOT clinician_can_view_couple(p_couple_unit_id) THEN
    RAISE EXCEPTION 'not_permitted' USING ERRCODE = '42501';
  END IF;
  UPDATE shared_reflections SET clinician_read_at = NOW()
  WHERE couple_unit_id = p_couple_unit_id
    AND status = 'shared_with_clinician'
    AND clinician_read_at IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END
$$;

-- Roster for the dashboard. Admins see every link in the clinic; clinicians see the couples
-- they are primary for. Partner names are returned only once a link is active (consented).
CREATE OR REPLACE FUNCTION clinic_roster(p_clinic_id UUID)
RETURNS TABLE (
  clinic_couple_id UUID,
  couple_unit_id UUID,
  status TEXT,
  last_active_at TIMESTAMPTZ,
  partner_names TEXT[],
  primary_clinician_name TEXT,
  unread_shared_reflections INTEGER
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me clinicians%ROWTYPE;
BEGIN
  SELECT * INTO me FROM clinicians WHERE clinic_id = p_clinic_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_clinic_member' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT cc.id, cc.couple_unit_id, cc.status, cc.last_active_at,
           CASE WHEN cc.status = 'active'
                THEN ARRAY[coalesce(u1.name, 'Partner'), coalesce(u2.name, 'Partner')]
                ELSE NULL END,
           pc.full_name,
           CASE WHEN cc.status = 'active' THEN (
             SELECT count(*)::int FROM shared_reflections sr
             WHERE sr.couple_unit_id = cc.couple_unit_id
               AND sr.status = 'shared_with_clinician'
               AND sr.clinician_read_at IS NULL
           ) ELSE 0 END
    FROM clinic_couples cc
    JOIN couple_units cu ON cu.id = cc.couple_unit_id
    LEFT JOIN users u1 ON u1.id = cu.user1_id
    LEFT JOIN users u2 ON u2.id = cu.user2_id
    LEFT JOIN clinicians pc ON pc.id = cc.primary_clinician_id
    WHERE cc.clinic_id = p_clinic_id
      AND (me.role = 'admin' OR cc.primary_clinician_id = me.id)
    ORDER BY (cc.status = 'active') DESC, cc.last_active_at DESC;
END
$$;

-- Weekly exercise completions for one couple, by activity category, since consent.
-- Counts only. gottman_informed marks activities whose framework cites the Gottman Method;
-- it is a content tag, not a clinical measure.
CREATE OR REPLACE FUNCTION couple_exercise_completions(p_couple_unit_id UUID, p_weeks INTEGER DEFAULT 8)
RETURNS TABLE (week_start DATE, category TEXT, gottman_informed BOOLEAN, completions INTEGER)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  since TIMESTAMPTZ;
BEGIN
  IF NOT clinician_can_view_couple(p_couple_unit_id) THEN
    RAISE EXCEPTION 'not_permitted' USING ERRCODE = '42501';
  END IF;
  SELECT greatest(max(greatest(user1_consented_at, user2_consented_at)),
                  date_trunc('week', NOW()) - make_interval(weeks => greatest(least(p_weeks, 52), 1) - 1))
  INTO since
  FROM clinic_couples WHERE couple_unit_id = p_couple_unit_id AND status = 'active';
  RETURN QUERY
    SELECT date_trunc('week', ac.completed_at)::date,
           coalesce(a.category, 'other'),
           coalesce(a.framework ILIKE 'Gottman%', false),
           count(*)::int
    FROM activity_completions ac
    JOIN activities a ON a.id = ac.activity_id
    WHERE ac.couple_unit_id = p_couple_unit_id AND ac.completed_at >= since
    GROUP BY 1, 2, 3
    ORDER BY 1, 2;
END
$$;

-- Daily connection signals for one couple over the last p_days (max 90), since consent:
-- check-in count, mean check-in connection rating (1-5), and daily-question answer count.
-- No notes or answer text.
CREATE OR REPLACE FUNCTION couple_daily_connection(p_couple_unit_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (day DATE, check_ins INTEGER, avg_connection NUMERIC, daily_answers INTEGER)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  since DATE;
  partners UUID[];
BEGIN
  IF NOT clinician_can_view_couple(p_couple_unit_id) THEN
    RAISE EXCEPTION 'not_permitted' USING ERRCODE = '42501';
  END IF;
  SELECT greatest(max(greatest(user1_consented_at, user2_consented_at))::date,
                  CURRENT_DATE - (greatest(least(p_days, 90), 1) - 1))
  INTO since
  FROM clinic_couples WHERE couple_unit_id = p_couple_unit_id AND status = 'active';
  SELECT ARRAY[user1_id, user2_id] INTO partners FROM couple_units WHERE id = p_couple_unit_id;
  RETURN QUERY
    SELECT d::date,
           (SELECT count(*)::int FROM daily_check_ins c
             WHERE c.couple_unit_id = p_couple_unit_id AND c.date = d::date),
           (SELECT round(avg(c.connection), 2) FROM daily_check_ins c
             WHERE c.couple_unit_id = p_couple_unit_id AND c.date = d::date),
           (SELECT count(*)::int FROM daily_question_responses r
             WHERE r.user_id = ANY (partners) AND r.response_date = d::date)
    FROM generate_series(since, CURRENT_DATE, INTERVAL '1 day') AS d;
END
$$;

-- Overview metrics for the dashboard, scoped like clinic_roster (admin: whole clinic,
-- clinician: their couples). "Connection activities" are completions of activities in the
-- 'connection' category since Monday.
CREATE OR REPLACE FUNCTION clinic_dashboard_metrics(p_clinic_id UUID)
RETURNS TABLE (active_couples INTEGER, connection_activities_this_week INTEGER, unread_shared_reflections INTEGER)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me clinicians%ROWTYPE;
BEGIN
  SELECT * INTO me FROM clinicians WHERE clinic_id = p_clinic_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_clinic_member' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    WITH mine AS (
      SELECT cc.couple_unit_id,
             greatest(cc.user1_consented_at, cc.user2_consented_at) AS consented
      FROM clinic_couples cc
      WHERE cc.clinic_id = p_clinic_id AND cc.status = 'active'
        AND (me.role = 'admin' OR cc.primary_clinician_id = me.id)
    )
    SELECT
      (SELECT count(*)::int FROM mine),
      (SELECT count(*)::int FROM activity_completions ac
         JOIN mine m ON m.couple_unit_id = ac.couple_unit_id
         JOIN activities a ON a.id = ac.activity_id
        WHERE a.category = 'connection'
          AND ac.completed_at >= greatest(date_trunc('week', NOW()), m.consented)),
      (SELECT count(*)::int FROM shared_reflections sr
         JOIN mine m ON m.couple_unit_id = sr.couple_unit_id
        WHERE sr.status = 'shared_with_clinician' AND sr.clinician_read_at IS NULL);
END
$$;

-- ---- 021.7. GRANTS — per table, least privilege. Supabase grants ALL on new public tables and
-- functions to anon/authenticated/service_role by default, so revoke first.

REVOKE ALL ON clinics, clinicians, clinic_invitations, clinic_couples,
              private_reflections, shared_reflections, audit_logs
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON clinics, clinicians, clinic_invitations, clinic_couples TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON private_reflections, shared_reflections TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON clinics, clinicians, clinic_invitations, clinic_couples TO service_role;
GRANT SELECT, INSERT ON audit_logs TO service_role;

REVOKE ALL ON FUNCTION is_clinic_member(UUID), is_clinic_admin(UUID), clinician_can_view_couple(UUID),
  is_clinic_linked_couple_member(UUID), clinic_active_seat_count(UUID),
  create_clinic_invitation(UUID, TEXT, TEXT), record_clinic_consent(UUID), accept_clinic_invitation(TEXT),
  revoke_clinic_consent(UUID), mark_shared_reflections_read(UUID), clinic_roster(UUID),
  couple_exercise_completions(UUID, INTEGER), couple_daily_connection(UUID, INTEGER),
  clinic_dashboard_metrics(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_clinic_member(UUID), is_clinic_admin(UUID), clinician_can_view_couple(UUID),
  is_clinic_linked_couple_member(UUID), clinic_active_seat_count(UUID),
  create_clinic_invitation(UUID, TEXT, TEXT), record_clinic_consent(UUID), accept_clinic_invitation(TEXT),
  revoke_clinic_consent(UUID), mark_shared_reflections_read(UUID), clinic_roster(UUID),
  couple_exercise_completions(UUID, INTEGER), couple_daily_connection(UUID, INTEGER),
  clinic_dashboard_metrics(UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION clinic_active_seat_count(UUID) TO service_role;

-- Internal only: called from triggers and other SECURITY DEFINER functions.
REVOKE ALL ON FUNCTION clinic_active_seat_count_unchecked(UUID), enforce_clinic_seat_limit(),
  touch_clinic_couple_activity(), reject_audit_log_change()
  FROM PUBLIC, anon, authenticated, service_role;
