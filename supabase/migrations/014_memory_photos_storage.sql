-- 014: private storage for Memory Lane photos.
--
-- Photos live in the private `memory-photos` bucket at `<couple_unit_id>/<file>`. Only members of
-- that couple can read, upload, or delete them; the app shows them through short-lived signed URLs.
-- memory_lane.photo_url stores the object path (not a public URL).
--
-- Safe to re-run.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('memory-photos', 'memory-photos', FALSE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- The couple a photo belongs to = the first folder of its path; NULL when that isn't a UUID,
-- so a malformed path fails the policy instead of raising a cast error.
CREATE OR REPLACE FUNCTION public.memory_photo_couple(object_name TEXT)
RETURNS UUID
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN split_part(object_name, '/', 1) ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    THEN split_part(object_name, '/', 1)::uuid
  END
$$;
GRANT EXECUTE ON FUNCTION public.memory_photo_couple(TEXT) TO authenticated;

DROP POLICY IF EXISTS memory_photos_select ON storage.objects;
CREATE POLICY memory_photos_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'memory-photos' AND public.is_couple_member(public.memory_photo_couple(name)));

DROP POLICY IF EXISTS memory_photos_insert ON storage.objects;
CREATE POLICY memory_photos_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'memory-photos' AND public.is_couple_member(public.memory_photo_couple(name)));

DROP POLICY IF EXISTS memory_photos_delete ON storage.objects;
CREATE POLICY memory_photos_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'memory-photos' AND public.is_couple_member(public.memory_photo_couple(name)));
