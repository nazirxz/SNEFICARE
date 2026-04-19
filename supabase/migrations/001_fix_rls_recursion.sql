-- =============================================================
-- Migration 001: Fix RLS infinite recursion antara profiles/nurses/patients
-- Jalankan di Supabase SQL Editor
-- =============================================================

-- 1. Helper functions dengan SECURITY DEFINER (bypass RLS saat cek role)
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

-- 2. Replace semua policy yang bikin loop

-- Profiles
DROP POLICY IF EXISTS "profiles: nurse read all" ON public.profiles;
CREATE POLICY "profiles: nurse read all"
  ON public.profiles FOR SELECT
  USING (public.is_nurse(auth.uid()));

-- Nurses
DROP POLICY IF EXISTS "nurses: patient reads assigned" ON public.nurses;
CREATE POLICY "nurses: patient reads assigned"
  ON public.nurses FOR SELECT
  USING (public.is_assigned_nurse(auth.uid(), nurses.id));

-- Patients
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
DROP POLICY IF EXISTS "session_records: nurse read all" ON public.session_records;
CREATE POLICY "session_records: nurse read all"
  ON public.session_records FOR SELECT
  USING (public.is_nurse(auth.uid()));

DROP POLICY IF EXISTS "session_records: nurse approve" ON public.session_records;
CREATE POLICY "session_records: nurse approve"
  ON public.session_records FOR UPDATE
  USING (public.is_nurse(auth.uid()));

-- Reflection Answers
DROP POLICY IF EXISTS "reflection_answers: nurse read" ON public.reflection_answers;
CREATE POLICY "reflection_answers: nurse read"
  ON public.reflection_answers FOR SELECT
  USING (public.is_nurse(auth.uid()));

-- Questionnaire Submissions
DROP POLICY IF EXISTS "questionnaire: nurse read all" ON public.questionnaire_submissions;
CREATE POLICY "questionnaire: nurse read all"
  ON public.questionnaire_submissions FOR SELECT
  USING (public.is_nurse(auth.uid()));
