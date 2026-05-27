-- BOND App Missing Features Migration
-- Run this after schema.sql and schema_phase2.sql
-- Adds: AI analysis tables, Memory Lane, Bucket List, Daily Questions, Check-in Topics, Monthly Deep Dive

-- =============================================
-- 1. COMMUNICATION_ANALYSIS
-- =============================================
CREATE TABLE IF NOT EXISTS communication_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  analysis_date TIMESTAMPTZ,
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 100),
  response_time_score INTEGER CHECK (response_time_score >= 1 AND response_time_score <= 100),
  listening_score INTEGER CHECK (listening_score >= 1 AND listening_score <= 100),
  tone_consistency_score INTEGER CHECK (tone_consistency_score >= 1 AND tone_consistency_score <= 100),
  strengths TEXT[],
  areas_for_growth TEXT[],
  recommendations TEXT[],
  sample_interaction_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE communication_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY communication_analysis_select ON communication_analysis
  FOR SELECT USING (
    auth.uid()::uuid = user_id OR
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY communication_analysis_insert ON communication_analysis
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY communication_analysis_update ON communication_analysis
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY communication_analysis_delete ON communication_analysis
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- =============================================
-- 2. TEXT_MESSAGE_ANALYSIS
-- =============================================
CREATE TABLE IF NOT EXISTS text_message_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
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

ALTER TABLE text_message_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY text_message_analysis_select ON text_message_analysis
  FOR SELECT USING (
    auth.uid()::uuid = user_id OR
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY text_message_analysis_insert ON text_message_analysis
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY text_message_analysis_update ON text_message_analysis
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY text_message_analysis_delete ON text_message_analysis
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- =============================================
-- 3. ARGUMENT_ANALYSIS
-- =============================================
CREATE TABLE IF NOT EXISTS argument_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  analysis_date TIMESTAMPTZ,
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 100),
  de_escalation_score INTEGER CHECK (de_escalation_score >= 1 AND de_escalation_score <= 100),
  constructive_dialogue_score INTEGER CHECK (constructive_dialogue_score >= 1 AND constructive_dialogue_score <= 100),
  resolution_quality_score INTEGER CHECK (resolution_quality_score >= 1 AND resolution_quality_score <= 100),
  resolution_outcome TEXT CHECK (resolution_outcome IN ('resolved', 'ongoing', 'escalated', 'stalled')),
  topic_category TEXT,
  what_worked_well TEXT[],
  areas_for_improvement TEXT[],
  strategies_recommended TEXT[],
  related_argument_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE argument_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY argument_analysis_select ON argument_analysis
  FOR SELECT USING (
    auth.uid()::uuid = user_id OR
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY argument_analysis_insert ON argument_analysis
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY argument_analysis_update ON argument_analysis
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY argument_analysis_delete ON argument_analysis
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- =============================================
-- 4. VOICE_TONE_ANALYSIS
-- =============================================
CREATE TABLE IF NOT EXISTS voice_tone_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  analysis_date TIMESTAMPTZ,
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 100),
  warmth_score INTEGER CHECK (warmth_score >= 1 AND warmth_score <= 100),
  calm_score INTEGER CHECK (calm_score >= 1 AND calm_score <= 100),
  assertiveness_score INTEGER CHECK (assertiveness_score >= 1 AND assertiveness_score <= 100),
  emotional_regulation_score INTEGER CHECK (emotional_regulation_score >= 1 AND emotional_regulation_score <= 100),
  dominant_tones TEXT[],
  tone_variety_score INTEGER CHECK (tone_variety_score >= 1 AND tone_variety_score <= 100),
  observations TEXT[],
  recommendations TEXT[],
  sample_interaction_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE voice_tone_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY voice_tone_analysis_select ON voice_tone_analysis
  FOR SELECT USING (
    auth.uid()::uuid = user_id OR
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY voice_tone_analysis_insert ON voice_tone_analysis
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY voice_tone_analysis_update ON voice_tone_analysis
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY voice_tone_analysis_delete ON voice_tone_analysis
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- =============================================
-- 5. EMOTIONAL_PATTERN_ANALYSIS
-- =============================================
CREATE TABLE IF NOT EXISTS emotional_pattern_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  analysis_date TIMESTAMPTZ,
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 100),
  emotional_awareness_score INTEGER CHECK (emotional_awareness_score >= 1 AND emotional_awareness_score <= 100),
  empathy_score INTEGER CHECK (empathy_score >= 1 AND empathy_score <= 100),
  emotional_regulation_score INTEGER CHECK (emotional_regulation_score >= 1 AND emotional_regulation_score <= 100),
  stress_response_score INTEGER CHECK (stress_response_score >= 1 AND stress_response_score <= 100),
  dominant_emotions TEXT[],
  emotional_triggers TEXT[],
  patterns_detected TEXT[],
  growth_areas TEXT[],
  coping_strategies TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE emotional_pattern_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY emotional_pattern_analysis_select ON emotional_pattern_analysis
  FOR SELECT USING (
    auth.uid()::uuid = user_id OR
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY emotional_pattern_analysis_insert ON emotional_pattern_analysis
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY emotional_pattern_analysis_update ON emotional_pattern_analysis
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY emotional_pattern_analysis_delete ON emotional_pattern_analysis
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- =============================================
-- 6. MEMORY_LANE
-- =============================================
CREATE TABLE IF NOT EXISTS memory_lane (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_date DATE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('firsts', 'milestones', 'adventures', 'daily_moments', 'challenges', 'celebrations', 'travel', 'other')),
  media_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE memory_lane ENABLE ROW LEVEL SECURITY;

CREATE POLICY memory_lane_select ON memory_lane
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY memory_lane_insert ON memory_lane
  FOR INSERT WITH CHECK (
    auth.uid()::uuid = user_id AND
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY memory_lane_update ON memory_lane
  FOR UPDATE USING (
    auth.uid()::uuid = user_id OR
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY memory_lane_delete ON memory_lane
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- =============================================
-- 7. BUCKET_LIST
-- =============================================
CREATE TABLE IF NOT EXISTS bucket_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('travel', 'adventure', 'food', 'creative', 'learning', 'outdoor', 'cultural', 'give_back', 'relaxation', 'other')),
  priority INTEGER CHECK (priority >= 1 AND priority <= 5),
  estimated_cost_range TEXT CHECK (estimated_cost_range IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bucket_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY bucket_list_select ON bucket_list
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY bucket_list_insert ON bucket_list
  FOR INSERT WITH CHECK (
    auth.uid()::uuid = user_id AND
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY bucket_list_update ON bucket_list
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY bucket_list_delete ON bucket_list
  FOR DELETE USING (
    auth.uid()::uuid = user_id OR
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

-- =============================================
-- 8. DAILY_QUESTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  category TEXT CHECK (category IN ('values', 'goals', 'dreams', 'childhood', 'hypothetical', 'fun', 'deeper', 'gratitude', 'communication', 'intimacy')),
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 3),
  partner_question TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE daily_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_questions_select ON daily_questions
  FOR SELECT USING (true);

-- =============================================
-- 9. DAILY_QUESTION_RESPONSES
-- =============================================
CREATE TABLE IF NOT EXISTS daily_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  question_id UUID REFERENCES daily_questions(id) ON DELETE CASCADE,
  response_text TEXT,
  question_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE daily_question_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_question_responses_select ON daily_question_responses
  FOR SELECT USING (
    auth.uid()::uuid = user_id OR
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY daily_question_responses_insert ON daily_question_responses
  FOR INSERT WITH CHECK (
    auth.uid()::uuid = user_id AND
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY daily_question_responses_update ON daily_question_responses
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY daily_question_responses_delete ON daily_question_responses
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- =============================================
-- 10. CHECK_IN_TOPICS
-- =============================================
CREATE TABLE IF NOT EXISTS check_in_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('communication', 'intimacy', 'conflict', 'goals', 'family', 'finances', 'health', 'fun', 'spiritual', 'other')),
  prompt_questions TEXT[],
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE check_in_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY check_in_topics_select ON check_in_topics
  FOR SELECT USING (true);

CREATE POLICY check_in_topics_insert ON check_in_topics
  FOR INSERT WITH CHECK (true);

-- =============================================
-- 11. MONTHLY_DEEP_DIVE
-- =============================================
CREATE TABLE IF NOT EXISTS monthly_deep_dive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER CHECK (month >= 1 AND month <= 12),
  year INTEGER,
  theme_title TEXT NOT NULL,
  theme_description TEXT,
  overview TEXT,
  week_1_topic TEXT,
  week_1_exercises TEXT[],
  week_2_topic TEXT,
  week_2_exercises TEXT[],
  week_3_topic TEXT,
  week_3_exercises TEXT[],
  week_4_topic TEXT,
  week_4_exercises TEXT[],
  reflection_prompts TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year)
);

ALTER TABLE monthly_deep_dive ENABLE ROW LEVEL SECURITY;

CREATE POLICY monthly_deep_dive_select ON monthly_deep_dive
  FOR SELECT USING (true);

-- =============================================
-- 12. DAILY_QUESTIONS_CONFIG
-- =============================================
CREATE TABLE IF NOT EXISTS daily_questions_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couple_units(id) ON DELETE CASCADE UNIQUE,
  rotation_day INTEGER CHECK (rotation_day >= 0 AND rotation_day <= 6),
  current_question_index INTEGER DEFAULT 0,
  last_reset_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE daily_questions_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_questions_config_select ON daily_questions_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY daily_questions_config_insert ON daily_questions_config
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY daily_questions_config_update ON daily_questions_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY daily_questions_config_delete ON daily_questions_config
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_communication_analysis_couple ON communication_analysis(couple_id);
CREATE INDEX IF NOT EXISTS idx_communication_analysis_user ON communication_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_analysis_date ON communication_analysis(analysis_date);

CREATE INDEX IF NOT EXISTS idx_text_message_analysis_couple ON text_message_analysis(couple_id);
CREATE INDEX IF NOT EXISTS idx_text_message_analysis_user ON text_message_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_text_message_analysis_date ON text_message_analysis(analysis_date);

CREATE INDEX IF NOT EXISTS idx_argument_analysis_couple ON argument_analysis(couple_id);
CREATE INDEX IF NOT EXISTS idx_argument_analysis_user ON argument_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_argument_analysis_date ON argument_analysis(analysis_date);

CREATE INDEX IF NOT EXISTS idx_voice_tone_analysis_couple ON voice_tone_analysis(couple_id);
CREATE INDEX IF NOT EXISTS idx_voice_tone_analysis_user ON voice_tone_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_tone_analysis_date ON voice_tone_analysis(analysis_date);

CREATE INDEX IF NOT EXISTS idx_emotional_pattern_analysis_couple ON emotional_pattern_analysis(couple_id);
CREATE INDEX IF NOT EXISTS idx_emotional_pattern_analysis_user ON emotional_pattern_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_pattern_analysis_date ON emotional_pattern_analysis(analysis_date);

CREATE INDEX IF NOT EXISTS idx_memory_lane_couple ON memory_lane(couple_id);
CREATE INDEX IF NOT EXISTS idx_memory_lane_user ON memory_lane(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_lane_date ON memory_lane(memory_date);

CREATE INDEX IF NOT EXISTS idx_bucket_list_couple ON bucket_list(couple_id);
CREATE INDEX IF NOT EXISTS idx_bucket_list_user ON bucket_list(user_id);
CREATE INDEX IF NOT EXISTS idx_bucket_list_status ON bucket_list(status);

CREATE INDEX IF NOT EXISTS idx_daily_question_responses_couple ON daily_question_responses(couple_id);
CREATE INDEX IF NOT EXISTS idx_daily_question_responses_user ON daily_question_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_question_responses_date ON daily_question_responses(question_date);

CREATE INDEX IF NOT EXISTS idx_daily_questions_config_couple ON daily_questions_config(couple_id);

-- =============================================
-- SEED DATA: Sample Daily Questions
-- =============================================
INSERT INTO daily_questions (question_text, category, difficulty, partner_question) VALUES
  ('What is one thing you want to accomplish together this year?', 'goals', 2, 'How can I help you achieve that?'),
  ('If you could relive one memory from our relationship, what would it be and why?', 'deeper', 2, 'What makes that memory so special to you?'),
  ('What is your love language that you feel is most underutilized?', 'intimacy', 2, 'How can I express it more often?'),
  ('What is a dream you have that you have not shared with me yet?', 'dreams', 3, 'What makes you hesitant to share it?'),
  ('When do you feel most connected to me?', 'communication', 1, 'What makes that moment so meaningful?'),
  ('What is one thing I do that always makes you laugh?', 'fun', 1, 'What is your favorite thing we laugh about together?'),
  ('What is a lesson from your childhood you want to bring into our relationship?', 'childhood', 3, 'How do you want to do that differently?'),
  ('If we had unlimited resources, what would you want to do together?', 'hypothetical', 2, 'Why does that appeal to you?'),
  ('What are you most grateful for about our relationship?', 'gratitude', 1, 'What is one thing I do that you appreciate most?'),
  ('What is a boundary you need in our relationship that we have not discussed?', 'communication', 3, 'How can I better respect your boundaries?')
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED DATA: Sample Check-in Topics
-- =============================================
INSERT INTO check_in_topics (topic_name, description, category, prompt_questions) VALUES
  ('Communication Check-in', 'How well are you and your partner communicating lately?', 'communication', ARRAY['How has our communication been this week?', 'Is there anything unsaid that you would like to share?', 'What can we do to improve our dialogue?']),
  ('Quality Time', 'Are you spending enough meaningful time together?', 'fun', ARRAY['How much quality time have we spent together recently?', 'What activities bring us the most joy?', 'Do we need to schedule more time together?']),
  ('Financial Alignment', 'Are you and your partner on the same page about money?', 'finances', ARRAY['Do we have any financial stresses to discuss?', 'Are we aligned on our spending priorities?', 'What financial goals do we share?']),
  ('Intimacy & Affection', 'How is your physical and emotional intimacy?', 'intimacy', ARRAY['How satisfied are you with our level of intimacy?', 'Is there anything you need more or less of?', 'How can we nurture our connection?']),
  ('Conflict Resolution', 'How are conflicts being handled in your relationship?', 'conflict', ARRAY['Have we had any unresolved disagreements?', 'How do we typically handle disagreements?', 'What can we do to fight fairer?']),
  ('Future Goals', 'Are you both working toward common goals?', 'goals', ARRAY['What goals are we working toward together?', 'Are our individual goals aligned?', 'What support do you need from me?'])
ON CONFLICT DO NOTHING;