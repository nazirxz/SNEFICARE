-- =============================================================
-- SNEfi Care — Database Schema
-- Jalankan file ini di Supabase SQL Editor (satu kali)
-- =============================================================

-- -------------------------------------------------------------
-- TABEL PROFILES
-- Satu baris per user (pasien maupun perawat)
-- Otomatis dibuat via trigger saat user signup
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('pasien', 'perawat')),
  name        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- TABEL NURSES
-- Data tambahan khusus perawat
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nurses (
  id          UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  nip         TEXT UNIQUE,
  department  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- TABEL PATIENTS
-- Data klinis dan program pasien
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patients (
  id                UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  username_display  TEXT NOT NULL UNIQUE,
  age               INTEGER,
  diagnosis         TEXT,
  chemo_cycle       TEXT,
  phone             TEXT,
  start_date        DATE DEFAULT CURRENT_DATE,
  current_day       INTEGER NOT NULL DEFAULT 1 CHECK (current_day BETWEEN 1 AND 15),
  nurse_id          UUID REFERENCES public.nurses(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- TABEL SESSION_RECORDS
-- Rekaman sesi harian pasien (maks 15 per pasien)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.session_records (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id              UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  day                     INTEGER NOT NULL CHECK (day BETWEEN 1 AND 15),
  status                  TEXT NOT NULL DEFAULT 'belum'
                            CHECK (status IN ('belum', 'berlangsung', 'selesai')),
  approval_status         TEXT
                            CHECK (approval_status IN ('menunggu', 'disetujui', 'ditolak')),
  approval_note           TEXT,
  approved_by             UUID REFERENCES public.nurses(id),
  approved_at             TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ,
  duration_minutes        INTEGER,
  mood                    INTEGER CHECK (mood BETWEEN 1 AND 5),
  modules_completed       TEXT[],
  affirmation_note        TEXT,
  affirmation_audio_path  TEXT,
  module_approvals        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, day)
);

-- -------------------------------------------------------------
-- TABEL REFLECTION_ANSWERS
-- Jawaban refleksi per pertanyaan per sesi
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reflection_answers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES public.session_records(id) ON DELETE CASCADE,
  question_id   TEXT NOT NULL,
  answer_text   TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

-- -------------------------------------------------------------
-- TABEL QUESTIONNAIRE_SUBMISSIONS
-- Kuesioner SMSES-BC pre dan post test
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questionnaire_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  phase                 TEXT NOT NULL CHECK (phase IN ('pre', 'post')),
  demo_respondent_note  TEXT,
  demo_initials         TEXT,
  demo_age              TEXT,
  demo_sex              TEXT,
  demo_education        TEXT,
  demo_occupation       TEXT,
  demo_religion         TEXT,
  demo_ethnicity        TEXT,
  scores                INTEGER[] NOT NULL,
  submitted_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, phase)
);

-- -------------------------------------------------------------
-- TABEL PROGRAM_SESSIONS
-- Master konten 15 sesi program
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.program_sessions (
  day                       INTEGER PRIMARY KEY CHECK (day BETWEEN 1 AND 15),
  title                     TEXT NOT NULL,
  theme                     TEXT NOT NULL,
  color_from                TEXT NOT NULL,
  color_to                  TEXT NOT NULL,
  edukasi_title             TEXT NOT NULL,
  edukasi_content           TEXT[] NOT NULL DEFAULT '{}',
  edukasi_key_points        TEXT[] NOT NULL DEFAULT '{}',
  musik_title               TEXT NOT NULL,
  musik_description         TEXT NOT NULL DEFAULT '',
  musik_duration            INTEGER NOT NULL DEFAULT 300,
  musik_type                TEXT NOT NULL DEFAULT 'Relaksasi',
  afirmasi_title            TEXT NOT NULL,
  afirmasi_main_text        TEXT NOT NULL DEFAULT '',
  afirmasi_support_text     TEXT NOT NULL DEFAULT '',
  afirmasi_instructions     TEXT NOT NULL DEFAULT '',
  afirmasi_positive_phrases TEXT[],
  refleksi_title            TEXT NOT NULL DEFAULT 'Refleksi Hari Ini',
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- TABEL PROGRAM_REFLECTION_QUESTIONS
-- Master pertanyaan refleksi tiap sesi
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.program_reflection_questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day          INTEGER NOT NULL REFERENCES public.program_sessions(day) ON DELETE CASCADE,
  question_id  TEXT NOT NULL,
  label        TEXT NOT NULL,
  placeholder  TEXT NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day, question_id)
);

-- -------------------------------------------------------------
-- TABEL QUESTIONNAIRE_QUESTIONS
-- Master item kuesioner SMSES-BC
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questionnaire_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_no     INTEGER NOT NULL UNIQUE,
  prompt      TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- TABEL RELAXATION_TRACKS
