import * as XLSX from "xlsx";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { Patient } from "../types/domain";
import type {
  PatientQuestionnaireBundle,
  QuestionnaireSubmission,
} from "../data/researchQuestionnaire";
import { SMSES_BC_ITEM_COUNT } from "../data/researchQuestionnaire";

export interface ExportInput {
  patients: Patient[];
  bundles: Record<string, PatientQuestionnaireBundle>;
  questions: string[];
}

function buildRow(patient: Patient, submission: QuestionnaireSubmission) {
  const demo = submission.demographics;
  const total = submission.scores.reduce((a, n) => a + (Number.isFinite(n) ? n : 0), 0);
  const filled = submission.scores.filter((n) => Number.isFinite(n)).length;
  const avg = filled > 0 ? total / filled : 0;

  const row: Record<string, string | number> = {
    "Nama Pasien": patient.name,
    "Username": patient.username,
    "Diagnosis": patient.diagnosis,
    "Siklus Kemo": patient.chemoCycle,
    "Inisial": demo.initials || "",
    "Usia": demo.age || "",
    "Jenis Kelamin": demo.sex || "",
    "Pendidikan": demo.education || "",
    "Pekerjaan": demo.occupation || "",
    "Agama": demo.religion || "",
    "Suku": demo.ethnicity || "",
    "Tanggal Pengisian": new Date(submission.submittedAt).toLocaleString("id-ID"),
  };
  for (let i = 0; i < SMSES_BC_ITEM_COUNT; i++) {
    row[`Item ${i + 1}`] = submission.scores[i] ?? "";
  }
  row["Total Skor"] = total;
  row["Rata-rata"] = Number(avg.toFixed(2));
  return row;
}

function buildSheet(
  patients: Patient[],
  bundles: Record<string, PatientQuestionnaireBundle>,
  phase: "pre" | "post",
  questions: string[],
) {
  const rows = patients
    .map((p) => {
      const s = bundles[p.id]?.[phase];
      return s ? buildRow(p, s) : null;
    })
    .filter(Boolean) as Record<string, string | number>[];

  const ws = XLSX.utils.json_to_sheet(rows);

  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    const legend = headers.map((h) => {
      const match = h.match(/^Item (\d+)$/);
      if (!match) return "";
      const idx = parseInt(match[1], 10) - 1;
      return questions[idx] ?? "";
    });
    XLSX.utils.sheet_add_aoa(ws, [legend], { origin: -1 });
  }

  return ws;
}

export async function exportQuestionnairesToExcel(input: ExportInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { patients, bundles, questions } = input;

    const hasAny = patients.some((p) => bundles[p.id]?.pre || bundles[p.id]?.post);
    if (!hasAny) {
      return { success: false, error: "Belum ada pasien yang mengisi kuesioner." };
    }

    const wb = XLSX.utils.book_new();
    const wsPre = buildSheet(patients, bundles, "pre", questions);
    const wsPost = buildSheet(patients, bundles, "post", questions);
    XLSX.utils.book_append_sheet(wb, wsPre, "Pre-test");
    XLSX.utils.book_append_sheet(wb, wsPost, "Post-test");

    const data = XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string;

    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `Kuesioner-SMSES-BC-${stamp}.xlsx`;
    const file = new File(Paths.cache, filename);
    if (file.exists) file.delete();
    file.create();
    file.write(data, { encoding: "base64" });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { success: false, error: "Fitur bagikan tidak tersedia di perangkat ini." };
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Bagikan Hasil Kuesioner",
      UTI: "com.microsoft.excel.xlsx",
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Gagal mengekspor kuesioner" };
  }
}
