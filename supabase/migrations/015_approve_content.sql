-- 015: content approval.
--
-- The drafted content from migrations 012 and 013 was reviewed and approved on 2026-09-23
-- (review doc: "Bond Content Review (Draft)"). Marks every row that is still a draft as
-- approved. Content added by later migrations arrives as 'draft' and needs its own approval.
--
-- Run after 012 and 013. Safe to re-run.

UPDATE learning_series SET review_status = 'approved' WHERE review_status = 'draft';
UPDATE learning_series_modules SET review_status = 'approved' WHERE review_status = 'draft';
UPDATE activities SET review_status = 'approved' WHERE review_status = 'draft';
UPDATE daily_questions SET review_status = 'approved' WHERE review_status = 'draft';
UPDATE check_in_topics SET review_status = 'approved' WHERE review_status = 'draft';
UPDATE deep_dive_themes SET review_status = 'approved' WHERE review_status = 'draft';
