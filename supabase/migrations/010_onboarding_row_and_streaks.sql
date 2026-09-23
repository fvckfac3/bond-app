-- 010: onboarding saves + check-in streaks.
--
--   1. onboarding_assessments.assessment_id references assessments(id), but the live
--      assessments table had no 'onboarding-assessment' row, so every onboarding save failed.
--   2. Streaks were read from a `streaks` table that never existed in the live database.
--      They are now derived from daily_check_ins instead of being stored and maintained.
--
-- Safe to re-run.

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
