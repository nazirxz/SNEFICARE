import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { patients, nurses, Patient, Nurse, SessionRecord } from "../data/mockData";
import {
  DEMO_POST_TEST_PATIENT_ID,
  getDemoPostTestPreSeed,
  type PatientQuestionnaireBundle,
  type QuestionnaireSubmission,
} from "../data/researchQuestionnaire";

export type UserRole = "pasien" | "perawat";

export interface PendingApproval {
  patient: Patient;
  session: SessionRecord;
}

interface AppContextType {
  currentUser: Patient | Nurse | null;
  userRole: UserRole | null;
  login: (username: string, password: string) => { success: boolean; role?: UserRole };
  logout: () => void;
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

const STORAGE_KEY = "snefi_care_auth";
const SESSIONS_KEY = "snefi_care_sessions";
const DAYS_KEY = "snefi_care_days";
const QUESTIONNAIRE_KEY = "snefi_care_questionnaires";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Patient | Nurse | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [sessionOverrides, setSessionOverrides] = useState<Record<string, SessionRecord[]>>({});
  const [patientDayOverrides, setPatientDayOverrides] = useState<Record<string, number>>({});
  const [questionnaireOverrides, setQuestionnaireOverrides] = useState<Record<string, PatientQuestionnaireBundle>>({});

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { userId, role } = JSON.parse(saved);
          if (role === "pasien") {
            const p = patients.find((x) => x.id === userId);
            if (p) { setCurrentUser(p); setUserRole("pasien"); }
          } else if (role === "perawat") {
            const n = nurses.find((x) => x.id === userId);
            if (n) { setCurrentUser(n); setUserRole("perawat"); }
          }
        }
        const savedSessions = await AsyncStorage.getItem(SESSIONS_KEY);
        if (savedSessions) setSessionOverrides(JSON.parse(savedSessions));
        const savedDays = await AsyncStorage.getItem(DAYS_KEY);
        if (savedDays) setPatientDayOverrides(JSON.parse(savedDays));
        const savedQ = await AsyncStorage.getItem(QUESTIONNAIRE_KEY);
        let qInit: Record<string, PatientQuestionnaireBundle> = savedQ ? JSON.parse(savedQ) : {};
        if (!qInit[DEMO_POST_TEST_PATIENT_ID]?.pre) {
          qInit = {
            ...qInit,
            [DEMO_POST_TEST_PATIENT_ID]: {
              ...qInit[DEMO_POST_TEST_PATIENT_ID],
              pre: getDemoPostTestPreSeed(),
            },
          };
          await AsyncStorage.setItem(QUESTIONNAIRE_KEY, JSON.stringify(qInit));
        }
        setQuestionnaireOverrides(qInit);
      } catch {}
    })();
  }, []);

  const login = useCallback((username: string, password: string) => {
    const patient = patients.find((p) => p.username === username && p.password === password);
    if (patient) {
      setCurrentUser(patient);
      setUserRole("pasien");
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: patient.id, role: "pasien" }));
      return { success: true, role: "pasien" as UserRole };
    }
    const nurse = nurses.find((n) => n.username === username && n.password === password);
    if (nurse) {
      setCurrentUser(nurse);
      setUserRole("perawat");
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: nurse.id, role: "perawat" }));
      return { success: true, role: "perawat" as UserRole };
    }
    return { success: false };
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setUserRole(null);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const getPatientSessions = useCallback((patientId: string): SessionRecord[] => {
    const patient = patients.find((p) => p.id === patientId);
    const base = (patient?.sessions ?? []).map((s): SessionRecord => ({
      ...s,
      approvalStatus: s.approvalStatus ?? (s.status === "selesai" ? "disetujui" : undefined),
    }));
    const overrides = sessionOverrides[patientId] ?? [];
    const merged: SessionRecord[] = [...base];
    overrides.forEach((override) => {
      const idx = merged.findIndex((s) => s.day === override.day);
      if (idx >= 0) merged[idx] = override;
      else merged.push(override);
    });
    return merged.sort((a, b) => a.day - b.day);
  }, [sessionOverrides]);

  const completeSession = useCallback((patientId: string, record: SessionRecord) => {
    const recordWithApproval: SessionRecord = { ...record, approvalStatus: "menunggu" };
    setSessionOverrides((prev) => {
      const existing = prev[patientId] ?? [];
      const idx = existing.findIndex((s) => s.day === record.day);
      const updated = [...existing];
      if (idx >= 0) updated[idx] = recordWithApproval;
      else updated.push(recordWithApproval);
      const next = { ...prev, [patientId]: updated };
      AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const approveSession = useCallback((patientId: string, day: number, status: "disetujui" | "ditolak", note?: string) => {
    setSessionOverrides((prev) => {
      const existing = prev[patientId] ?? [];
      const basePatient = patients.find((p) => p.id === patientId);
      const baseSessions = (basePatient?.sessions ?? []).map((s): SessionRecord => ({
        ...s,
        approvalStatus: s.approvalStatus ?? (s.status === "selesai" ? "disetujui" : undefined),
      }));
      const merged: SessionRecord[] = [...baseSessions];
      existing.forEach((o) => {
        const idx = merged.findIndex((s) => s.day === o.day);
        if (idx >= 0) merged[idx] = o;
        else merged.push(o);
      });
      const target = merged.find((s) => s.day === day);
      if (!target) return prev;
      const updated: SessionRecord = {
        ...target,
        approvalStatus: status,
        approvalNote: note ?? "",
        approvedAt: status === "disetujui" ? new Date().toISOString() : undefined,
      };
      const updatedOverrides = [...existing];
      const idx = updatedOverrides.findIndex((s) => s.day === day);
      if (idx >= 0) updatedOverrides[idx] = updated;
      else updatedOverrides.push(updated);
      const next = { ...prev, [patientId]: updatedOverrides };
      AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
      return next;
    });

    if (status === "disetujui") {
      setPatientDayOverrides((prev) => {
        const basePatient = patients.find((p) => p.id === patientId);
        const baseDay = basePatient?.currentDay ?? 1;
        const currentEffective = prev[patientId] ?? baseDay;
        const newDay = Math.min(Math.max(currentEffective, day + 1), 15);
        if (newDay !== currentEffective) {
          const next = { ...prev, [patientId]: newDay };
          AsyncStorage.setItem(DAYS_KEY, JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }
  }, []);

  const getEffectiveCurrentDay = useCallback((patientId: string): number => {
    const basePatient = patients.find((p) => p.id === patientId);
    const baseDay = basePatient?.currentDay ?? 1;
    return patientDayOverrides[patientId] ?? baseDay;
  }, [patientDayOverrides]);

  const getPendingApprovals = useCallback((): PendingApproval[] => {
    const result: PendingApproval[] = [];
    patients.forEach((p) => {
      const sessions = getPatientSessions(p.id);
      sessions.forEach((s) => {
        if (s.approvalStatus === "menunggu") result.push({ patient: p, session: s });
      });
    });
    return result;
  }, [getPatientSessions]);

  const getAllPatients = useCallback(() => patients, []);
  const getPatientById = useCallback((id: string) => patients.find((p) => p.id === id), []);
  const getQuestionnaireBundle = useCallback(
    (patientId: string) => questionnaireOverrides[patientId] ?? {},
    [questionnaireOverrides]
  );

  const saveQuestionnaireSubmission = useCallback((patientId: string, submission: QuestionnaireSubmission) => {
    setQuestionnaireOverrides((prev) => {
      const cur = prev[patientId] ?? {};
      const nextBundle: PatientQuestionnaireBundle = { ...cur, [submission.phase]: submission };
      const next = { ...prev, [patientId]: nextBundle };
      AsyncStorage.setItem(QUESTIONNAIRE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, userRole, login, logout,
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
