-- =============================================================
-- Migration 003: Storage bucket untuk rekaman afirmasi
-- -------------------------------------------------------------
-- Bucket privat "affirmation-recordings" dengan layout:
--   {patient_id}/{day}.m4a
-- Pasien: hanya boleh upload/baca folder miliknya sendiri.
-- Perawat: boleh baca semua rekaman (untuk playback di approval).
-- Akses file selalu lewat signed URL (bukan public URL).
-- =============================================================

BEGIN;

-- Buat bucket jika belum ada (privat)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'affirmation-recordings',
  'affirmation-recordings',
  FALSE,
  10485760,                       -- 10 MB per file
  ARRAY['audio/m4a','audio/mp4','audio/aac','audio/x-m4a']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bersihkan policy lama bila ada (idempoten)
DROP POLICY IF EXISTS "afirmasi: patient upload own" ON storage.objects;
DROP POLICY IF EXISTS "afirmasi: patient update own" ON storage.objects;
DROP POLICY IF EXISTS "afirmasi: patient read own" ON storage.objects;
DROP POLICY IF EXISTS "afirmasi: patient delete own" ON storage.objects;
DROP POLICY IF EXISTS "afirmasi: nurse read all" ON storage.objects;

-- Pasien bisa INSERT di folder miliknya
CREATE POLICY "afirmasi: patient upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'affirmation-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Pasien bisa UPDATE (overwrite) file miliknya (upsert re-record)
CREATE POLICY "afirmasi: patient update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'affirmation-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Pasien bisa SELECT file miliknya
CREATE POLICY "afirmasi: patient read own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'affirmation-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Pasien bisa DELETE file miliknya (retake)
CREATE POLICY "afirmasi: patient delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'affirmation-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Perawat boleh baca semua rekaman afirmasi
CREATE POLICY "afirmasi: nurse read all"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'affirmation-recordings'
    AND public.is_nurse(auth.uid())
  );

COMMIT;
