import { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useApp } from "../../../src/context/AppContext";
import type { Patient } from "../../../src/types/domain";
import type { QuestionnaireSubmission, PatientQuestionnaireBundle } from "../../../src/data/researchQuestionnaire";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const fmtSec = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

function AfirmasiAudioPlayer({ storagePath }: { storagePath: string }) {
  const { getAfirmasiSignedUrl } = useApp();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const player = useAudioPlayer(signedUrl);
  const status = useAudioPlayerStatus(player);

  const fetchUrl = useCallback(async () => {
    if (signedUrl || loading) return;
    setLoading(true);
    setError(null);
    const res = await getAfirmasiSignedUrl(storagePath);
    setLoading(false);
    if (!res.success || !res.url) {
      setError(res.error ?? "Gagal memuat rekaman");
      return;
    }
    setSignedUrl(res.url);
  }, [getAfirmasiSignedUrl, loading, signedUrl, storagePath]);

  useEffect(() => {
    return () => { try { player.pause(); } catch {} };
  }, [player]);

  const toggle = useCallback(async () => {
    if (!signedUrl) {
      await fetchUrl();
      return;
    }
    if (status.playing) player.pause();
    else {
      if (status.currentTime && status.duration && status.currentTime >= status.duration - 0.1) {
        player.seekTo(0).catch(() => {});
      }
      player.play();
    }
  }, [fetchUrl, player, signedUrl, status.currentTime, status.duration, status.playing]);

  const progress = status.duration > 0 ? Math.min(100, (status.currentTime / status.duration) * 100) : 0;

  return (
    <View style={{ backgroundColor: "#EEE9F9", borderRadius: 12, padding: 12, gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <TouchableOpacity
          onPress={toggle}
          disabled={loading}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8B7EC4", alignItems: "center", justifyContent: "center" }}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name={status.playing ? "pause" : "play"} size={18} color="white" />
          )}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="mic" size={12} color="#6BAF8F" />
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#2D2D3E" }}>Rekaman afirmasi pasien</Text>
          </View>
          <Text style={{ fontSize: 11, color: "#6B6B80", marginTop: 2 }}>
            {signedUrl ? `${fmtSec(status.currentTime ?? 0)} / ${fmtSec(status.duration ?? 0)}` : "Ketuk untuk memuat"}
          </Text>
        </View>
      </View>
      {signedUrl && (
        <View style={{ height: 4, backgroundColor: "rgba(139,126,196,0.3)", borderRadius: 2, overflow: "hidden" }}>
          <View style={{ width: `${progress}%` as any, height: 4, backgroundColor: "#8B7EC4" }} />
        </View>
      )}
      {error && <Text style={{ fontSize: 11, color: "#8B2E37" }}>{error}</Text>}
    </View>
  );
}

const SCORE_LABELS = ["—", "Sangat Tidak Setuju", "Tidak Setuju", "Netral", "Setuju", "Sangat Setuju"];

function scoreStats(s: QuestionnaireSubmission) {
  const scores = s.scores ?? [];
  const total = scores.reduce((a, n) => a + n, 0);
  const count = scores.length;
  const avg = count > 0 ? total / count : 0;
  return { total, count, avg };
}

