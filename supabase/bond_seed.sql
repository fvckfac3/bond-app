-- BOND seed: the assessments registry.
-- Requires bond_schema.sql to be run first.
--
-- Assessment questions and all individual/couple scoring live in the app
-- (mobile/utils/allAssessments.js, assessmentEngine.js, coupleAssessment.js); this table is only
-- the list of assessment ids that onboarding_assessments and assessment_sessions reference.
--
-- Editorial content is seeded by migrations, not here:
--   012_content_learning_library.sql      learning series and modules
--   013_content_activities_questions.sql  activities, daily questions, check-in topics, deep-dive themes

-- ============================================================
-- ASSESSMENTS (16)
-- ============================================================

INSERT INTO assessments (id,name,framework,description,estimated_time,questions_count,icon,category,intro_title,intro_description,result_description,scoring_mode,content_version) VALUES
  ('love-languages','Love Languages','Five Love Languages (Gary Chapman)','Discover how you and your partner prefer to give and receive love.','8 min',30,'❤️','connection','How do you experience love?','This reveals your primary love language and how you prefer to give and receive affection.','Your love language profile.','preference','v2'),
  ('attachment-style','Attachment Style','Attachment Theory (Bowlby & Ainsworth)','Understand your attachment patterns and how they shape your relationship.','6 min',20,'🔗','emotional','How do you connect emotionally?','Attachment style influences how you seek closeness, handle anxiety, and maintain independence.','Your attachment style.','quadrant','v2'),
  ('communication-style','Communication Style','Nonviolent Communication (Rosenberg)','Explore how you communicate needs, feelings, and boundaries.','5 min',15,'💬','communication','How do you express yourself?','Discover your strengths and growth areas.','Your communication profile.','profile','v2'),
  ('gottman-four-horsemen','Four Horsemen','Gottman Method','Identify destructive communication patterns.','7 min',20,'🐴','communication','Are hidden patterns hurting your connection?','The Four Horsemen are criticism, contempt, defensiveness, and stonewalling.','Understanding these patterns.','risk-profile','v2'),
  ('conflict-resolution','Conflict Resolution','Gottman Conflict Management','Discover your conflict resolution styles.','8 min',25,'⚡','conflict','How do you handle disagreements?','How you navigate moments of disagreement determines relationship health.','Your conflict style.','mixed-profile','v2'),
  ('values-alignment','Values Alignment','ACT','Explore shared values and life priorities.','10 min',30,'🎯','values','What truly matters to you both?','Shared values create shared purpose.','Your values profile.','profile','v2'),
  ('emotional-intelligence','Emotional Intelligence','Goleman EQ Model','Assess emotional awareness, regulation, and responsiveness.','8 min',24,'🧠','emotional','How well do you manage emotions?','High EQ is linked to stronger relationships.','Your EQ profile.','profile','v2'),
  ('intimacy-closeness','Intimacy & Closeness','Sternberg Triangular Theory','Measure emotional, physical, and intellectual intimacy.','9 min',27,'💕','intimacy','How intimate is your connection?','True intimacy combines emotional, physical, and intellectual depth.','Your intimacy profile.','profile','v2'),
  ('trust-vulnerability','Trust & Vulnerability','Brené Brown Research','Evaluate trust and comfort with vulnerability.','7 min',18,'🛡️','trust','How safe do you feel being vulnerable?','Trust is built through consistent vulnerability.','Your trust profile.','profile','v2'),
  ('financial-values','Financial Values','Financial Therapy','Understand money beliefs, spending, and communication.','8 min',22,'💰','values','How do your money values align?','Financial stress is a leading cause of relationship tension.','Your financial profile.','profile','v2'),
  ('sexual-compatibility','Sexual Compatibility','Sexual Health Models','Explore desires, boundaries, and sexual communication.','10 min',25,'🔥','intimacy','How aligned are your sexual needs?','Sexual compatibility requires openness, understanding, and mutual respect.','Your sexual compatibility.','profile','v2'),
  ('shared-meaning','Shared Meaning','Gottman Sound Relationship House','Build shared rituals, goals, and life dreams.','12 min',30,'🏡','connection','What shared story are you building?','Shared meaning gives you a joint vision for the future.','Your shared meaning profile.','profile','v2'),
  ('relationship-satisfaction','Relationship Satisfaction','RDAS','Overall relationship quality and satisfaction.','6 min',14,'⭐','general','How satisfied are you?','A complete picture of relationship wellness.','Your satisfaction profile.','profile','v2'),
  ('stress-coping','Stress & Coping','Lazarus & Folkman','How you handle stress as a couple.','7 min',20,'🌊','resilience','How do you navigate stress together?','Stress can strain or strengthen relationships.','Your stress coping profile.','profile','v2'),
  ('fun-personality','Fun & Personality','Leisure & Play Research','Explore how you enjoy time together.','6 min',18,'🎉','connection','How do you have fun together?','Play and laughter are essential for long-term satisfaction.','Your fun profile.','profile','v2'),
  ('appreciation-gratitude','Appreciation & Gratitude','Positive Psychology','How you express and receive appreciation.','5 min',15,'🙏','connection','Do you feel appreciated?','Gratitude is among the strongest predictors of satisfaction.','Your appreciation profile.','profile','v2')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,framework=EXCLUDED.framework,description=EXCLUDED.description,estimated_time=EXCLUDED.estimated_time,questions_count=EXCLUDED.questions_count,icon=EXCLUDED.icon,category=EXCLUDED.category,intro_title=EXCLUDED.intro_title,intro_description=EXCLUDED.intro_description,result_description=EXCLUDED.result_description,scoring_mode=EXCLUDED.scoring_mode,content_version=EXCLUDED.content_version;
