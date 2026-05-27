-- BOND App Phase 2 Database Schema Updates
-- Run this after the initial schema.sql

-- Activities table (for activity library)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- journal, conversation_starter, challenge, learning_module, scenario
  title TEXT NOT NULL,
  description TEXT,
  content JSONB, -- Flexible content structure
  category TEXT, -- connection, communication, intimacy, etc.
  estimated_time TEXT,
  difficulty TEXT, -- easy, medium, hard
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity completions table
CREATE TABLE IF NOT EXISTS activity_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  couple_unit_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  response JSONB, -- User's response/completion data
  shared_with_partner BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (for in-app messaging)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_unit_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, appreciation, prompt
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress snapshots table (for longitudinal tracking)
CREATE TABLE IF NOT EXISTS progress_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_unit_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  relationship_health_score DECIMAL(5,2),
  domain_scores JSONB, -- Scores per domain (communication, trust, etc.)
  completed_activities_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(couple_unit_id, snapshot_date)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- daily_checkin, partner_completed, new_insight, etc.
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update couple_results to include AI insights
ALTER TABLE couple_results 
ADD COLUMN IF NOT EXISTS ai_narrative TEXT,
ADD COLUMN IF NOT EXISTS ai_growth_recommendations TEXT[],
ADD COLUMN IF NOT EXISTS ai_strength_affirmation TEXT,
ADD COLUMN IF NOT EXISTS ai_communication_scripts JSONB,
ADD COLUMN IF NOT EXISTS framework_tags TEXT[];

-- Update daily_checkins to include more fields
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS shared_with_partner BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS partner_viewed BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activity_completions_couple ON activity_completions(couple_unit_id);
CREATE INDEX IF NOT EXISTS idx_messages_couple ON messages(couple_unit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_snapshots_couple_date ON progress_snapshots(couple_unit_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- RLS Policies for new tables
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Activities: everyone can read
CREATE POLICY activities_select ON activities
  FOR SELECT USING (true);

-- Activity completions: users can see their own and their partner's
CREATE POLICY activity_completions_select ON activity_completions
  FOR SELECT USING (
    auth.uid()::uuid = user_id OR
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_unit_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY activity_completions_insert ON activity_completions
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

-- Messages: both partners can see messages in their couple unit
CREATE POLICY messages_select ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_unit_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY messages_insert ON messages
  FOR INSERT WITH CHECK (
    auth.uid()::uuid = sender_id AND
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_unit_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY messages_update ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_unit_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

-- Progress snapshots: both partners can see
CREATE POLICY progress_snapshots_select ON progress_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_unit_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

-- Notifications: users can only see their own
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (auth.uid()::uuid = user_id);

-- Insert sample activities
INSERT INTO activities (type, title, description, content, category, estimated_time, difficulty) VALUES
  ('conversation_starter', 'Dream Vacation', 'Share your ideal vacation destination and why', '{"prompt": "If money and time were no object, where would you want to go together and what would you do?"}', 'connection', '10 min', 'easy'),
  ('conversation_starter', 'Appreciation Moment', 'Tell your partner something you appreciate about them today', '{"prompt": "What is one thing your partner did recently that made you feel loved or appreciated?"}', 'connection', '5 min', 'easy'),
  ('journal', 'Relationship Reflection', 'Private reflection on your relationship journey', '{"prompts": ["What makes you feel closest to your partner?", "What is one area you want to grow in?", "What are you grateful for in your relationship?"]}', 'reflection', '15 min', 'medium'),
  ('challenge', 'Phone-Free Evening', 'Spend 2 hours together without phones or screens', '{"instructions": "Put away all devices for at least 2 hours. Engage in face-to-face conversation, play a game, cook together, or go for a walk."}', 'connection', '2 hours', 'medium'),
  ('challenge', 'Love Letter Exchange', 'Write a heartfelt letter to your partner', '{"instructions": "Take 20 minutes to write a letter expressing your love, appreciation, and hopes for your relationship. Exchange and read together."}', 'connection', '30 min', 'easy'),
  ('learning_module', 'Active Listening', 'Learn the fundamentals of active listening', '{"content": "Active listening involves fully concentrating, understanding, responding and remembering what is being said. Key techniques: Eye contact, nodding, paraphrasing, asking questions.", "tips": ["Put away distractions", "Focus on understanding, not responding", "Validate feelings", "Ask clarifying questions"]}', 'communication', '10 min', 'easy'),
  ('scenario', 'Financial Decision', 'How would you handle a major financial choice?', '{"scenario": "You and your partner have saved $10,000. One wants to invest it, the other wants to use it for a vacation. How do you navigate this?", "questions": ["What is your initial reaction?", "How would you approach the conversation?", "What compromise could you reach?"]}', 'values', '15 min', 'medium')
ON CONFLICT DO NOTHING;
