import type { SessionRecord } from "./mockData";

export type QuestionnairePhase = "pre" | "post";

/** 15 hari intervensi selesai dan disetujui semua */
export function isProgramInterventionComplete(sessions: SessionRecord[]): boolean {
  for (let day = 1; day <= 15; day++) {
    const r = sessions.find((s) => s.day === day);
    if (!r || r.status !== "selesai" || r.approvalStatus !== "disetujui") return false;
  }
  return true;
}

export interface QuestionnaireDemographics {
  /** Opsional jika berbeda dari ID akun */
  respondentNumberNote: string;
  initials: string;
  age: string;
  sex: "laki-laki" | "perempuan" | "";
  education: string;
  occupation: string;
  religion: string;
  ethnicity: string;
}

export interface QuestionnaireSubmission {
  phase: QuestionnairePhase;
  demographics: QuestionnaireDemographics;
  /** 27 skor SMSES-BC, masing-masing 0–10 */
  scores: number[];
  submittedAt: string;
}

export interface PatientQuestionnaireBundle {
  pre?: QuestionnaireSubmission;
  post?: QuestionnaireSubmission;
}

export const SMSES_BC_ITEM_COUNT = 27;

/** ID pasien mock khusus uji alur post-test (lihat `mockData.ts`) */
export const DEMO_POST_TEST_PATIENT_ID = "p099";

/** Pre-test sintetis untuk akun demo post agar post-test bisa dibuka tanpa isi manual */
export function getDemoPostTestPreSeed(): QuestionnaireSubmission {
  return {
    phase: "pre",
    demographics: {
      respondentNumberNote: "",
      initials: "DP",
      age: "45",
      sex: "perempuan",
      education: "S1",
      occupation: "Akun demo",
      religion: "—",
      ethnicity: "—",
    },
    scores: Array.from({ length: SMSES_BC_ITEM_COUNT }, () => 5),
    submittedAt: "2026-01-01T08:00:00.000Z",
  };
}

export function createEmptyScoreState(): (number | null)[] {
  return Array.from({ length: SMSES_BC_ITEM_COUNT }, () => null);
}

export function isValidScores(scores: number[]): boolean {
  if (scores.length !== SMSES_BC_ITEM_COUNT) return false;
  return scores.every((s) => Number.isFinite(s) && s >= 0 && s <= 10 && Math.round(s) === s);
}
