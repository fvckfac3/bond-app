-- BOND Onboarding Assessment Seed
-- Requires schema.sql, schema_phase2.sql, 006_onboarding_assessment_schema.sql, assessment_seed.sql, and learning series seed files.

INSERT INTO onboarding_assessment_patterns (pattern_key, title, summary, signal_rules, default_action, default_script, severity) VALUES
  ('secure-foundation', 'Secure Foundation', 'You have enough safety and trust to focus on growth without everything feeling fragile.', '{"minAverage":78}', 'Keep doing what works and protect the habits that create safety.', 'What is one thing we already do well that should stay part of our relationship?', 'low'),
  ('pursue-withdraw', 'Pursue / Withdraw', 'One of you tends to move toward connection while the other protects with distance.', '{"attachment":true}', 'Slow the conversation down and make reassurance and space explicit.', 'When I get scared, I move toward you. When you get overwhelmed, you pull back. Can we talk about what helps each of us feel safe?', 'high'),
  ('repair-deficit', 'Repair Deficit', 'You may not be resolving conflict fully, even when the issues are small.', '{"conflict":true}', 'Add one repair step before the day ends.', 'Can we pause and repair this before we go to bed?', 'high'),
  ('values-drift', 'Values Drift', 'You may care about each other but be operating with different maps for the future.', '{"values":true}', 'Name the differences and build a shared operating plan.', 'We do not need to be identical, but we do need to understand what we are each building.', 'moderate'),
  ('trust-fragile', 'Trust is Fragile', 'One or both partners do not yet feel fully safe relying on the relationship.', '{"trust":true}', 'Prioritize consistency, transparency, and follow-through.', 'Let’s make trust concrete by keeping small promises and checking in honestly.', 'critical'),
  ('reconnection-opportunity', 'Reconnection Opportunity', 'There is enough goodwill here to make meaningful progress quickly.', '{"general":true}', 'Use your strongest area to support the weakest one.', 'What is one thing we already do well that could help us with the thing that is hardest?', 'moderate')
