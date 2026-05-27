-- BOND Learning Series Schema
-- Run after schema.sql and schema_phase2.sql.

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(series_key, module_key)
);

CREATE TABLE IF NOT EXISTS learning_series_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  couple_unit_id UUID REFERENCES couple_units(id) ON DELETE CASCADE,
  series_key TEXT NOT NULL REFERENCES learning_series(series_key) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  shared_with_partner BOOLEAN NOT NULL DEFAULT FALSE,
  reflection TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, series_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_learning_series_modules_series ON learning_series_modules(series_key, sort_order);
CREATE INDEX IF NOT EXISTS idx_learning_series_progress_user ON learning_series_progress(user_id, series_key);
CREATE INDEX IF NOT EXISTS idx_learning_series_progress_couple ON learning_series_progress(couple_unit_id, series_key);

ALTER TABLE learning_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_series_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_series_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY learning_series_select_public ON learning_series
  FOR SELECT USING (true);

CREATE POLICY learning_series_modules_select_public ON learning_series_modules
  FOR SELECT USING (true);

CREATE POLICY learning_series_progress_select ON learning_series_progress
  FOR SELECT USING (
    auth.uid()::uuid = user_id
    OR (
      couple_unit_id IS NOT NULL AND EXISTS (
        SELECT 1
        FROM couple_units cu
        WHERE cu.id = learning_series_progress.couple_unit_id
          AND (cu.user1_id = auth.uid()::uuid OR cu.user2_id = auth.uid()::uuid)
      )
    )
  );

CREATE POLICY learning_series_progress_insert ON learning_series_progress
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY learning_series_progress_update ON learning_series_progress
  FOR UPDATE USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);
