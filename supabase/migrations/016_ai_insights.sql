-- 016: server-side AI insights and structured analyzer results.
--
-- All AI output is generated and written by the backend (service role) — never by the app.
--   * individual_insights: one per completed assessment session, private to its owner.
--   * couple_results.ai_*: the couple insight, generated once both partners complete; both see it.
--   * relationship_summaries: a periodic (monthly) summary across everything the couple has done.
--   * analyzer tables gain a `result` JSONB holding the full structured analysis.
--
-- Safe to re-run.

-- ============================================================
-- 1. INDIVIDUAL INSIGHTS (private to the person who took the assessment)
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
