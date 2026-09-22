-- 008: bring the live database in line with supabase/bond_schema.sql.
--
-- The live project was built from an older bond_schema.sql. This adds what the
-- current app and backend depend on:
--   * analyzer result tables + status_checks (in bond_schema.sql, never applied live)
--   * couple Premium (get_couple_subscription), messaging + Realtime, activity
--     completion columns, assessment_sessions, Stripe correlation columns, push tokens
--   * signup trigger, private users table, server-side pairing, paired-results gate,
--     check-in columns and policies
--   * table privileges for anon/authenticated/service_role (live had none at all)
-- Every statement is sections copied verbatim from bond_schema.sql, in order.
-- Safe to re-run except the analyzer/status_checks CREATE POLICY lines, which assume
-- those tables are new.

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
GRANT SELECT ON activities, assessments, assessment_dimensions, assessment_bands,
  assessment_questions, assessment_couple_rules, assessment_couple_dimension_rules,
  couple_relationship_patterns, assessment_couple_pattern_rules,
  onboarding_assessment_recommendation_rules, onboarding_assessment_patterns,
  onboarding_assessment_dimensions, learning_series, learning_series_modules,
  check_in_topics TO anon;

-- Tables created later in this schema get the same privileges automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
