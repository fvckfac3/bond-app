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
