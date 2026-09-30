-- BOND App Database Schema
-- Based on PRD requirements

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  pair_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Couple Units table
CREATE TABLE IF NOT EXISTS couple_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  relationship_stage TEXT, -- Dating, Committed, Engaged, Married, Rebuilding
  relationship_duration INTEGER, -- in months
  goals TEXT[], -- Array of relationship goals
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- active, dissolved
  UNIQUE(user1_id, user2_id)
);

-- Assessments table (metadata)
CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  framework TEXT NOT NULL,
  description TEXT,
  estimated_time TEXT,
  questions_count INTEGER,
  icon TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment Sessions table (individual responses)
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assessment_id TEXT REFERENCES assessments(id),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  scores JSONB, -- Calculated scores per category
  submitted_at TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  answer_hash TEXT, -- SHA-256 hash for immutability
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Couple Results table (combined results)
CREATE TABLE IF NOT EXISTS couple_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_unit_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  assessment_id TEXT REFERENCES assessments(id),
  user1_session_id UUID REFERENCES assessment_sessions(id),
  user2_session_id UUID REFERENCES assessment_sessions(id),
  compatibility_score DECIMAL(5,2),
  combined_scores JSONB,
  strengths TEXT[],
  growth_areas TEXT[],
  insights TEXT, -- AI-generated insights (Phase 2)
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(couple_unit_id, assessment_id)
);

-- Daily Check-ins table
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  couple_unit_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  connection_score INTEGER CHECK (connection_score >= 1 AND connection_score <= 10),
  mood TEXT,
  appreciation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_unit_id UUID REFERENCES couple_units(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_pair_code ON users(pair_code);
CREATE INDEX IF NOT EXISTS idx_couple_units_users ON couple_units(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user ON assessment_sessions(user_id, assessment_id);
CREATE INDEX IF NOT EXISTS idx_couple_results_couple ON couple_results(couple_unit_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid()::uuid = id);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid()::uuid = id);

-- Couple units: users can see units they're part of
CREATE POLICY couple_units_select ON couple_units
  FOR SELECT USING (
    auth.uid()::uuid = user1_id OR auth.uid()::uuid = user2_id
  );

CREATE POLICY couple_units_insert ON couple_units
  FOR INSERT WITH CHECK (
    auth.uid()::uuid = user1_id OR auth.uid()::uuid = user2_id
  );

-- Assessment sessions: users can only see their own sessions
CREATE POLICY assessment_sessions_select_own ON assessment_sessions
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY assessment_sessions_insert_own ON assessment_sessions
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY assessment_sessions_update_own ON assessment_sessions
  FOR UPDATE USING (auth.uid()::uuid = user_id);

-- Couple results: both partners can see results
CREATE POLICY couple_results_select ON couple_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_unit_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

-- Daily checkins: users can see their own and their partner's
CREATE POLICY daily_checkins_select ON daily_checkins
  FOR SELECT USING (
    auth.uid()::uuid = user_id OR
    EXISTS (
      SELECT 1 FROM couple_units cu
      WHERE cu.id = couple_unit_id
      AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
    )
  );

CREATE POLICY daily_checkins_insert ON daily_checkins
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

-- Insert sample assessment metadata
INSERT INTO assessments (id, name, framework, description, estimated_time, questions_count, icon, category) VALUES
  ('love-languages', 'Love Languages', 'Five Love Languages (Chapman)', 'Discover how you and your partner prefer to give and receive love', '8 min', 30, '❤️', 'connection'),
  ('attachment-style', 'Attachment Style', 'Attachment Theory (Bowlby, Ainsworth)', 'Understand your attachment patterns and how they shape your relationship', '6 min', 20, '🔗', 'emotional'),
  ('communication-style', 'Communication Style', 'Nonviolent Communication (Rosenberg)', 'Explore how you communicate needs, feelings, and boundaries', '5 min', 15, '💬', 'communication')
ON CONFLICT (id) DO NOTHING;
