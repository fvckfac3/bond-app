-- BOND Learning Series Seed
-- Requires schema.sql, schema_phase2.sql, and 005_learning_series_schema.sql.

INSERT INTO learning_series (series_key, title, summary, description, icon, sort_order) VALUES
  ('relationship-foundations', 'Relationship Foundations', 'Core relationship science in short, practical modules.', 'A research-backed starting point for couples who want to understand the habits that support closeness, stability, and repair.', '📚', 1)
ON CONFLICT (series_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('relationship-foundations', 'rf-1', 'What Makes Relationships Succeed', 'The core habits that distinguish thriving couples from struggling ones.', '12 min', 1),
  ('relationship-foundations', 'rf-2', 'Attachment Theory in Adult Relationships', 'How closeness, distance, and security are patterned.', '15 min', 2),
  ('relationship-foundations', 'rf-3', 'Love Languages and Daily Care', 'How care lands differently and how to translate it well.', '10 min', 3)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('relationship-foundations', 'rf-4', 'Conflict and Repair', 'How to handle disagreement without damage.', '12 min', 4),
  ('relationship-foundations', 'rf-5', 'Communication and Emotional Safety', 'How to speak so hard conversations stay usable.', '12 min', 5),
  ('relationship-foundations', 'rf-6', 'Trust and Vulnerability', 'How predictability and disclosure build safety.', '11 min', 6),
  ('relationship-foundations', 'rf-7', 'Intimacy and Closeness', 'How emotional, physical, intellectual, and shared-time closeness work.', '13 min', 7),
  ('relationship-foundations', 'rf-8', 'Shared Meaning and Values', 'How purpose and values create direction.', '12 min', 8)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

-- additional series seeds inserted below
-- ============================================================================
-- CONNECTION SERIES
-- ============================================================================
INSERT INTO learning_series (series_key, title, summary, description, icon, sort_order) VALUES
  ('connection-series', 'Connection', 'The habits that help partners feel close, responsive, and emotionally present.', 'A research-backed series on connection.', '✨', 2)
ON CONFLICT (series_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('connection-series', 'connection-series-foundations', 'Foundations', 'A practical guide to foundations within connection.', '10 min', 1),
  ('connection-series', 'connection-series-emotional-connection', 'Emotional Connection', 'A practical guide to emotional connection within connection.', '10 min', 2),
  ('connection-series', 'connection-series-deepening-bond', 'Deepening Bond', 'A practical guide to deepening bond within connection.', '11 min', 3),
  ('connection-series', 'connection-series-roots', 'Roots', 'A practical guide to roots within connection.', '10 min', 4),
  ('connection-series', 'connection-series-feeling-closer', 'Feeling Closer', 'A practical guide to feeling closer within connection.', '10 min', 5)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('connection-series', 'connection-series-happiness', 'Happiness', 'A practical guide to happiness within connection.', '10 min', 6)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- COMMUNICATION SERIES
-- ============================================================================
INSERT INTO learning_series (series_key, title, summary, description, icon, sort_order) VALUES
  ('communication-series', 'Communication', 'How couples speak, listen, and make hard conversations easier to handle.', 'A research-backed series on communication.', '💬', 3)
ON CONFLICT (series_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('communication-series', 'communication-series-communication', 'Communication', 'A practical guide to communication within communication.', '10 min', 1),
  ('communication-series', 'communication-series-clear-communication', 'Clear Communication', 'A practical guide to clear communication within communication.', '10 min', 2),
  ('communication-series', 'communication-series-healthy-conflict', 'Healthy Conflict', 'A practical guide to healthy conflict within communication.', '11 min', 3),
  ('communication-series', 'communication-series-listening', 'Listening', 'A practical guide to listening within communication.', '10 min', 4),
  ('communication-series', 'communication-series-meta-emotions', 'Meta Emotions', 'A practical guide to meta emotions within communication.', '10 min', 5)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('communication-series', 'communication-series-soft-startup', 'Soft Startup', 'A practical guide to soft startup within communication.', '10 min', 6)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- CONFLICT & REPAIR SERIES
-- ============================================================================
INSERT INTO learning_series (series_key, title, summary, description, icon, sort_order) VALUES
  ('conflict-repair-series', 'Conflict & Repair', 'How disagreement stays workable when repair happens early and respectfully.', 'A research-backed series on conflict & repair.', '🛠️', 4)
ON CONFLICT (series_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('conflict-repair-series', 'conflict-repair-series-conflict', 'Conflict', 'A practical guide to conflict within conflict & repair.', '10 min', 1),
  ('conflict-repair-series', 'conflict-repair-series-repair', 'Repair', 'A practical guide to repair within conflict & repair.', '10 min', 2),
  ('conflict-repair-series', 'conflict-repair-series-forgiveness', 'Forgiveness', 'A practical guide to forgiveness within conflict & repair.', '10 min', 3),
  ('conflict-repair-series', 'conflict-repair-series-perpetual-problems', 'Perpetual Problems', 'A practical guide to perpetual problems within conflict & repair.', '10 min', 4),
  ('conflict-repair-series', 'conflict-repair-series-flooding', 'Flooding', 'A practical guide to flooding within conflict & repair.', '10 min', 5)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- TRUST & VULNERABILITY SERIES
-- ============================================================================
INSERT INTO learning_series (series_key, title, summary, description, icon, sort_order) VALUES
  ('trust-vulnerability-series', 'Trust & Vulnerability', 'How safety grows through consistency, honesty, and paced openness.', 'A research-backed series on trust & vulnerability.', '🛡️', 5)
ON CONFLICT (series_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('trust-vulnerability-series', 'trust-vulnerability-series-trust', 'Trust', 'A practical guide to trust within trust & vulnerability.', '10 min', 1),
  ('trust-vulnerability-series', 'trust-vulnerability-series-building-trust', 'Building Trust', 'A practical guide to building trust within trust & vulnerability.', '10 min', 2),
  ('trust-vulnerability-series', 'trust-vulnerability-series-infidelity', 'Infidelity', 'A practical guide to infidelity within trust & vulnerability.', '11 min', 3),
  ('trust-vulnerability-series', 'trust-vulnerability-series-vulnerability', 'Vulnerability', 'A practical guide to vulnerability within trust & vulnerability.', '10 min', 4),
  ('trust-vulnerability-series', 'trust-vulnerability-series-contempt', 'Contempt', 'A practical guide to contempt within trust & vulnerability.', '10 min', 5)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- INTIMACY SERIES
-- ============================================================================
INSERT INTO learning_series (series_key, title, summary, description, icon, sort_order) VALUES
  ('intimacy-series', 'Intimacy', 'How emotional, physical, intellectual, and shared-time closeness all matter.', 'A research-backed series on intimacy.', '💕', 6)
ON CONFLICT (series_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('intimacy-series', 'intimacy-series-sexual-connection', 'Sexual Connection', 'A practical guide to sexual connection within intimacy.', '10 min', 1),
  ('intimacy-series', 'intimacy-series-sexual-desire', 'Sexual Desire', 'A practical guide to sexual desire within intimacy.', '10 min', 2),
  ('intimacy-series', 'intimacy-series-body-image', 'Body Image', 'A practical guide to body image within intimacy.', '10 min', 3),
  ('intimacy-series', 'intimacy-series-sex-script', 'Sex Script', 'A practical guide to sex script within intimacy.', '10 min', 4),
  ('intimacy-series', 'intimacy-series-rituals', 'Rituals', 'A practical guide to rituals within intimacy.', '10 min', 5)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- LIFE & GROWTH SERIES
-- ============================================================================
INSERT INTO learning_series (series_key, title, summary, description, icon, sort_order) VALUES
  ('life-growth-series', 'Life & Growth', 'How everyday systems like parenting, work, habits, and distance shape the relationship.', 'A research-backed series on life & growth.', '🌿', 7)
ON CONFLICT (series_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('life-growth-series', 'life-growth-series-parenting', 'Parenting', 'A practical guide to parenting within life & growth.', '11 min', 1),
  ('life-growth-series', 'life-growth-series-family-culture', 'Family Culture', 'A practical guide to family culture within life & growth.', '10 min', 2),
  ('life-growth-series', 'life-growth-series-expectations', 'Expectations', 'A practical guide to expectations within life & growth.', '10 min', 3),
  ('life-growth-series', 'life-growth-series-in-laws', 'In-Laws', 'A practical guide to in-laws within life & growth.', '10 min', 4),
  ('life-growth-series', 'life-growth-series-premarital', 'Premarital', 'A practical guide to premarital within life & growth.', '10 min', 5)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('life-growth-series', 'life-growth-series-personal-growth', 'Personal Growth', 'A practical guide to personal growth within life & growth.', '10 min', 6),
  ('life-growth-series', 'life-growth-series-habits', 'Habits', 'A practical guide to habits within life & growth.', '10 min', 7),
  ('life-growth-series', 'life-growth-series-technology', 'Technology', 'A practical guide to technology within life & growth.', '10 min', 8),
  ('life-growth-series', 'life-growth-series-long-distance', 'Long Distance', 'A practical guide to long distance within life & growth.', '11 min', 9)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- HEALTH & WELLNESS SERIES
-- ============================================================================
INSERT INTO learning_series (series_key, title, summary, description, icon, sort_order) VALUES
  ('health-wellness-series', 'Health & Wellness', 'How stress, mood, mental health, and money affect connection and stability.', 'A research-backed series on health & wellness.', '🫶', 8)
ON CONFLICT (series_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('health-wellness-series', 'health-wellness-series-emotional-intelligence', 'Emotional Intelligence', 'A practical guide to emotional intelligence within health & wellness.', '10 min', 1),
  ('health-wellness-series', 'health-wellness-series-anxiety', 'Anxiety', 'A practical guide to anxiety within health & wellness.', '10 min', 2),
  ('health-wellness-series', 'health-wellness-series-depression', 'Depression', 'A practical guide to depression within health & wellness.', '10 min', 3),
  ('health-wellness-series', 'health-wellness-series-postpartum', 'Postpartum', 'A practical guide to postpartum within health & wellness.', '10 min', 4),
  ('health-wellness-series', 'health-wellness-series-chronic-illness', 'Chronic Illness', 'A practical guide to chronic illness within health & wellness.', '10 min', 5)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('health-wellness-series', 'health-wellness-series-stress', 'Stress', 'A practical guide to stress within health & wellness.', '10 min', 6),
  ('health-wellness-series', 'health-wellness-series-acceptance', 'Acceptance', 'A practical guide to acceptance within health & wellness.', '10 min', 7),
  ('health-wellness-series', 'health-wellness-series-money', 'Money', 'A practical guide to money within health & wellness.', '10 min', 8)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- KEY CONCEPTS SERIES
-- ============================================================================
INSERT INTO learning_series (series_key, title, summary, description, icon, sort_order) VALUES
  ('key-concepts-series', 'Key Concepts', 'The methods and pitfalls that appear across relationship science and real-life practice.', 'A research-backed series on key concepts.', '📎', 9)
ON CONFLICT (series_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('key-concepts-series', 'key-concepts-series-emotional-calls', 'Emotional Calls', 'A practical guide to emotional calls within key concepts.', '8 min', 1),
  ('key-concepts-series', 'key-concepts-series-empathy', 'Empathy', 'A practical guide to empathy within key concepts.', '8 min', 2),
  ('key-concepts-series', 'key-concepts-series-appreciation', 'Appreciation', 'A practical guide to appreciation within key concepts.', '8 min', 3),
  ('key-concepts-series', 'key-concepts-series-inner-world', 'Inner World', 'A practical guide to inner world within key concepts.', '8 min', 4),
  ('key-concepts-series', 'key-concepts-series-interdependence', 'Interdependence', 'A practical guide to interdependence within key concepts.', '8 min', 5)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('key-concepts-series', 'key-concepts-series-rituals', 'Rituals', 'A practical guide to rituals within key concepts.', '8 min', 6),
  ('key-concepts-series', 'key-concepts-series-sacrifice', 'Sacrifice', 'A practical guide to sacrifice within key concepts.', '8 min', 7),
  ('key-concepts-series', 'key-concepts-series-shared-meaning', 'Shared Meaning', 'A practical guide to shared meaning within key concepts.', '8 min', 8),
  ('key-concepts-series', 'key-concepts-series-speaking-equation', 'Speaking Equation', 'A practical guide to speaking equation within key concepts.', '8 min', 9),
  ('key-concepts-series', 'key-concepts-series-we-language', 'We Language', 'A practical guide to we language within key concepts.', '8 min', 10)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('key-concepts-series', 'key-concepts-series-contempt', 'Contempt', 'A practical guide to contempt within key concepts.', '8 min', 11),
  ('key-concepts-series', 'key-concepts-series-flooding', 'Flooding', 'A practical guide to flooding within key concepts.', '8 min', 12),
  ('key-concepts-series', 'key-concepts-series-neuroplasticity', 'Neuroplasticity', 'A practical guide to neuroplasticity within key concepts.', '8 min', 13),
  ('key-concepts-series', 'key-concepts-series-perpetual-problems', 'Perpetual Problems', 'A practical guide to perpetual problems within key concepts.', '8 min', 14),
  ('key-concepts-series', 'key-concepts-series-repair', 'Repair', 'A practical guide to repair within key concepts.', '8 min', 15)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('key-concepts-series', 'key-concepts-series-boundaries', 'Boundaries', 'A practical guide to boundaries within key concepts.', '8 min', 16),
  ('key-concepts-series', 'key-concepts-series-attunement', 'Attunement', 'A practical guide to attunement within key concepts.', '8 min', 17),
  ('key-concepts-series', 'key-concepts-series-consistency', 'Consistency', 'A practical guide to consistency within key concepts.', '8 min', 18)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- REPAIR & COMMUNICATION SERIES
-- ============================================================================
INSERT INTO learning_series (series_key, title, summary, description, icon, sort_order) VALUES
  ('repair-and-communication', 'Repair & Communication', 'How to start hard conversations, listen well, set boundaries, and build shared rhythm.', 'A research-backed series on repair and communication.', '🔧', 10)
ON CONFLICT (series_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('repair-and-communication', 'rc-1', 'Soft Startups and Hard Conversations', 'Learn how to raise difficult topics without triggering instant defensiveness.', '12 min', 1)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key, module_key, title, summary, duration, sort_order) VALUES
  ('repair-and-communication', 'rc-2', 'Listening, Validation, and Repair Language', 'Learn the skills that make people feel understood before solutions start.', '11 min', 2),
  ('repair-and-communication', 'rc-3', 'Boundaries, Autonomy, and Trust Repair', 'Use boundaries to protect connection instead of using them to create distance.', '13 min', 3),
  ('repair-and-communication', 'rc-4', 'Rituals, Desire, and Shared Rhythm', 'Create repeatable habits that keep intimacy and connection from fading into routine.', '12 min', 4)
ON CONFLICT (series_key, module_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration = EXCLUDED.duration,
  sort_order = EXCLUDED.sort_order;