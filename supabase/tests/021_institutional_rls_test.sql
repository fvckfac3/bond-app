-- RLS, seat and audit tests for migration 021. Run by run_institutional_tests.sh against a
-- throwaway database (stub + bond_schema.sql + 021); never against the live project.
\set ON_ERROR_STOP 1
\set QUIET 1
\o /dev/null

CREATE OR REPLACE FUNCTION pg_temp.ok(cond BOOLEAN, msg TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF cond IS NOT TRUE THEN
    RAISE EXCEPTION 'FAIL: %', msg;
  END IF;
  RAISE NOTICE 'PASS: %', msg;
END $$;

-- Runs sql and requires it to fail with an error whose message matches pattern.
CREATE OR REPLACE FUNCTION pg_temp.fails(sql TEXT, pattern TEXT, msg TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE sql;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ~* pattern THEN
      RAISE NOTICE 'PASS: %', msg;
      RETURN;
    END IF;
    RAISE EXCEPTION 'FAIL: % (wrong error: %)', msg, SQLERRM;
  END;
  RAISE EXCEPTION 'FAIL: % (no error)', msg;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.n(sql TEXT) RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE r BIGINT;
BEGIN
  EXECUTE 'WITH q AS (' || sql || ') SELECT count(*) FROM q' INTO r;
  RETURN r;
END $$;


-- ---------- fixtures (as superuser) ----------
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'a1@example.com', '{"name":"Alex"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'a2@example.com', '{"name":"Sam"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'b1@example.com', '{"name":"B One"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'b2@example.com', '{"name":"B Two"}'),
  ('00000000-0000-0000-0000-0000000000c1', 'c1@example.com', '{"name":"C One"}'),
  ('00000000-0000-0000-0000-0000000000c2', 'c2@example.com', '{"name":"C Two"}'),
  ('00000000-0000-0000-0000-0000000000d1', 'dr@example.com', '{"name":"Dr Primary"}'),
  ('00000000-0000-0000-0000-0000000000d2', 'other@example.com', '{"name":"Dr Other"}'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@example.com', '{"name":"Admin"}'),
  ('00000000-0000-0000-0000-0000000000e1', 'outsider@example.com', '{"name":"Outsider"}');

SELECT pg_temp.ok((SELECT count(*) FROM users) = 10, 'signup trigger created public.users rows');

-- Pair A, B and C through the real pairing function.
CREATE OR REPLACE FUNCTION pg_temp.pair(me UUID, partner UUID) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE code TEXT;
BEGIN
  SELECT pair_code INTO code FROM users WHERE id = partner;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', me, 'role', 'authenticated')::text, false);
  PERFORM pair_with_partner(code);
END $$;
SELECT pg_temp.pair('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2');
SELECT pg_temp.pair('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2');
SELECT pg_temp.pair('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2');

SELECT id AS couple_a FROM couple_units WHERE user1_id = '00000000-0000-0000-0000-0000000000a1' AND status = 'active' \gset
SELECT id AS couple_b FROM couple_units WHERE user1_id = '00000000-0000-0000-0000-0000000000b1' AND status = 'active' \gset
SELECT id AS couple_c FROM couple_units WHERE user1_id = '00000000-0000-0000-0000-0000000000c1' AND status = 'active' \gset

INSERT INTO clinics (id, name, tier, base_seat_limit) VALUES
  ('00000000-0000-0000-0000-00000000c11c', 'Rogue Valley Counseling', 'private_practice', 10),
  ('00000000-0000-0000-0000-00000000c22c', 'Tiny Enterprise', 'enterprise', 1);
INSERT INTO clinicians (id, clinic_id, user_id, role, full_name) VALUES
  ('00000000-0000-0000-0000-0000000001d1', '00000000-0000-0000-0000-00000000c11c', '00000000-0000-0000-0000-0000000000d1', 'clinician', 'Dr Primary'),
  ('00000000-0000-0000-0000-0000000001d2', '00000000-0000-0000-0000-00000000c11c', '00000000-0000-0000-0000-0000000000d2', 'clinician', 'Dr Other'),
  ('00000000-0000-0000-0000-0000000001ad', '00000000-0000-0000-0000-00000000c11c', '00000000-0000-0000-0000-0000000000ad', 'admin', 'Admin'),
  ('00000000-0000-0000-0000-0000000002ad', '00000000-0000-0000-0000-00000000c22c', '00000000-0000-0000-0000-0000000000ad', 'admin', 'Admin');
INSERT INTO activities (id, type, title, category, framework) VALUES
  ('00000000-0000-0000-0000-0000000000f1', 'activity', 'Test connection activity', 'connection', 'Gottman Method (rituals of connection)');

SELECT pg_temp.fails($$INSERT INTO clinics (name, tier, base_seat_limit) VALUES ('Bad', 'clinical_group', 10)$$,
  'clinics_tier_base_seats', 'scheduled tier must use its schedule''s base seat limit');

-- Token hashing must match clinician-web/lib/invite.ts (hashInviteToken test uses the same pair).
SELECT pg_temp.ok(encode(sha256(convert_to('bond-test-token', 'UTF8')), 'hex')
  = 'd80a91f0c5f73c2ffdc35c74f6663c718d43eaa808302b721e6fb456f93a8694', 'SQL token hash matches the TypeScript one');

-- ---------- role switching ----------
\set as_a1 'RESET ROLE; SELECT set_config(''request.jwt.claims'', ''{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}'', false); SET ROLE authenticated;'
\set as_a2 'RESET ROLE; SELECT set_config(''request.jwt.claims'', ''{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}'', false); SET ROLE authenticated;'
\set as_b1 'RESET ROLE; SELECT set_config(''request.jwt.claims'', ''{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}'', false); SET ROLE authenticated;'
\set as_b2 'RESET ROLE; SELECT set_config(''request.jwt.claims'', ''{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}'', false); SET ROLE authenticated;'
\set as_c1 'RESET ROLE; SELECT set_config(''request.jwt.claims'', ''{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}'', false); SET ROLE authenticated;'
\set as_c2 'RESET ROLE; SELECT set_config(''request.jwt.claims'', ''{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}'', false); SET ROLE authenticated;'
\set as_dr 'RESET ROLE; SELECT set_config(''request.jwt.claims'', ''{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}'', false); SET ROLE authenticated;'
\set as_other 'RESET ROLE; SELECT set_config(''request.jwt.claims'', ''{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}'', false); SET ROLE authenticated;'
\set as_admin 'RESET ROLE; SELECT set_config(''request.jwt.claims'', ''{"sub":"00000000-0000-0000-0000-0000000000ad","role":"authenticated"}'', false); SET ROLE authenticated;'
\set as_outsider 'RESET ROLE; SELECT set_config(''request.jwt.claims'', ''{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}'', false); SET ROLE authenticated;'
\set as_anon 'RESET ROLE; SELECT set_config(''request.jwt.claims'', ''{"role":"anon"}'', false); SET ROLE anon;'
\set as_service 'RESET ROLE; SELECT set_config(''request.jwt.claims'', ''{"role":"service_role"}'', false); SET ROLE service_role;'
\set as_super 'RESET ROLE; SELECT set_config(''request.jwt.claims'', '''', false);'

-- ---------- invitation + consent ----------
:as_outsider
SELECT pg_temp.fails($$SELECT create_clinic_invitation('00000000-0000-0000-0000-00000000c11c', 'a1@example.com', encode(sha256('tok-a'::bytea), 'hex'))$$,
  'not_clinic_member', 'non-member cannot create an invitation');

:as_dr
SELECT pg_temp.ok((SELECT status FROM create_clinic_invitation('00000000-0000-0000-0000-00000000c11c', 'A1@Example.com', encode(sha256('tok-a'::bytea), 'hex'))) = 'pending',
  'clinician creates an invitation');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM clinic_invitations') = 1, 'clinician reads own clinic''s invitations');
SELECT pg_temp.fails($$INSERT INTO clinic_invitations (clinic_id, email, token_hash, expires_at) VALUES ('00000000-0000-0000-0000-00000000c11c', 'x@example.com', 'x', now())$$,
  'permission denied', 'no direct insert into clinic_invitations');

:as_b1
SELECT pg_temp.fails($$SELECT accept_clinic_invitation('tok-a')$$, 'invitation_email_mismatch', 'invite addressed to someone else is rejected');

:as_a1
SELECT pg_temp.fails($$SELECT accept_clinic_invitation('wrong-token')$$, 'invalid_invitation', 'wrong token is rejected');
SELECT pg_temp.ok((SELECT status FROM accept_clinic_invitation('tok-a')) = 'pending', 'one partner''s consent leaves the link pending');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM clinic_couples') = 1, 'couple member reads own clinic link');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM clinics') = 1, 'couple member reads the linked clinic');
SELECT pg_temp.fails($$SELECT accept_clinic_invitation('tok-a')$$, 'invalid_invitation', 'an invitation is single-use');

INSERT INTO private_reflections (couple_unit_id, author_id, content_encrypted)
  VALUES (:'couple_a', '00000000-0000-0000-0000-0000000000a1', 'ciphertext-1');
INSERT INTO shared_reflections (couple_unit_id, author_id, exercise_title, content, status) VALUES
  (:'couple_a', '00000000-0000-0000-0000-0000000000a1', 'Ideal Day', 'draft text', 'draft'),
  (:'couple_a', '00000000-0000-0000-0000-0000000000a1', 'Ideal Day', 'for partner', 'shared_with_partner'),
  (:'couple_a', '00000000-0000-0000-0000-0000000000a1', 'Ideal Day', 'for clinician', 'shared_with_clinician');
SELECT pg_temp.fails($$INSERT INTO shared_reflections (couple_unit_id, author_id, content) VALUES ('$$ || :'couple_b' || $$', '00000000-0000-0000-0000-0000000000a1', 'x')$$,
  'row-level security', 'cannot write a reflection into another couple');
SELECT pg_temp.fails($$INSERT INTO private_reflections (couple_unit_id, author_id, content_encrypted) VALUES ('$$ || :'couple_a' || $$', '00000000-0000-0000-0000-0000000000a2', 'x')$$,
  'row-level security', 'cannot write a private reflection as the partner');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM private_reflections') = 1, 'author reads own private reflection');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM shared_reflections') = 3, 'author reads all own shared reflections incl. draft');

:as_dr
SELECT pg_temp.ok(NOT clinician_can_view_couple(:'couple_a'), 'clinician has no access before both partners consent');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM shared_reflections') = 0, 'clinician sees no reflections before consent');
SELECT pg_temp.ok((SELECT partner_names FROM clinic_roster('00000000-0000-0000-0000-00000000c11c')) IS NULL, 'roster hides names before consent');

:as_a2
SELECT pg_temp.ok((SELECT status FROM record_clinic_consent((SELECT id FROM clinic_couples LIMIT 1))) = 'active', 'second consent activates the link');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM private_reflections') = 0, 'partner cannot read private reflection');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM shared_reflections') = 2, 'partner sees shared_with_partner and shared_with_clinician');
SELECT pg_temp.ok(pg_temp.n($$SELECT 1 FROM shared_reflections WHERE status = 'draft'$$) = 0, 'partner cannot see a draft');
SELECT pg_temp.ok(pg_temp.n('UPDATE private_reflections SET content_encrypted = ''x'' RETURNING 1') = 0, 'partner cannot update private reflection');
SELECT pg_temp.ok(pg_temp.n('DELETE FROM private_reflections RETURNING 1') = 0, 'partner cannot delete private reflection');
SELECT pg_temp.ok(pg_temp.n('UPDATE shared_reflections SET content = ''x'' RETURNING 1') = 0, 'partner cannot edit the author''s shared reflection');

:as_dr
SELECT pg_temp.ok(clinician_can_view_couple(:'couple_a'), 'primary clinician can view the active couple');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM private_reflections') = 0, 'clinician cannot read private reflections');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM shared_reflections') = 1, 'clinician sees exactly one reflection');
SELECT pg_temp.ok((SELECT status FROM shared_reflections) = 'shared_with_clinician', 'and it is the shared_with_clinician one');
SELECT pg_temp.ok(pg_temp.n('UPDATE shared_reflections SET content = ''x'' RETURNING 1') = 0, 'clinician cannot edit a reflection');
SELECT pg_temp.ok((SELECT unread_shared_reflections FROM clinic_dashboard_metrics('00000000-0000-0000-0000-00000000c11c')) = 1, 'metrics count one unread reflection');
SELECT pg_temp.ok(mark_shared_reflections_read(:'couple_a') = 1, 'clinician marks it read');
SELECT pg_temp.ok((SELECT unread_shared_reflections FROM clinic_dashboard_metrics('00000000-0000-0000-0000-00000000c11c')) = 0, 'metrics count zero unread after');
SELECT pg_temp.ok((SELECT partner_names FROM clinic_roster('00000000-0000-0000-0000-00000000c11c')) = ARRAY['Alex', 'Sam'], 'roster shows names after consent');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM users') = 1, 'clinician still cannot read users directly');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM activity_completions') = 0, 'clinician cannot read activity_completions directly');
SELECT pg_temp.ok((SELECT used FROM clinic_active_seat_count('00000000-0000-0000-0000-00000000c11c')) = 1, 'seat count is 1');

:as_other
SELECT pg_temp.ok(NOT clinician_can_view_couple(:'couple_a'), 'non-assigned clinician cannot view the couple');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM shared_reflections') = 0, 'non-assigned clinician sees no reflections');
SELECT pg_temp.ok(pg_temp.n($$SELECT 1 FROM clinic_roster('00000000-0000-0000-0000-00000000c11c')$$) = 0, 'non-assigned clinician''s roster is empty');
SELECT pg_temp.fails($$SELECT * FROM couple_daily_connection('$$ || :'couple_a' || $$')$$, 'not_permitted', 'non-assigned clinician cannot read trends');

:as_admin
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM shared_reflections') = 1, 'clinic admin sees the clinician-shared reflection');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM private_reflections') = 0, 'clinic admin cannot read private reflections');

:as_outsider
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM shared_reflections') = 0, 'outsider sees no shared reflections');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM clinics') = 0, 'outsider sees no clinics');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM clinic_couples') = 0, 'outsider sees no clinic links');
SELECT pg_temp.fails($$SELECT mark_shared_reflections_read('$$ || :'couple_a' || $$')$$, 'not_permitted', 'outsider cannot mark reflections read');
SELECT pg_temp.fails($$SELECT * FROM clinic_roster('00000000-0000-0000-0000-00000000c11c')$$, 'not_clinic_member', 'outsider cannot read the roster');

:as_anon
SELECT pg_temp.fails('SELECT 1 FROM clinics', 'permission denied', 'anon has no table access');
SELECT pg_temp.fails('SELECT 1 FROM shared_reflections', 'permission denied', 'anon cannot read shared reflections');
SELECT pg_temp.fails($$SELECT is_clinic_member('00000000-0000-0000-0000-00000000c11c')$$, 'permission denied', 'anon cannot call clinic functions');

-- ---------- activity keeps last_active_at fresh; trends are counts since consent ----------
:as_super
UPDATE clinic_couples SET last_active_at = NOW() - INTERVAL '40 days' WHERE couple_unit_id = :'couple_a';
:as_dr
SELECT pg_temp.ok((SELECT used FROM clinic_active_seat_count('00000000-0000-0000-0000-00000000c11c')) = 0, 'a couple idle for 30+ days does not hold a seat');
:as_a1
INSERT INTO activity_completions (user_id, couple_unit_id, activity_id)
  VALUES ('00000000-0000-0000-0000-0000000000a1', :'couple_a', '00000000-0000-0000-0000-0000000000f1');
INSERT INTO daily_check_ins (user_id, couple_unit_id, date, connection, notes)
  VALUES ('00000000-0000-0000-0000-0000000000a1', :'couple_a', CURRENT_DATE, 4, 'private note');
:as_dr
SELECT pg_temp.ok((SELECT used FROM clinic_active_seat_count('00000000-0000-0000-0000-00000000c11c')) = 1, 'activity re-marks the couple active');
SELECT pg_temp.ok((SELECT connection_activities_this_week FROM clinic_dashboard_metrics('00000000-0000-0000-0000-00000000c11c')) = 1, 'connection activity counted this week');
SELECT pg_temp.ok((SELECT sum(completions) FROM couple_exercise_completions(:'couple_a') WHERE gottman_informed) = 1, 'weekly exercise counts tag Gottman-informed activities');
SELECT pg_temp.ok((SELECT check_ins FROM couple_daily_connection(:'couple_a') WHERE day = CURRENT_DATE) = 1, 'daily connection counts today''s check-in');
SELECT pg_temp.ok((SELECT avg_connection FROM couple_daily_connection(:'couple_a') WHERE day = CURRENT_DATE) = 4, 'daily connection averages the rating');

-- ---------- audit log ----------
:as_service
INSERT INTO audit_logs (clinic_id, actor_id, subject_couple_unit_id, action, ip_address)
  VALUES ('00000000-0000-0000-0000-00000000c11c', '00000000-0000-0000-0000-0000000000d1', :'couple_a', 'VIEWED_COUPLE_RECORDS', '203.0.113.7');
SELECT pg_temp.fails('UPDATE audit_logs SET action = ''x''', 'permission denied', 'service role cannot update audit logs');
SELECT pg_temp.fails('DELETE FROM audit_logs', 'permission denied', 'service role cannot delete audit logs');
SELECT pg_temp.fails('TRUNCATE audit_logs', 'permission denied', 'service role cannot truncate audit logs');

:as_dr
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM audit_logs') = 0, 'non-admin clinician cannot read audit logs');
SELECT pg_temp.fails($$INSERT INTO audit_logs (clinic_id, action) VALUES ('00000000-0000-0000-0000-00000000c11c', 'FORGED')$$,
  'permission denied', 'authenticated users cannot write audit logs');
SELECT pg_temp.fails('UPDATE audit_logs SET action = ''x''', 'permission denied', 'clinician cannot update audit logs');
SELECT pg_temp.fails('DELETE FROM audit_logs', 'permission denied', 'clinician cannot delete audit logs');

:as_admin
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM audit_logs') = 1, 'clinic admin reads own clinic''s audit log');
SELECT pg_temp.fails('UPDATE audit_logs SET action = ''x''', 'permission denied', 'admin cannot update audit logs');

:as_super
SELECT pg_temp.fails('UPDATE audit_logs SET action = ''x''', 'append-only', 'even the owner cannot update audit logs');
SELECT pg_temp.fails('DELETE FROM audit_logs', 'append-only', 'even the owner cannot delete audit logs');
SELECT pg_temp.fails('TRUNCATE audit_logs', 'append-only', 'even the owner cannot truncate audit logs');
SELECT pg_temp.fails($$DELETE FROM clinics WHERE id = '00000000-0000-0000-0000-00000000c11c'$$, 'foreign key', 'a clinic with audit history cannot be deleted');

-- ---------- seat limit (enterprise clinic with 1 seat) ----------
:as_admin
SELECT create_clinic_invitation('00000000-0000-0000-0000-00000000c22c', 'b1@example.com', encode(sha256('tok-b'::bytea), 'hex')) IS NOT NULL AS created \gset
SELECT create_clinic_invitation('00000000-0000-0000-0000-00000000c22c', 'c1@example.com', encode(sha256('tok-c'::bytea), 'hex')) IS NOT NULL AS created \gset
:as_b1
SELECT accept_clinic_invitation('tok-b') IS NOT NULL AS accepted \gset
:as_b2
SELECT pg_temp.ok((SELECT status FROM record_clinic_consent((SELECT id FROM clinic_couples WHERE clinic_id = '00000000-0000-0000-0000-00000000c22c'))) = 'active', 'first couple takes the only seat');
:as_c1
SELECT accept_clinic_invitation('tok-c') IS NOT NULL AS accepted \gset
:as_c2
SELECT pg_temp.ok((SELECT status FROM record_clinic_consent((SELECT id FROM clinic_couples WHERE clinic_id = '00000000-0000-0000-0000-00000000c22c'))) = 'pending', 'second couple consents but stays pending: no seat');
:as_admin
SELECT pg_temp.fails($$SELECT create_clinic_invitation('00000000-0000-0000-0000-00000000c22c', 'z@example.com', encode(sha256('tok-z'::bytea), 'hex'))$$,
  'seat_limit_reached', 'invitations are blocked at the seat limit');
:as_super
SELECT pg_temp.fails($$UPDATE clinic_couples SET status = 'active' WHERE couple_unit_id = '$$ || :'couple_c' || $$'$$,
  'seat_limit_reached', 'trigger blocks the (limit+1)th active couple even for the owner');
UPDATE clinics SET extra_seats = 1 WHERE id = '00000000-0000-0000-0000-00000000c22c';
UPDATE clinic_couples SET status = 'active' WHERE couple_unit_id = :'couple_c';
SELECT pg_temp.ok((SELECT status FROM clinic_couples WHERE couple_unit_id = :'couple_c') = 'active', 'a purchased extra seat lets the next couple activate');
SELECT pg_temp.fails($$INSERT INTO clinic_couples (clinic_id, couple_unit_id, status) VALUES ('00000000-0000-0000-0000-00000000c11c', '$$ || :'couple_b' || $$', 'active')$$,
  'clinic_couples_active_needs_consent', 'a link cannot be active without both consents');

-- ---------- revoking consent removes access immediately ----------
:as_a2
SELECT pg_temp.ok((SELECT status FROM revoke_clinic_consent((SELECT id FROM clinic_couples WHERE clinic_id = '00000000-0000-0000-0000-00000000c11c'))) = 'archived', 'partner revokes consent');
:as_dr
SELECT pg_temp.ok(NOT clinician_can_view_couple(:'couple_a'), 'clinician loses access after revocation');
SELECT pg_temp.ok(pg_temp.n('SELECT 1 FROM shared_reflections') = 0, 'clinician sees no reflections after revocation');

-- ---------- RLS enabled on every new table ----------
:as_super
SELECT pg_temp.ok((SELECT bool_and(relrowsecurity) FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname IN
  ('clinics', 'clinicians', 'clinic_invitations', 'clinic_couples', 'private_reflections', 'shared_reflections', 'audit_logs'))
  AND (SELECT count(*) FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname IN
  ('clinics', 'clinicians', 'clinic_invitations', 'clinic_couples', 'private_reflections', 'shared_reflections', 'audit_logs')) = 7,
  'RLS enabled on all 7 new tables');
SELECT pg_temp.ok((SELECT bool_and(relforcerowsecurity) FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname IN ('private_reflections', 'audit_logs')),
  'RLS forced on private_reflections and audit_logs');
SELECT pg_temp.ok(NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename <> 'private_reflections' AND (qual ILIKE '%private_reflections%' OR with_check ILIKE '%private_reflections%')),
  'no policy on another table references private_reflections');
SELECT pg_temp.ok(NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND cmd IN ('UPDATE', 'DELETE', 'ALL', 'INSERT')),
  'audit_logs has only a SELECT policy');

\echo ALL INSTITUTIONAL TESTS PASSED
