-- =============================================================
-- SNEfi Care — Database Schema
-- Jalankan file ini di Supabase SQL Editor (satu kali)
-- =============================================================

-- -------------------------------------------------------------
-- TABEL PROFILES
-- Satu baris per user (pasien maupun perawat)
-- Otomatis dibuat via trigger saat user signup
-- -------------------------------------------------------------
CREATE TABLE public.profiles (
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
CREATE TABLE public.nurses (
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
CREATE TABLE public.patients (
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
CREATE TABLE public.session_records (
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
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, day)
);

-- -------------------------------------------------------------
-- TABEL REFLECTION_ANSWERS
-- Jawaban refleksi per pertanyaan per sesi
-- -------------------------------------------------------------
CREATE TABLE public.reflection_answers (
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
CREATE TABLE public.questionnaire_submissions (
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------------
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurses                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_answers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_submissions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles: self read"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: self update"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles: nurse read all"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.nurses WHERE id = auth.uid()));

-- Nurses
CREATE POLICY "nurses: self read"
  ON public.nurses FOR SELECT USING (auth.uid() = id);
CREATE POLICY "nurses: patient reads assigned"
  ON public.nurses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = auth.uid() AND p.nurse_id = nurses.id
  ));

-- Patients
CREATE POLICY "patients: self"
  ON public.patients FOR ALL USING (auth.uid() = id);
CREATE POLICY "patients: nurse read all"
  ON public.patients FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.nurses WHERE id = auth.uid()));
CREATE POLICY "patients: nurse insert"
  ON public.patients FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.nurses WHERE id = auth.uid()));
CREATE POLICY "patients: nurse update"
  ON public.patients FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.nurses WHERE id = auth.uid()));

-- Session Records
CREATE POLICY "session_records: patient self"
  ON public.session_records FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "session_records: nurse read all"
  ON public.session_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.nurses WHERE id = auth.uid()));
CREATE POLICY "session_records: nurse approve"
  ON public.session_records FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.nurses WHERE id = auth.uid()));

-- Reflection Answers
CREATE POLICY "reflection_answers: patient self"
  ON public.reflection_answers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.session_records sr
    WHERE sr.id = session_id AND sr.patient_id = auth.uid()
  ));
CREATE POLICY "reflection_answers: nurse read"
  ON public.reflection_answers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.nurses WHERE id = auth.uid()));

-- Questionnaire Submissions
CREATE POLICY "questionnaire: patient self"
  ON public.questionnaire_submissions FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "questionnaire: nurse read all"
  ON public.questionnaire_submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.nurses WHERE id = auth.uid()));