function QuestionnaireCard({
  submission,
  label,
  accent,
  questions,
}: {
  submission: QuestionnaireSubmission;
  label: string;
  accent: string;
  questions: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const { total, count, avg } = scoreStats(submission);
  const submittedDate = new Date(submission.submittedAt).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <View style={{ borderRadius: 16, backgroundColor: "white", borderWidth: 1.5, borderColor: accent + "55", overflow: "hidden" }}>
      <View style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: accent + "15" }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: accent, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="document-text" size={18} color="white" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E" }}>{label}</Text>
          <Text style={{ fontSize: 11, color: "#9B9BAE", marginTop: 1 }}>Dikirim {submittedDate}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: accent }}>{total}</Text>
          <Text style={{ fontSize: 10, color: "#9B9BAE" }}>Total · {count} item</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1, backgroundColor: "#FEF9F7", borderRadius: 10, padding: 10, alignItems: "center" }}>
          <Text style={{ fontSize: 10, color: "#9B9BAE" }}>Rata-rata</Text>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E", marginTop: 2 }}>{avg.toFixed(2)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: "#FEF9F7", borderRadius: 10, padding: 10, alignItems: "center" }}>
          <Text style={{ fontSize: 10, color: "#9B9BAE" }}>Inisial</Text>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E", marginTop: 2 }}>{submission.demographics.initials || "—"}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: "#FEF9F7", borderRadius: 10, padding: 10, alignItems: "center" }}>
          <Text style={{ fontSize: 10, color: "#9B9BAE" }}>Usia</Text>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E", marginTop: 2 }}>{submission.demographics.age || "—"}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#F0EAF5" }}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 12, fontWeight: "600", color: accent }}>
          {expanded ? "Sembunyikan detail" : "Lihat detail jawaban & demografi"}
        </Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={accent} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12 }}>
          <View style={{ backgroundColor: "#FEF9F7", borderRadius: 10, padding: 10, gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#6B6B80" }}>Data Diri</Text>
            {[
              ["Jenis kelamin", submission.demographics.sex],
              ["Pendidikan", submission.demographics.education],
              ["Pekerjaan", submission.demographics.occupation],
              ["Agama", submission.demographics.religion],
              ["Suku", submission.demographics.ethnicity],
            ].map(([k, v]) => (
              <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, color: "#9B9BAE" }}>{k}</Text>
                <Text style={{ fontSize: 11, color: "#2D2D3E", fontWeight: "600" }}>{v || "—"}</Text>
              </View>
            ))}
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#6B6B80" }}>Jawaban per Item</Text>
            {submission.scores.map((sc, i) => {
              const prompt = questions[i] ?? `Item ${i + 1}`;
              const labelText = SCORE_LABELS[Math.min(Math.max(sc, 0), SCORE_LABELS.length - 1)] ?? String(sc);
              return (
                <View key={i} style={{ flexDirection: "row", gap: 8, paddingVertical: 4, borderBottomWidth: i === submission.scores.length - 1 ? 0 : 1, borderBottomColor: "#F5F0F8" }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: accent + "22", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: accent }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: "#4A4A6A", lineHeight: 16 }} numberOfLines={2}>{prompt}</Text>
                    <Text style={{ fontSize: 10, color: "#9B9BAE", marginTop: 2 }}>{labelText}</Text>
                  </View>
                  <View style={{ width: 28, alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: accent }}>{sc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

function QuestionnaireSection({
  bundle,
  questions,
}: {
  bundle: PatientQuestionnaireBundle;
  questions: string[];
}) {
  const hasPre = !!bundle.pre;
  const hasPost = !!bundle.post;

  if (!hasPre && !hasPost) {
    return (
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Ionicons name="document-text" size={18} color="#8B7EC4" />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E" }}>Kuesioner SMSES-BC</Text>
        </View>
        <View style={{ backgroundColor: "white", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#F0EAF5" }}>
          <Text style={{ fontSize: 13, color: "#9B9BAE", textAlign: "center" }}>
            Pasien belum mengisi kuesioner pre-test.
          </Text>
        </View>
      </View>
    );
  }

  const preTotal = bundle.pre ? scoreStats(bundle.pre).total : null;
  const postTotal = bundle.post ? scoreStats(bundle.post).total : null;
  const delta = preTotal !== null && postTotal !== null ? postTotal - preTotal : null;
  const deltaColor = delta === null ? "#9B9BAE" : delta > 0 ? "#6BAF8F" : delta < 0 ? "#E85858" : "#9B9BAE";
  const deltaArrow = delta === null ? "" : delta > 0 ? "↑" : delta < 0 ? "↓" : "—";

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Ionicons name="document-text" size={18} color="#8B7EC4" />
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E" }}>Kuesioner SMSES-BC</Text>
        {delta !== null && (
          <View style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: deltaColor + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: deltaColor }}>
              {deltaArrow} {delta > 0 ? "+" : ""}{delta}
            </Text>
          </View>
        )}
      </View>
      <View style={{ gap: 10 }}>
        {bundle.pre && (
          <QuestionnaireCard submission={bundle.pre} label="Pre-test" accent="#8B7EC4" questions={questions} />
        )}
        {bundle.post ? (
          <QuestionnaireCard submission={bundle.post} label="Post-test" accent="#6BAF8F" questions={questions} />
        ) : (
          <View style={{ backgroundColor: "white", borderRadius: 14, padding: 14, borderWidth: 1, borderStyle: "dashed", borderColor: "#D0D0D8", flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="time-outline" size={16} color="#9B9BAE" />
            <Text style={{ fontSize: 12, color: "#9B9BAE", flex: 1 }}>
              Post-test belum diisi. Pasien dapat mengisi setelah seluruh 15 sesi disetujui.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const MOODS = ["😢", "😟", "😐", "🙂", "😊"];
const MOOD_LABELS = ["Sangat Berat", "Berat", "Biasa Saja", "Cukup Baik", "Sangat Baik"];

function ApprovalCard({ session, sessionDefs, onApprove }: {
  session: any;
  sessionDefs: { day: number; title: string }[];
  onApprove: (day: number, status: "disetujui" | "ditolak", note: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleDecision = async (status: "disetujui" | "ditolak", decisionNote: string) => {
    if (busy) return;
    setBusy(true);
    const res = await onApprove(session.day, status, decisionNote);
    setBusy(false);
    if (res.success) setSubmitted(true);
    else Alert.alert("Gagal Memproses", res.error ?? "Terjadi kesalahan");
  };
  const def = sessionDefs.find((s) => s.day === session.day);
  const reflectionText =
    typeof session?.reflection === "string" && session.reflection.trim()
      ? session.reflection.trim()
      : Object.values(session?.refleksiAnswers ?? {})
          .map((v) => String(v).trim())
          .filter((v) => v.length > 0)
          .join("\n");

  if (submitted) {
    return (
      <View style={{ backgroundColor: "#E8F5EE", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#B0DDB8" }}>
        <Ionicons name="checkmark-circle" size={18} color="#6BAF8F" />
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#3A7A5A" }}>Hari {session.day} telah diproses ✓</Text>
      </View>
    );
  }

  return (
    <View style={{ borderRadius: 16, overflow: "hidden", borderWidth: 1.5, borderColor: "#F0D090", backgroundColor: "white" }}>
      {/* Header */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: "#FFFBF0" }}
        activeOpacity={0.8}
      >
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#FFF3D0", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#C49A40" }}>H{session.day}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E" }}>{def?.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
            <Ionicons name="time" size={12} color="#9B9BAE" />
            <Text style={{ fontSize: 11, color: "#9B9BAE" }}>
              {session.durationMinutes} mnt
              {session.completedAt ? ` · ${new Date(session.completedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` : ""}
            </Text>
            {session.mood ? <Text style={{ fontSize: 14 }}>{MOODS[session.mood - 1]}</Text> : null}
            {session.affirmationAudioUrl ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#EEE9F9", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Ionicons name="mic" size={10} color="#8B7EC4" />
                <Text style={{ fontSize: 9, fontWeight: "700", color: "#8B7EC4" }}>Audio</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#9B9BAE" />
      </TouchableOpacity>

      {/* Expanded */}
      {expanded && (
        <View style={{ padding: 14, gap: 12 }}>
          {session?.affirmationAudioUrl ? (
            <AfirmasiAudioPlayer storagePath={session.affirmationAudioUrl} />
          ) : null}

          {reflectionText ? (
            <View style={{ backgroundColor: "#F8F5FF", borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#9B9BAE", marginBottom: 4 }}>Refleksi pasien:</Text>
              <Text style={{ fontSize: 13, color: "#4A4A6A", lineHeight: 20, fontStyle: "italic" }}>"{reflectionText}"</Text>
            </View>
          ) : null}

          {!rejectMode ? (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => handleDecision("disetujui", "")}
                disabled={busy}
                style={{ flex: 1, backgroundColor: busy ? "#B5D6C5" : "#6BAF8F", borderRadius: 12, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={16} color="white" />
                <Text style={{ color: "white", fontWeight: "700" }}>{busy ? "Memproses..." : "Setujui"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRejectMode(true)}
                disabled={busy}
                style={{ flex: 1, backgroundColor: "#FFF0F0", borderRadius: 12, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#F0C8C8" }}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={16} color="#C85858" />
                <Text style={{ color: "#C85858", fontWeight: "700" }}>Tolak</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B6B80" }}>Catatan untuk pasien (opsional):</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Tulis catatan atau alasan penolakan..."
                placeholderTextColor="#C0B8CC"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{ backgroundColor: "#FEF9F7", borderWidth: 2, borderColor: "#F0C8C8", borderRadius: 12, padding: 12, fontSize: 13, color: "#2D2D3E", minHeight: 80 }}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setRejectMode(false)}
                  style={{ flex: 1, backgroundColor: "#F5F0F8", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
                >
                  <Text style={{ color: "#6B6B80", fontWeight: "600" }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDecision("ditolak", note)}
                  disabled={busy}
                  style={{ flex: 1, backgroundColor: busy ? "#F0A8A8" : "#E85858", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>{busy ? "Memproses..." : "Kirim Penolakan"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function NursePatientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getPatientById, getPatientSessions, approveSession, getProgramSessions, getQuestionnaireBundle, getQuestionnaireQuestions } = useApp();
  const sessions = getProgramSessions();
  const questionnaireQuestions = getQuestionnaireQuestions();

  const patient = getPatientById(id ?? "") as Patient | undefined;
  const allSessions = getPatientSessions(id ?? "");
  const questionnaireBundle = getQuestionnaireBundle(id ?? "");

  if (!patient) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Pasien tidak ditemukan</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: "#C96B8A" }}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completed = allSessions.filter((s) => s.status === "selesai");
  const pendingSessions = allSessions.filter((s) => s.approvalStatus === "menunggu");
  const adherence = Math.round((completed.length / 15) * 100);
  const totalDur = completed.reduce((a, s) => a + (s.durationMinutes ?? 0), 0);
  const avgMood = completed.length > 0 ? (completed.reduce((a, s) => a + (s.mood ?? 3), 0) / completed.length) : null;
  const adherenceColor = adherence >= 80 ? "#6BAF8F" : adherence >= 50 ? "#C49A40" : "#C96B8A";

  const moodData = completed.map((s) => ({ day: s.day, mood: s.mood ?? 3 }));

  return (
    <View style={{ flex: 1, backgroundColor: "#FEF9F7" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEE9F9" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 24, backgroundColor: "#EEE9F9" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}
          >
            <Ionicons name="chevron-back" size={20} color="#6B6B80" />
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: "#DDD5F8", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#8B7EC4" }}>{patient.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#2D2D3E" }}>{patient.name}</Text>
              <Text style={{ fontSize: 13, color: "#8B7EC4", marginTop: 2 }}>{patient.chemoCycle}</Text>
              {patient.diagnosis && <Text style={{ fontSize: 12, color: "#9B9BAE" }}>{patient.diagnosis}</Text>}
            </View>
          </View>

          {/* Quick stats */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
            {[
              { label: "Sesi", value: `${completed.length}/15`, color: "#6BAF8F" },
              { label: "Kepatuhan", value: `${adherence}%`, color: adherenceColor },
              { label: "Total Waktu", value: `${totalDur}m`, color: "#8B7EC4" },
              { label: "Mood Rata", value: avgMood ? MOODS[Math.round(avgMood) - 1] : "—", color: "#C49A40" },
            ].map(({ label, value, color }) => (
              <View key={label} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 12, padding: 10, alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color }}>{value}</Text>
                <Text style={{ fontSize: 10, color: "#9B9BAE", marginTop: 2, textAlign: "center" }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingVertical: 20, gap: 20 }}>
          {/* Pending approvals */}
          {pendingSessions.length > 0 && (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Ionicons name="time" size={18} color="#C49A40" />
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E" }}>
                  Menunggu Persetujuan ({pendingSessions.length})
                </Text>
              </View>
              <View style={{ gap: 10 }}>
                {pendingSessions.map((s) => (
                  <ApprovalCard
                    key={s.day}
                    session={s}
                    sessionDefs={sessions}
                    onApprove={(day, status, note) => approveSession(patient.id, day, status, note)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Questionnaire results */}
          <QuestionnaireSection bundle={questionnaireBundle} questions={questionnaireQuestions} />

          {/* Mood trend */}
          {moodData.length > 0 && (
            <View style={{ backgroundColor: "white", borderRadius: 20, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E", marginBottom: 12 }}>Tren Mood</Text>
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 80 }}>
                {moodData.map((d) => (
                  <View key={d.day} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                    <View style={{ flex: 1, justifyContent: "flex-end" }}>
                      <View style={{ height: (d.mood / 5) * 60, backgroundColor: "#8B7EC4", borderRadius: 4, minHeight: 8 }} />
                    </View>
                    <Text style={{ fontSize: 9, color: "#9B9BAE" }}>H{d.day}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                {["😢", "😟", "😐", "🙂", "😊"].map((e, i) => (
                  <Text key={i} style={{ fontSize: 12 }}>{e}</Text>
                ))}
              </View>
            </View>
          )}

          {/* All sessions */}
          <View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E", marginBottom: 12 }}>Riwayat Sesi</Text>
            <View style={{ gap: 8 }}>
              {sessions.map((def) => {
                const rec = allSessions.find((s) => s.day === def.day);
                const isCompleted = rec?.status === "selesai";
                const approval = rec?.approvalStatus;

                let statusColor = "#C0B8D0";
                let statusBg = "#F5F0F8";
                let statusIcon: any = "lock-closed";
                let statusText = "Belum";

                if (isCompleted) {
                  if (approval === "disetujui") { statusColor = "#6BAF8F"; statusBg = "#E8F5EE"; statusIcon = "checkmark-circle"; statusText = "Disetujui"; }
                  else if (approval === "menunggu") { statusColor = "#C49A40"; statusBg = "#FFF8E8"; statusIcon = "time"; statusText = "Menunggu"; }
                  else if (approval === "ditolak") { statusColor = "#E85858"; statusBg = "#FFF0F0"; statusIcon = "close-circle"; statusText = "Ditolak"; }
                  else { statusColor = "#6BAF8F"; statusBg = "#E8F5EE"; statusIcon = "checkmark-circle"; statusText = "Selesai"; }
                }

                return (
                  <View
                    key={def.day}
                    style={{ backgroundColor: "white", borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#F0EAF5" }}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: statusBg, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name={statusIcon} size={16} color={statusColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#2D2D3E" }}>Hari {def.day}: {def.title}</Text>
                      {isCompleted && rec ? (
                        <Text style={{ fontSize: 11, color: "#9B9BAE", marginTop: 1 }}>
                          {rec.durationMinutes} mnt {rec.mood ? MOODS[rec.mood - 1] : ""} · {rec.completedAt ? new Date(rec.completedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : ""}
                        </Text>
                      ) : null}
                      {rec?.approvalNote ? <Text style={{ fontSize: 11, color: "#E85858", marginTop: 1 }}>📋 {rec.approvalNote}</Text> : null}
                    </View>
                    <View style={{ backgroundColor: statusBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: statusColor }}>{statusText}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}