-- Master library suara relaksasi (diputar via YouTube iframe WebView)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.relaxation_tracks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  category         TEXT NOT NULL CHECK (category IN (
                     'ombak','hujan','hutan','sungai','air-terjun',
                     'burung','angin','musik','campuran'
                   )),
  youtube_video_id TEXT NOT NULL,
  duration_sec     INTEGER NOT NULL DEFAULT 300,
  license          TEXT,
  source_ref       TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- TRIGGER: Auto-buat profile saat user baru signup
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'pasien'),
    COALESCE(new.raw_user_meta_data->>'name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- -------------------------------------------------------------
-- HELPER FUNCTIONS (dipakai RLS policy agar tidak rekursif)
-- SECURITY DEFINER = bypass RLS saat cek role, mencegah infinite loop
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_nurse(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.nurses WHERE id = user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_nurse(user_id UUID, nurse_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients
    WHERE id = user_id AND nurse_id = nurse_user_id
  );
$$;

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------------
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurses                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_answers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_reflection_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relaxation_tracks      ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "profiles: self read" ON public.profiles;
CREATE POLICY "profiles: self read"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles: self update" ON public.profiles;
CREATE POLICY "profiles: self update"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles: nurse read all" ON public.profiles;
CREATE POLICY "profiles: nurse read all"
  ON public.profiles FOR SELECT
  USING (public.is_nurse(auth.uid()));

-- Nurses
DROP POLICY IF EXISTS "nurses: self read" ON public.nurses;
CREATE POLICY "nurses: self read"
  ON public.nurses FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "nurses: patient reads assigned" ON public.nurses;
CREATE POLICY "nurses: patient reads assigned"
  ON public.nurses FOR SELECT
  USING (public.is_assigned_nurse(auth.uid(), nurses.id));

-- Patients
DROP POLICY IF EXISTS "patients: self" ON public.patients;
CREATE POLICY "patients: self"
  ON public.patients FOR ALL USING (auth.uid() = id);
DROP POLICY IF EXISTS "patients: nurse read all" ON public.patients;
CREATE POLICY "patients: nurse read all"
  ON public.patients FOR SELECT
  USING (public.is_nurse(auth.uid()));
DROP POLICY IF EXISTS "patients: nurse insert" ON public.patients;
CREATE POLICY "patients: nurse insert"
  ON public.patients FOR INSERT
  WITH CHECK (public.is_nurse(auth.uid()));
DROP POLICY IF EXISTS "patients: nurse update" ON public.patients;
CREATE POLICY "patients: nurse update"
  ON public.patients FOR UPDATE
  USING (public.is_nurse(auth.uid()));

-- Session Records
DROP POLICY IF EXISTS "session_records: patient self" ON public.session_records;
CREATE POLICY "session_records: patient self"
  ON public.session_records FOR ALL USING (auth.uid() = patient_id);
DROP POLICY IF EXISTS "session_records: nurse read all" ON public.session_records;
CREATE POLICY "session_records: nurse read all"
  ON public.session_records FOR SELECT
  USING (public.is_nurse(auth.uid()));
DROP POLICY IF EXISTS "session_records: nurse approve" ON public.session_records;
CREATE POLICY "session_records: nurse approve"
  ON public.session_records FOR UPDATE
  USING (public.is_nurse(auth.uid()));

-- Reflection Answers
DROP POLICY IF EXISTS "reflection_answers: patient self" ON public.reflection_answers;
CREATE POLICY "reflection_answers: patient self"
  ON public.reflection_answers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.session_records sr
    WHERE sr.id = session_id AND sr.patient_id = auth.uid()
  ));
DROP POLICY IF EXISTS "reflection_answers: nurse read" ON public.reflection_answers;
CREATE POLICY "reflection_answers: nurse read"
  ON public.reflection_answers FOR SELECT
  USING (public.is_nurse(auth.uid()));

-- Questionnaire Submissions
DROP POLICY IF EXISTS "questionnaire: patient self" ON public.questionnaire_submissions;
CREATE POLICY "questionnaire: patient self"
  ON public.questionnaire_submissions FOR ALL USING (auth.uid() = patient_id);
DROP POLICY IF EXISTS "questionnaire: nurse read all" ON public.questionnaire_submissions;
CREATE POLICY "questionnaire: nurse read all"
  ON public.questionnaire_submissions FOR SELECT
  USING (public.is_nurse(auth.uid()));

-- Program sessions (read-only for authenticated users)
DROP POLICY IF EXISTS "program_sessions: authenticated read" ON public.program_sessions;
CREATE POLICY "program_sessions: authenticated read"
  ON public.program_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "program_reflection_questions: authenticated read" ON public.program_reflection_questions;
CREATE POLICY "program_reflection_questions: authenticated read"
  ON public.program_reflection_questions FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "questionnaire_questions: authenticated read" ON public.questionnaire_questions;
CREATE POLICY "questionnaire_questions: authenticated read"
  ON public.questionnaire_questions FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "relaxation_tracks: authenticated read" ON public.relaxation_tracks;
CREATE POLICY "relaxation_tracks: authenticated read"
  ON public.relaxation_tracks FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = TRUE);
