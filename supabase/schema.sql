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
-- TRIGGER: Auto-buat profile saat user baru signup
-- Baca role dan name dari raw_user_meta_data
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
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Profiles: user baca/update milik sendiri
CREATE POLICY "profiles: self read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: self update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Profiles: perawat bisa baca semua (untuk dashboard)
CREATE POLICY "profiles: nurse read all"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.nurses WHERE id = auth.uid()));

-- Nurses: baca milik sendiri
CREATE POLICY "nurses: self read"
  ON public.nurses FOR SELECT
  USING (auth.uid() = id);

-- Nurses: pasien bisa baca perawat yang assign ke mereka
CREATE POLICY "nurses: patient reads assigned nurse"
  ON public.nurses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = auth.uid() AND p.nurse_id = nurses.id
  ));

-- Patients: pasien baca/update data sendiri
CREATE POLICY "patients: self"
  ON public.patients FOR ALL
  USING (auth.uid() = id);

-- Patients: perawat bisa baca semua pasien
CREATE POLICY "patients: nurse read all"
  ON public.patients FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.nurses WHERE id = auth.uid()));

-- Patients: perawat bisa insert pasien baru (saat registrasi)
CREATE POLICY "patients: nurse insert"
  ON public.patients FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.nurses WHERE id = auth.uid()));

-- Patients: perawat bisa update current_day (setelah approve sesi)
CREATE POLICY "patients: nurse update day"
  ON public.patients FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.nurses WHERE id = auth.uid()));


-- =============================================================
-- SEED AKUN PERAWAT (jalankan setelah membuat akun auth manual)
-- =============================================================
-- Catatan: buat dulu user di Supabase Dashboard →
--   Authentication → Users → Add User
--   Email: ns.kartini@sneficare.internal  Password: kartini123
--   Email: ns.budi@sneficare.internal     Password: budi123
--
-- Setelah itu jalankan SQL ini dengan mengganti UUID yang sesuai:
--
-- INSERT INTO public.nurses (id, nip, department)
-- VALUES
--   ('<UUID ns.kartini dari auth.users>', 'NIP001', 'Onkologi'),
--   ('<UUID ns.budi dari auth.users>',    'NIP002', 'Onkologi');
