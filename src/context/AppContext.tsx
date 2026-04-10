import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Patient, Nurse, SessionRecord } from "../data/mockData";
import type { PatientQuestionnaireBundle, QuestionnaireSubmission } from "../data/researchQuestionnaire";

export type UserRole = "pasien" | "perawat";

export interface CreatePatientData {
  name: string;
  username: string;
  password: string;
  age: number;
  diagnosis: string;
  chemoCycle: string;
  phone: string;
  startDate: string;
}

export interface PendingApproval {
  patient: Patient;
  session: SessionRecord;
}

interface AppContextType {
  currentUser: Patient | Nurse | null;
  userRole: UserRole | null;
  isHydrating: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; role?: UserRole }>;
  logout: () => Promise<void>;
  createPatient: (data: CreatePatientData) => Promise<{ success: boolean; error?: string }>;
  getPatientSessions: (patientId: string) => SessionRecord[];
  completeSession: (patientId: string, record: SessionRecord) => void;
  approveSession: (patientId: string, day: number, status: "disetujui" | "ditolak", note?: string) => void;
  getEffectiveCurrentDay: (patientId: string) => number;
  getPendingApprovals: () => PendingApproval[];
  getAllPatients: () => Patient[];
  getPatientById: (id: string) => Patient | undefined;
  getQuestionnaireBundle: (patientId: string) => PatientQuestionnaireBundle;
  saveQuestionnaireSubmission: (patientId: string, submission: QuestionnaireSubmission) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Patient | Nurse | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [patientsState, setPatientsState] = useState<Patient[]>([]);
  const [sessionsByPatient, setSessionsByPatient] = useState<Record<string, SessionRecord[]>>({});
  const [questionnairesByPatient, setQuestionnairesByPatient] = useState<Record<string, PatientQuestionnaireBundle>>({});

  const mapPatientRow = useCallback((row: any, profileName: string): Patient => {
    return {
      id: row.id,
      name: profileName,
      age: row.age ?? 0,
      diagnosis: row.diagnosis ?? "",
      chemoCycle: row.chemo_cycle ?? "",
      startDate: row.start_date ?? new Date().toISOString().split("T")[0],
      currentDay: row.current_day ?? 1,
      username: row.username_display ?? "",
      password: "",
      phone: row.phone ?? "",
      sessions: [],
    };
  }, []);

  const mapNurseRow = useCallback((row: any, profileName: string, username: string): Nurse => {
    return {
      id: row.id,
      name: profileName,
      nip: row.nip ?? "",
      department: row.department ?? "",
      username,
      password: "",
    };
  }, []);

  const fetchSessionsMap = useCallback(async (patientIds: string[]) => {
    if (patientIds.length === 0) return {} as Record<string, SessionRecord[]>;

    const { data: sessionRows, error: sessionError } = await supabase
      .from("session_records")
      .select("*")
      .in("patient_id", patientIds)
      .order("day", { ascending: true });

    if (sessionError) throw new Error(`Gagal mengambil session_records: ${sessionError.message}`);

    const rows = sessionRows ?? [];
    const sessionIds = rows.map((r: any) => r.id);
    const answerBySession: Record<string, Record<string, string>> = {};

    if (sessionIds.length > 0) {
      const { data: answerRows, error: answerError } = await supabase
        .from("reflection_answers")
        .select("session_id, question_id, answer_text")
        .in("session_id", sessionIds);

      if (answerError) throw new Error(`Gagal mengambil reflection_answers: ${answerError.message}`);

      (answerRows ?? []).forEach((a: any) => {
        if (!answerBySession[a.session_id]) answerBySession[a.session_id] = {};
        answerBySession[a.session_id][a.question_id] = a.answer_text ?? "";
      });
    }

    const map: Record<string, SessionRecord[]> = {};
    patientIds.forEach((id) => { map[id] = []; });

    rows.forEach((r: any) => {
      const item: SessionRecord = {
        day: r.day,
        status: r.status,
        approvalStatus: r.approval_status ?? undefined,
        approvalNote: r.approval_note ?? undefined,
        approvedAt: r.approved_at ?? undefined,
        completedAt: r.completed_at ?? undefined,
        durationMinutes: r.duration_minutes ?? undefined,
        mood: r.mood ?? undefined,
        modulesCompleted: r.modules_completed ?? undefined,
        afirmasiNote: r.affirmation_note ?? undefined,
        affirmationAudioUrl: r.affirmation_audio_path ?? undefined,
        refleksiAnswers: answerBySession[r.id] ?? undefined,
      };
      if (!map[r.patient_id]) map[r.patient_id] = [];
      map[r.patient_id].push(item);
    });

    Object.keys(map).forEach((k) => {
      map[k] = map[k].sort((a, b) => a.day - b.day);
    });
    return map;
  }, []);

  const fetchQuestionnaireMap = useCallback(async (patientIds: string[]) => {
    if (patientIds.length === 0) return {} as Record<string, PatientQuestionnaireBundle>;

    const { data, error } = await supabase
      .from("questionnaire_submissions")
      .select("*")
      .in("patient_id", patientIds);

    if (error) throw new Error(`Gagal mengambil questionnaire_submissions: ${error.message}`);

    const map: Record<string, PatientQuestionnaireBundle> = {};
    (data ?? []).forEach((q: any) => {
      if (!map[q.patient_id]) map[q.patient_id] = {};
      const phase: "pre" | "post" | null =
        q.phase === "pre" || q.phase === "post" ? q.phase : null;
      const submission: QuestionnaireSubmission = {
        phase: phase ?? "pre",
        demographics: {
          respondentNumberNote: q.demo_respondent_note ?? "",
          initials: q.demo_initials ?? "",
          age: q.demo_age ?? "",
          sex: q.demo_sex ?? "",
          education: q.demo_education ?? "",
          occupation: q.demo_occupation ?? "",
          religion: q.demo_religion ?? "",
          ethnicity: q.demo_ethnicity ?? "",
        },
        scores: q.scores ?? [],
        submittedAt: q.submitted_at ?? new Date().toISOString(),
      };
      if (phase) {
        map[q.patient_id][phase] = submission;
      }
    });
    return map;
  }, []);

  const loadPatientScope = useCallback(async (patientUserId: string, profileName: string, profileRow: any) => {
    const { data: patientRow, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientUserId)
      .single();
    if (patientError) throw new Error(`Gagal mengambil profil pasien: ${patientError.message}`);

    const patient = mapPatientRow(patientRow, profileName);
    setCurrentUser(patient);
    setUserRole("pasien");
    setPatientsState([patient]);

    const [sessionMap, questionnaireMap] = await Promise.all([
      fetchSessionsMap([patientUserId]),
      fetchQuestionnaireMap([patientUserId]),
    ]);
    setSessionsByPatient(sessionMap);
    setQuestionnairesByPatient(questionnaireMap);
  }, [fetchQuestionnaireMap, fetchSessionsMap, mapPatientRow]);

  const loadNurseScope = useCallback(async (nurseUserId: string, profileName: string, username: string) => {
    const { data: nurseRow, error: nurseError } = await supabase
      .from("nurses")
      .select("*")
      .eq("id", nurseUserId)
      .single();
    if (nurseError) throw new Error(`Gagal mengambil profil perawat: ${nurseError.message}`);

    const nurse = mapNurseRow(nurseRow, profileName, username);
    setCurrentUser(nurse);
    setUserRole("perawat");

    const { data: patientRows, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("nurse_id", nurseUserId)
      .order("created_at", { ascending: true });
    if (patientError) throw new Error(`Gagal mengambil daftar pasien: ${patientError.message}`);

    const ids = (patientRows ?? []).map((p: any) => p.id);
    const profileMap: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", ids);
      if (profileError) throw new Error(`Gagal mengambil nama pasien: ${profileError.message}`);
      (profileRows ?? []).forEach((pr: any) => {
        profileMap[pr.id] = pr.name ?? "";
      });
    }

    const patients = (patientRows ?? []).map((p: any) => mapPatientRow(p, profileMap[p.id] ?? ""));
    setPatientsState(patients);

    const [sessionMap, questionnaireMap] = await Promise.all([
      fetchSessionsMap(ids),
      fetchQuestionnaireMap(ids),
    ]);
    setSessionsByPatient(sessionMap);
    setQuestionnairesByPatient(questionnaireMap);
  }, [fetchQuestionnaireMap, fetchSessionsMap, mapNurseRow, mapPatientRow]);

  const loadFromSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const userId = session.user.id;
    const username = (session.user.email ?? "").split("@")[0];
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (profileError || !profile) return;

    const role = profile.role as UserRole;
    const profileName = profile.name ?? "";
    if (role === "pasien") {
      await loadPatientScope(userId, profileName, profile);
    } else if (role === "perawat") {
      await loadNurseScope(userId, profileName, username);
    }
  }, [loadNurseScope, loadPatientScope]);

  useEffect(() => {
    (async () => {
      try {
        await loadFromSession();
      } catch (err) {
        console.warn("Gagal memulihkan sesi:", err);
      } finally {
        setIsHydrating(false);
      }
    })();
  }, [loadFromSession]);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; role?: UserRole }> => {
    const email = `${username.trim()}@sneficare.internal`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { success: false };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();
    if (profileError || !profile) return { success: false };

    const role = profile.role as UserRole;
    const profileName = profile.name ?? "";
    if (role === "pasien") {
      await loadPatientScope(data.user.id, profileName, profile);
      return { success: true, role: "pasien" };
    }
    if (role === "perawat") {
      await loadNurseScope(data.user.id, profileName, username.trim());
      return { success: true, role: "perawat" };
    }
    return { success: false };
  }, [loadNurseScope, loadPatientScope]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUserRole(null);
    setPatientsState([]);
    setSessionsByPatient({});
    setQuestionnairesByPatient({});
  }, []);

  const createPatient = useCallback(async (data: CreatePatientData): Promise<{ success: boolean; error?: string }> => {
    const { data: { session: nurseSession } } = await supabase.auth.getSession();
    const nurseId = nurseSession?.user?.id;
    if (!nurseSession || !nurseId) return { success: false, error: "Sesi perawat tidak ditemukan" };

    const email = `${data.username.trim()}@sneficare.internal`;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: { data: { role: "pasien", name: data.name.trim() } },
    });

    if (signUpError || !signUpData.user) return { success: false, error: signUpError?.message ?? "Gagal membuat akun" };

    const patientUserId = signUpData.user.id;

    await supabase.auth.setSession({
      access_token: nurseSession.access_token,
      refresh_token: nurseSession.refresh_token,
    });

    const { error: patientError } = await supabase.from("patients").insert({
      id: patientUserId,
      username_display: data.username.trim(),
      age: data.age,
      diagnosis: data.diagnosis,
      chemo_cycle: data.chemoCycle,
      phone: data.phone,
      start_date: data.startDate,
      current_day: 1,
      nurse_id: nurseId,
    });

    if (patientError) return { success: false, error: "Akun dibuat tapi gagal menyimpan data: " + patientError.message };

    if (userRole === "perawat" && currentUser?.id === nurseId) {
      try {
        await loadNurseScope(nurseId, (currentUser as Nurse).name, (currentUser as Nurse).username);
      } catch (err: any) {
        return { success: false, error: `Pasien dibuat, tapi gagal refresh daftar: ${err.message}` };
      }
    }

    return { success: true };
  }, [currentUser, loadNurseScope, userRole]);

  const getPatientSessions = useCallback((patientId: string): SessionRecord[] => {
    return sessionsByPatient[patientId] ?? [];
  }, [sessionsByPatient]);

  const completeSession = useCallback((patientId: string, record: SessionRecord) => {
    (async () => {
      const payload = {
        patient_id: patientId,
        day: record.day,
        status: record.status,
        approval_status: "menunggu",
        completed_at: record.completedAt ?? null,
        duration_minutes: record.durationMinutes ?? null,
        mood: record.mood ?? null,
        modules_completed: record.modulesCompleted ?? null,
        affirmation_note: record.afirmasiNote ?? null,
        affirmation_audio_path: record.affirmationAudioUrl ?? null,
      };

      const { data: sessionRow, error: sessionError } = await supabase
        .from("session_records")
        .upsert(payload, { onConflict: "patient_id,day" })
        .select("id")
        .single();
      if (sessionError) throw new Error(sessionError.message);

      const answers = Object.entries(record.refleksiAnswers ?? {})
        .filter(([, text]) => text.trim() !== "")
        .map(([questionId, answerText]) => ({
          session_id: sessionRow.id,
          question_id: questionId,
          answer_text: answerText,
        }));
      if (answers.length > 0) {
        const { error: answerError } = await supabase
          .from("reflection_answers")
          .upsert(answers, { onConflict: "session_id,question_id" });
        if (answerError) throw new Error(answerError.message);
      }

      const finalRecord: SessionRecord = { ...record, approvalStatus: "menunggu" };
      setSessionsByPatient((prev) => {
        const list = [...(prev[patientId] ?? [])];
        const idx = list.findIndex((s) => s.day === record.day);
        if (idx >= 0) list[idx] = finalRecord;
        else list.push(finalRecord);
        list.sort((a, b) => a.day - b.day);
        return { ...prev, [patientId]: list };
      });
    })().catch((err) => {
      console.warn("Gagal menyimpan sesi:", err);
    });
  }, []);

  const approveSession = useCallback((patientId: string, day: number, status: "disetujui" | "ditolak", note?: string) => {
    (async () => {
      const approvedAt = status === "disetujui" ? new Date().toISOString() : null;
      const { error: updateError } = await supabase
        .from("session_records")
        .update({
          approval_status: status,
          approval_note: note ?? null,
          approved_by: userRole === "perawat" ? currentUser?.id ?? null : null,
          approved_at: approvedAt,
        })
        .eq("patient_id", patientId)
        .eq("day", day);
      if (updateError) throw new Error(updateError.message);

      setSessionsByPatient((prev) => {
        const list = [...(prev[patientId] ?? [])];
        const idx = list.findIndex((s) => s.day === day);
        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            approvalStatus: status,
            approvalNote: note ?? "",
            approvedAt: approvedAt ?? undefined,
          };
        }
        return { ...prev, [patientId]: list };
      });

      if (status === "disetujui") {
        setPatientsState((prev) => {
          const next = prev.map((p) => {
            if (p.id !== patientId) return p;
            const newDay = Math.min(Math.max(p.currentDay, day + 1), 15);
            return { ...p, currentDay: newDay };
          });
          return next;
        });
        const patient = patientsState.find((p) => p.id === patientId);
        const currentDbDay = patient?.currentDay ?? 1;
        const newDay = Math.min(Math.max(currentDbDay, day + 1), 15);
        const { error: dayError } = await supabase
          .from("patients")
          .update({ current_day: newDay })
          .eq("id", patientId);
        if (dayError) throw new Error(dayError.message);
      }
    })().catch((err) => {
      console.warn("Gagal memproses approval sesi:", err);
    });
  }, [currentUser?.id, patientsState, userRole]);

  const getEffectiveCurrentDay = useCallback((patientId: string): number => {
    const p = patientsState.find((x) => x.id === patientId);
    return p?.currentDay ?? 1;
  }, [patientsState]);

  const getPendingApprovals = useCallback((): PendingApproval[] => {
    const result: PendingApproval[] = [];
    patientsState.forEach((p) => {
      const sessions = getPatientSessions(p.id);
      sessions.forEach((s) => {
        if (s.approvalStatus === "menunggu") result.push({ patient: p, session: s });
      });
    });
    return result;
  }, [getPatientSessions, patientsState]);

  const getAllPatients = useCallback(() => patientsState, [patientsState]);
  const getPatientById = useCallback((id: string) => patientsState.find((p) => p.id === id), [patientsState]);
  const getQuestionnaireBundle = useCallback(
    (patientId: string) => questionnairesByPatient[patientId] ?? {},
    [questionnairesByPatient]
  );

  const saveQuestionnaireSubmission = useCallback((patientId: string, submission: QuestionnaireSubmission) => {
    (async () => {
      const { error } = await supabase
        .from("questionnaire_submissions")
        .upsert(
          {
            patient_id: patientId,
            phase: submission.phase,
            demo_respondent_note: submission.demographics.respondentNumberNote ?? null,
            demo_initials: submission.demographics.initials ?? null,
            demo_age: submission.demographics.age ?? null,
            demo_sex: submission.demographics.sex ?? null,
            demo_education: submission.demographics.education ?? null,
            demo_occupation: submission.demographics.occupation ?? null,
            demo_religion: submission.demographics.religion ?? null,
            demo_ethnicity: submission.demographics.ethnicity ?? null,
            scores: submission.scores,
            submitted_at: submission.submittedAt,
          },
          { onConflict: "patient_id,phase" }
        );
      if (error) throw new Error(error.message);

      setQuestionnairesByPatient((prev) => {
        const cur = prev[patientId] ?? {};
        const nextBundle: PatientQuestionnaireBundle = { ...cur, [submission.phase]: submission };
        return { ...prev, [patientId]: nextBundle };
      });
    })().catch((err) => {
      console.warn("Gagal menyimpan kuesioner:", err);
    });
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, userRole, isHydrating, login, logout, createPatient,
      getPatientSessions, completeSession, approveSession,
      getEffectiveCurrentDay, getPendingApprovals,
      getAllPatients, getPatientById,
      getQuestionnaireBundle, saveQuestionnaireSubmission,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
