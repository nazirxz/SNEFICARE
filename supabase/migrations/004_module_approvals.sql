-- =============================================================
-- Migration 004: Persetujuan per-modul dalam satu sesi
-- -------------------------------------------------------------
-- Menambah kolom `module_approvals` (jsonb) di session_records.
-- Struktur:
--   {
--     "musik":    { "status": "menunggu"|"disetujui"|"ditolak",
--                   "submitted_at": "...",
--                   "approved_at": "...",
--                   "approved_by": "<uuid>",
--                   "note": "..." },
--     "afirmasi": { ... sama seperti di atas ... }
--   }
-- Modul yang membutuhkan approval: "musik" dan "afirmasi" saja.
-- Edukasi dan Refleksi tetap tanpa approval per-modul
-- (Refleksi masuk ke approval sesi secara keseluruhan).
-- =============================================================

BEGIN;

ALTER TABLE public.session_records
  ADD COLUMN IF NOT EXISTS module_approvals JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.session_records.module_approvals IS
  'Status persetujuan per-modul (musik, afirmasi) dalam sesi';

COMMIT;