ON CONFLICT (pattern_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  signal_rules = EXCLUDED.signal_rules,
  default_action = EXCLUDED.default_action,
  default_script = EXCLUDED.default_script,
  severity = EXCLUDED.severity;

INSERT INTO onboarding_assessment_recommendation_rules (rule_key, title, assessment_ids, series_keys, min_score, max_score, match_type, priority_order, summary, recommendation) VALUES
  ('onboarding-very-low', 'Immediate Stabilization', ARRAY['attachment-style', 'communication-style', 'conflict-resolution', 'trust-vulnerability'], ARRAY['communication-series', 'conflict-repair-series', 'trust-vulnerability-series'], 0, 39, 'stabilize', 1, 'This relationship needs immediate repair and support.', 'Start with communication, trust, and repair before deeper intimacy or values work.'),
  ('onboarding-growing', 'Build the Basics', ARRAY['communication-style', 'love-languages', 'conflict-resolution'], ARRAY['connection-series', 'communication-series', 'conflict-repair-series'], 40, 59, 'foundations', 2, 'You have a base, but the pattern is inconsistent.', 'Focus on foundational connection habits, clearer communication, and one small repair ritual.'),
  ('onboarding-strong', 'Deepen the Connection', ARRAY['values-alignment', 'shared-meaning', 'intimacy-closeness'], ARRAY['shared-meaning-series', 'intimacy-series', 'life-growth-series'], 60, 79, 'deepening', 3, 'This is a good place to deepen rather than patch.', 'Lean into meaning, intimacy, and shared goals while protecting what already works.'),
  ('onboarding-exceptional', 'Protect the Strength', ARRAY['appreciation-gratitude', 'fun-personality', 'relationship-satisfaction'], ARRAY['connection-series', 'health-wellness-series', 'key-concepts-series'], 80, 100, 'maintenance', 4, 'This is a strong relationship area worth protecting.', 'Keep reinforcing the habits that make this strength visible and durable.')
ON CONFLICT (rule_key) DO UPDATE SET
  title = EXCLUDED.title,
  assessment_ids = EXCLUDED.assessment_ids,
  series_keys = EXCLUDED.series_keys,
  min_score = EXCLUDED.min_score,
  max_score = EXCLUDED.max_score,
  match_type = EXCLUDED.match_type,
  priority_order = EXCLUDED.priority_order,
  summary = EXCLUDED.summary,
  recommendation = EXCLUDED.recommendation;

INSERT INTO onboarding_assessment_dimensions (assessment_id, dimension_key, label, description, good_floor, concern_floor, recommendation, sort_order) VALUES
  ('attachment-style', 'anxiety', 'Attachment Anxiety', 'How strongly uncertainty activates need for reassurance.', 60, 45, 'Create predictability, reassurance, and direct asks for comfort.', 1),
  ('attachment-style', 'avoidance', 'Attachment Avoidance', 'How strongly closeness pressure triggers distance or shutdown.', 60, 45, 'Practice sharing emotions sooner and staying present through discomfort.', 2),
  ('communication-style', 'expression', 'Expression', 'How clearly needs and feelings are stated.', 60, 45, 'Use simple I-statements and concrete requests.', 1),
  ('communication-style', 'listening', 'Listening', 'How well each partner receives and reflects the other.', 60, 45, 'Paraphrase before responding and slow the pace.', 2),
  ('communication-style', 'validation', 'Validation', 'Whether the emotional reality of the other person lands.', 60, 45, 'Name the feeling before offering advice.', 3),
  ('communication-style', 'accountability', 'Accountability', 'Whether responsibility is owned cleanly.', 60, 45, 'Say what is yours without self-protection first.', 4),
  ('conflict-resolution', 'avoidance', 'Avoidance', 'The tendency to shut down or delay hard conversations.', 55, 40, 'Return to the issue with one small, safe step.', 1),
  ('conflict-resolution', 'composure', 'Composure', 'How well the couple keeps the conflict regulated.', 60, 45, 'Lower the temperature and keep the tone steady.', 2),
  ('conflict-resolution', 'compromise', 'Compromise', 'Whether the couple can find a workable middle ground.', 60, 45, 'Look for the third option that gives both of you something.', 3),
  ('conflict-resolution', 'empathy', 'Empathy', 'How often each partner can feel the other’s side.', 60, 45, 'Reflect back what you believe the other person feels.', 4),
  ('conflict-resolution', 'repair', 'Repair', 'How quickly the relationship returns after rupture.', 60, 45, 'Add a repair step before the day ends.', 5),
  ('trust-vulnerability', 'trust', 'Trust', 'Reliability, follow-through, and emotional safety.', 60, 45, 'Keep small promises and be transparent early.', 1),
  ('trust-vulnerability', 'vulnerability', 'Vulnerability', 'Comfort sharing what feels risky or unprotected.', 60, 45, 'Share one honest thing before you are pushed to.', 2),
  ('trust-vulnerability', 'safety', 'Safety', 'Whether opening up feels safe enough to repeat.', 60, 45, 'Create predictable, non-defensive moments of care.', 3),
  ('shared-meaning', 'rituals', 'Rituals', 'How strongly shared routines anchor the relationship.', 60, 45, 'Create one repeatable ritual together.', 1),
  ('shared-meaning', 'goals', 'Goals', 'Alignment on shared direction and plans.', 60, 45, 'Turn shared goals into weekly action steps.', 2),
  ('shared-meaning', 'roles', 'Roles', 'Clarity about who does what and why.', 60, 45, 'Talk about roles directly instead of assuming.', 3),
  ('shared-meaning', 'legacy', 'Legacy', 'The story the couple wants to be building together.', 60, 45, 'Name the kind of relationship you want to be remembered for.', 4),
  ('shared-meaning', 'growth', 'Growth', 'Shared willingness to evolve as a team.', 60, 45, 'Choose one habit that helps you both grow.', 5)
ON CONFLICT (assessment_id, dimension_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  good_floor = EXCLUDED.good_floor,
  concern_floor = EXCLUDED.concern_floor,
  recommendation = EXCLUDED.recommendation,
  sort_order = EXCLUDED.sort_order;

INSERT INTO assessments (
  id,
  name,
  framework,
  description,
  estimated_time,
  questions_count,
  icon,
  category
) VALUES (
  'onboarding-assessment',
  'Couple Onboarding',
  'BOND Relationship Intake Framework',
  'Identify where each couple is starting, what they need first, and which assessments and learning series will help them most.',
  '10 min',
  24,
  '🧭',
  'onboarding'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  framework = EXCLUDED.framework,
  description = EXCLUDED.description,
  estimated_time = EXCLUDED.estimated_time,
  questions_count = EXCLUDED.questions_count,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category;
