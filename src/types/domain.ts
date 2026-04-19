export type RelaxationCategory =
  | "ombak"
  | "hujan"
  | "hutan"
  | "sungai"
  | "air-terjun"
  | "burung"
  | "angin"
  | "musik"
  | "campuran";

export interface RelaxationTrack {
  id: string;
  title: string;
  description: string;
  category: RelaxationCategory;
  youtubeVideoId: string;
  durationSec: number;
  license?: string;
  sortOrder: number;
}

export interface SessionDefinition {
  day: number;
  title: string;
  theme: string;
  colorFrom: string;
  colorTo: string;
  edukasi: {
    title: string;
    content: string[];
    keyPoints: string[];
  };
  musik: {
    title: string;
    description: string;
    duration: number;
    musicType: string;
  };
  afirmasi: {
    title: string;
    mainText: string;
    supportText: string;
    instructions: string;
    positivePhrases?: string[];
  };
  refleksi: {
    title: string;
    questions: { id: string; label: string; placeholder: string }[];
  };
}

export interface SessionRecord {
  day: number;
  status: "belum" | "berlangsung" | "selesai";
  approvalStatus?: "menunggu" | "disetujui" | "ditolak";
  approvalNote?: string;
  approvedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  mood?: number;
  refleksiAnswers?: { [key: string]: string };
  afirmasiNote?: string;
  modulesCompleted?: string[];
  affirmationAudioUrl?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  chemoCycle: string;
  startDate: string;
  currentDay: number;
  username: string;
  password: string;
  phone: string;
  sessions: SessionRecord[];
}

export interface Nurse {
  id: string;
  name: string;
  nip: string;
  department: string;
  username: string;
  password: string;
}
