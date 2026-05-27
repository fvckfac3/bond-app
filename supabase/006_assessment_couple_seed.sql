-- BOND Assessment Couple Seed
-- Requires schema.sql, schema_phase2.sql, 003_assessment_content_schema.sql, 004_couple_assessment_schema.sql, and assessment_seed.sql.

INSERT INTO assessment_couple_rules (assessment_id, scoring_version, average_weight, alignment_weight, floor_weight, high_gap_threshold, shared_strength_threshold, shared_growth_threshold, low_floor_threshold, notes) VALUES
  ('love-languages', 'couple-v1', 0.35, 0.45, 0.20, 30, 72, 55, 45, 'Alignment matters more than raw average because love languages are about how care is received.'),
  ('attachment-style', 'couple-v1', 0.30, 0.50, 0.20, 28, 70, 55, 45, 'Attachment patterns are about security and mismatch, so alignment carries extra weight.'),
  ('communication-style', 'couple-v1', 0.35, 0.40, 0.25, 25, 70, 55, 45, 'Communication is relational: shared clarity and repair capacity matter most.'),
  ('conflict-resolution', 'couple-v1', 0.30, 0.45, 0.25, 30, 70, 55, 45, 'Conflict scoring should emphasize repair and de-escalation.'),
  ('values-alignment', 'couple-v1', 0.40, 0.40, 0.20, 25, 75, 60, 50, 'Values compatibility needs a strong shared base to feel stable.')
ON CONFLICT (assessment_id) DO UPDATE SET
  scoring_version = EXCLUDED.scoring_version,
  average_weight = EXCLUDED.average_weight,
  alignment_weight = EXCLUDED.alignment_weight,
  floor_weight = EXCLUDED.floor_weight,
  high_gap_threshold = EXCLUDED.high_gap_threshold,
  shared_strength_threshold = EXCLUDED.shared_strength_threshold,
  shared_growth_threshold = EXCLUDED.shared_growth_threshold,
  low_floor_threshold = EXCLUDED.low_floor_threshold,
  notes = EXCLUDED.notes;
