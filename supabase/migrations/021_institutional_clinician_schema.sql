-- 021: institutional (clinic) layer for the clinician dashboard in clinician-web/.
--
-- A clinic links to an existing couple_units row through clinic_couples; there is no separate
-- "couples" table and no partner A/B. Nothing a couple does is visible to a clinic until both
-- partners consent, and even then a clinician sees only:
--   * reflections an author explicitly marked 'shared_with_clinician', and
--   * counts (activity completions, check-ins, daily answers) since consent, through the
--     SECURITY DEFINER functions below. No free text from existing tables reaches a clinic.
-- private_reflections is readable by its author and nobody else, ever.
-- audit_logs is append-only: no UPDATE/DELETE/TRUNCATE for any API role, and a trigger
-- rejects them even from roles that bypass RLS.
--
-- Built to support HIPAA technical safeguards; this migration does not make Bond HIPAA-compliant
-- (that needs a BAA with Supabase and the host, policies, risk analysis, breach procedures).
--
-- Safe to re-run.

-- ============================================================
-- 1. TABLES
-- ============================================================

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

-- ============================================================
-- 2. MEMBERSHIP HELPERS (SECURITY DEFINER so policies don't recurse through RLS)
-- ============================================================

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

-- ============================================================
-- 3. SEATS — enforced in the database; the app's check is only a pre-check for the UI.
-- A seat is a clinic_couples row with status 'active' and activity in the last 30 days.
-- ============================================================

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

-- ============================================================
-- 4. AUDIT TRAIL IMMUTABILITY
-- ============================================================

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

-- ============================================================
-- 5. ROW-LEVEL SECURITY
-- ============================================================

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

-- ============================================================
-- 6. FUNCTIONS THE APPS CALL
-- ============================================================

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

-- ============================================================
-- 7. GRANTS — per table, least privilege. Supabase grants ALL on new public tables and
-- functions to anon/authenticated/service_role by default, so revoke first.
-- ============================================================

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
