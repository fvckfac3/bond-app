-- 018: round-two content approval.
--
-- The round-two draft content added in migration 017 (two new learning series, 13 lessons,
-- 18 activities, 60 daily questions, 10 check-in topics, 4 deep-dive themes) was reviewed and
-- approved. Approves exactly those rows, by key, so content added later stays 'draft' until it
-- has its own review, whatever order this runs in.
--
-- Run after 017. Safe to re-run.

UPDATE learning_series SET review_status = 'approved' WHERE series_key IN (
  'getting-started-series',
  'hard-seasons-series'
);
UPDATE learning_series_modules SET review_status = 'approved' WHERE (series_key, module_key) IN (
  ('getting-started-series', 'how-bond-works'),
  ('getting-started-series', 'starting-from-strengths'),
  ('getting-started-series', 'talking-about-results'),
  ('getting-started-series', 'weekly-rhythm'),
  ('hard-seasons-series', 'grieving-together'),
  ('hard-seasons-series', 'family-plans-change'),
  ('hard-seasons-series', 'job-loss'),
  ('hard-seasons-series', 'aging-parents'),
  ('hard-seasons-series', 'after-a-big-fight'),
  ('trust-vulnerability-series', 'jealousy'),
  ('trust-vulnerability-series', 'digital-boundaries'),
  ('intimacy-series', 'initiating-declining'),
  ('intimacy-series', 'through-life-changes')
);
UPDATE activities SET review_status = 'approved' WHERE activity_key IN (
  'morning-check-in',
  'walk-and-talk',
  'weekend-huddle',
  'two-minute-rule',
  'mirror-validate-empathize',
  'name-the-cycle',
  'softened-replay',
  'admiration-text',
  'thank-you-tour',
  'bucket-list-brainstorm',
  'money-date',
  'stress-free-touch',
  'four-minute-gaze',
  'recreate-first-date',
  'learn-together',
  'game-night',
  'letter-to-future-us',
  'photo-memory-hunt'
);
UPDATE daily_questions SET review_status = 'approved' WHERE question IN (
  'What''s the best thing you ate this week?',
  'What''s something you''ve been proud of lately that you haven''t said out loud?',
  'What''s something you''ve never told anyone that you''d feel okay telling me?',
  'What''s something that made you feel capable today?',
  'How can I tell when you need space, and how can I tell when you need closeness?',
  'What''s a small moment from today you''d like to remember?',
  'What''s a fear about our relationship that you''d like us to face together?',
  'What''s a way we''ve grown as a team this year?',
  'What''s one thing I did recently that made your day easier?',
  'What do you most want to be remembered for?',
  'What''s something about how I grew up that you''d like to understand better?',
  'Where''s somewhere you feel completely relaxed?',
  'What''s a little ritual of ours that you''d miss if it stopped?',
  'When do you feel most appreciated by me?',
  'How do you want us to handle it when life gets really hard?',
  'What''s a skill you''d love us to learn together?',
  'What''s something you''d like to try in our relationship that we''ve never done?',
  'What''s something you want to tell me about your day that I didn''t ask?',
  'What''s a part of your past that still shapes how you love?',
  'What''s a moment when you felt really proud to be with me?',
  'If we had a theme night this week, what would it be?',
  'What kind of partner do you hope to be in ten years?',
  'What does a perfect Sunday look like for you now, compared with a few years ago?',
  'What''s one thing you''re curious about lately?',
  'What''s a nickname or inside joke of ours that still makes you smile?',
  'What helps you recharge after a hard day?',
  'When have you felt most accepted by me, exactly as you are?',
  'What''s something that made you proud of me recently?',
  'What''s one thing you''d like us to do more often as a couple?',
  'What would make this evening feel really good?',
  'What would you want to change about how we argue?',
  'What''s a tradition you''d like us to start?',
  'What''s a small thing that would make our home feel cozier?',
  'What does commitment mean to you right now?',
  'How do you like to be supported when you''re working toward a goal?',
  'What''s one thing you''re looking forward to this month?',
  'What''s a book, podcast or show you''d recommend to me right now?',
  'How has the way you show love changed since we met?',
  'What''s a dream you''re a little scared to say out loud?',
  'What''s something you did today just for yourself?',
  'What''s a worry you''ve been carrying this week?',
  'If you could relive one day of our relationship, which would it be?',
  'What''s something you''ve learned about love from us?',
  'What would you like more of in how we spend our free time?',
  'What made you feel cared for today, by anyone?',
  'When do you feel most like yourself with me?',
  'What do you think is our biggest strength as a couple?',
  'What was the highlight of your week so far?',
  'What''s your favorite way to spend a rainy day together?',
  'What''s a way you''d like to celebrate our next milestone?',
  'What''s a wound from the past you''d like help healing?',
  'What''s one habit you''d like to start this week?',
  'What''s something small that you''d like us to stop doing?',
  'Which friend would you like us to spend more time with?',
  'How do you want to be comforted when you''re scared?',
  'What''s one thing I could do this week that would mean a lot to you?',
  'What''s a meal you''d love me to make — or us to make together?',
  'What''s one thing you wish I understood about how you see yourself?',
  'What part of our routine feels most like home to you?',
  'What''s a place you''d love to show me?'
);
UPDATE check_in_topics SET review_status = 'approved' WHERE topic_key IN (
  'work-life',
  'friendships',
  'faith',
  'family-planning',
  'security',
  'forgiveness',
  'rest',
  'dreams',
  'hard-times',
  'sex-life'
);
UPDATE deep_dive_themes SET review_status = 'approved' WHERE theme_key IN (
  'play-adventure',
  'family-traditions',
  'growing-together',
  'rest-rhythm'
);
