-- 009: Supabase advisor fixes + Memory Lane / Bucket List on Supabase.
--
--   1. Security: lock down the signup trigger function, pin update_updated_at_column's
--      search_path, and scope both_partners_completed() to the caller's own couple.
--   2. Performance: every RLS policy evaluates auth.*() once per query instead of once
--      per row ((select auth.uid()) instead of auth.uid()), and the no-op
--      "service_role" policies are dropped (service_role bypasses RLS entirely).
--   3. Memory Lane and Bucket List move off MongoDB: columns/checks aligned with the
--      app's screens, couple-scoped RLS, and indexes.
--
-- Safe to re-run: every statement is IF [NOT] EXISTS / OR REPLACE / DROP-then-CREATE.

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
