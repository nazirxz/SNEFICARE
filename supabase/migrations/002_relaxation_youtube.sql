-- Migrasi: relaxation_tracks dari streaming audio → YouTube iframe
-- Drop kolom yang tidak lagi dipakai dan tambah youtube_video_id.
-- Seed ulang setelah migrasi: `npm run seed`

BEGIN;

ALTER TABLE public.relaxation_tracks
  ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;

-- Kosongkan data lama (audio_url sudah tidak valid untuk player baru)
TRUNCATE TABLE public.relaxation_tracks;

ALTER TABLE public.relaxation_tracks
  ALTER COLUMN youtube_video_id SET NOT NULL;

ALTER TABLE public.relaxation_tracks
  DROP COLUMN IF EXISTS audio_url,
  DROP COLUMN IF EXISTS thumbnail_url;

COMMIT;
