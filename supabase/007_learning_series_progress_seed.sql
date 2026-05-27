-- Optional sample learning progress seed
-- This is safe to run after users and couple_units exist.

INSERT INTO learning_series_progress (user_id, couple_unit_id, series_key, module_key, completed, shared_with_partner, reflection, completed_at)
SELECT u.id, cu.id, 'relationship-foundations', 'rf-1', true, true, 'We agree that repair matters more than being right.', NOW()
FROM users u
JOIN couple_units cu ON cu.user1_id = u.id OR cu.user2_id = u.id
LIMIT 1
ON CONFLICT (user_id, series_key, module_key) DO UPDATE SET
  completed = EXCLUDED.completed,
  shared_with_partner = EXCLUDED.shared_with_partner,
  reflection = EXCLUDED.reflection,
  completed_at = EXCLUDED.completed_at;
