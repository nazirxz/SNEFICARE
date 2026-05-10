import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../../src/context/AppContext";
import type { Patient } from "../../../src/types/domain";
import {
  SMSES_BC_ITEM_COUNT,
  createEmptyScoreState,
  isProgramInterventionComplete,
  isValidScores,
  type QuestionnaireDemographics,
  type QuestionnairePhase,
} from "../../../src/data/researchQuestionnaire";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────
const SCORE_OPTIONS = [
  { value: 1, label: "Sangat Tidak Setuju" },
  { value: 2, label: "Tidak Setuju" },
  { value: 3, label: "Netral" },
  { value: 4, label: "Setuju" },
  { value: 5, label: "Sangat Setuju" },
];

const QUESTIONS_PER_BATCH = 5;

const emptyDemo = (): QuestionnaireDemographics => ({
  respondentNumberNote: "",
  initials: "",
  age: "",
  sex: "",
  education: "",
  occupation: "",
  religion: "",
  ethnicity: "",
});

const DEMO_FIELDS: { key: keyof QuestionnaireDemographics; label: string; placeholder: string }[] = [
  { key: "initials", label: "Inisial Nama", placeholder: "Contoh: SR" },
  { key: "age", label: "Usia", placeholder: "Contoh: 45" },
  { key: "sex", label: "Jenis Kelamin", placeholder: "Perempuan / Laki-laki" },
  { key: "education", label: "Pendidikan Terakhir", placeholder: "Contoh: SMA, S1" },
  { key: "occupation", label: "Pekerjaan", placeholder: "Contoh: Ibu Rumah Tangga" },
  { key: "religion", label: "Agama", placeholder: "Contoh: Islam" },
  { key: "ethnicity", label: "Suku", placeholder: "Contoh: Jawa" },
];

// ─── Step types ───────────────────────────────────────────────────────────────
type Step = "demo" | "questions";

export default function PatientResearchQuestionnaire() {
  const { fase } = useLocalSearchParams<{ fase: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, getPatientSessions, getQuestionnaireBundle, saveQuestionnaireSubmission, getQuestionnaireQuestions } = useApp();
  const patient = currentUser as Patient;
  const questions = getQuestionnaireQuestions();

  const phase: QuestionnairePhase | null = fase === "pre" || fase === "post" ? fase : null;
  const [demographics, setDemographics] = useState<QuestionnaireDemographics>(emptyDemo);
  const [scores, setScores] = useState<(number | null)[]>(() => createEmptyScoreState());
  const [step, setStep] = useState<Step>("demo");
  // Which batch of questions is currently shown (0-indexed)
  const [batchIndex, setBatchIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  if (!patient || !phase) {
    router.replace("/pasien");
    return null;
  }

  const allSessions = getPatientSessions(patient.id);
  const bundle = getQuestionnaireBundle(patient.id);
  const programComplete = isProgramInterventionComplete(allSessions);

  if (phase === "pre" && bundle.pre) { router.replace("/pasien"); return null; }
  if (phase === "post" && (!bundle.pre || !programComplete || bundle.post)) { router.replace("/pasien"); return null; }

  const title = phase === "pre" ? "Kuesioner Pra (Pre-test)" : "Kuesioner Pasca (Post-test)";

  // ─── Derived state ─────────────────────────────────────────────────────────
  const totalBatches = Math.ceil(questions.length / QUESTIONS_PER_BATCH);

  const missingDemoLabels = DEMO_FIELDS
    .filter(({ key }) => !String(demographics[key] ?? "").trim())
    .map((f) => f.label);

  const missingScoreIndexes = scores
    .map((s, i) => (s === null || s === undefined ? i + 1 : null))
    .filter((x): x is number => x !== null);

  const batchStart = batchIndex * QUESTIONS_PER_BATCH;
  const batchEnd = Math.min(batchStart + QUESTIONS_PER_BATCH, questions.length);
  const batchQuestions = questions.slice(batchStart, batchEnd);
  const batchScores = scores.slice(batchStart, batchEnd);
  const batchMissingCount = batchScores.filter((s) => s === null || s === undefined).length;
  const isLastBatch = batchIndex === totalBatches - 1;

  // Total steps: 1 (data diri) + totalBatches (question batches)
  const totalSteps = 1 + totalBatches;
  const currentStepNumber = step === "demo" ? 1 : 1 + batchIndex + 1;
  const progressPct = Math.round(((currentStepNumber - 1) / totalSteps) * 100);

  const setScore = (index: number, value: number | null) => {
    setScores((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleContinueToQuestions = () => {
    if (missingDemoLabels.length > 0) {
      Alert.alert(
        "Data Diri Belum Lengkap",
        `Mohon isi semua kolom data diri:\n- ${missingDemoLabels.join("\n- ")}`,
      );
      return;
    }
    setStep("questions");
    setBatchIndex(0);
  };

  const handleNextBatch = () => {
    if (batchMissingCount > 0) {
      Alert.alert(
        "Belum Lengkap",
        `Mohon jawab semua ${QUESTIONS_PER_BATCH} pertanyaan pada halaman ini sebelum melanjutkan.`,
      );
      return;
    }
    setBatchIndex((prev) => prev + 1);
  };

  const handlePrevBatch = () => {
    if (batchIndex === 0) {
      setStep("demo");
    } else {
      setBatchIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (missingDemoLabels.length > 0) {
      Alert.alert(
        "Data Diri Belum Lengkap",
        `Kembali ke halaman data diri dan lengkapi:\n- ${missingDemoLabels.join("\n- ")}`,
      );
      setStep("demo");
      return;
    }
    if (missingScoreIndexes.length > 0) {
      const preview = missingScoreIndexes.slice(0, 5).join(", ");
      const more = missingScoreIndexes.length > 5 ? ` (+${missingScoreIndexes.length - 5} lainnya)` : "";
      Alert.alert(
        "Belum Lengkap",
        `Mohon jawab semua ${SMSES_BC_ITEM_COUNT} pertanyaan.\n\nBelum dijawab: nomor ${preview}${more}.`,
      );
      return;
    }
    const finalScores = scores.map((s) => s as number);
    if (!isValidScores(finalScores)) {
      Alert.alert("Data Tidak Valid", "Jawaban kuesioner tidak valid. Mohon periksa kembali.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    const result = await saveQuestionnaireSubmission(patient.id, {
      phase,
      demographics,
      scores: finalScores,
      submittedAt: new Date().toISOString(),
    });
    setSubmitting(false);
    if (!result.success) {
      Alert.alert(
        "Gagal Menyimpan",
        `Kuesioner belum tersimpan.\n\nDetail: ${result.error ?? "tidak diketahui"}`,
      );
      return;
    }
    Alert.alert("Terima Kasih!", "Kuesioner berhasil disimpan.", [
      { text: "OK", onPress: () => router.replace("/pasien") },
    ]);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#FEF9F7" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF0F5" />

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 14,
          backgroundColor: "#FFF0F5",
          borderBottomWidth: 1.5,
          borderBottomColor: "#D94444",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={step === "questions" && batchIndex > 0 ? handlePrevBatch : step === "questions" ? () => setStep("demo") : () => router.back()}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="chevron-back" size={20} color="#6B6B80" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#2D2D3E" }}>{title}</Text>
            <Text style={{ fontSize: 11, color: "#6B6B80" }}>SMSES-BC · {SMSES_BC_ITEM_COUNT} item</Text>
          </View>
          {/* Step counter */}
          <View style={{ backgroundColor: "#D94444", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "white" }}>
              {currentStepNumber}/{totalSteps}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ marginTop: 12, gap: 6 }}>
          <View style={{ height: 5, backgroundColor: "#FADADD", borderRadius: 3, overflow: "hidden" }}>
            <View style={{ height: 5, backgroundColor: "#D94444", borderRadius: 3, width: `${progressPct}%` as any }} />
          </View>
          {/* Step pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {["Data Diri", ...Array.from({ length: totalBatches }, (_, i) => `Pertanyaan ${i * QUESTIONS_PER_BATCH + 1}–${Math.min((i + 1) * QUESTIONS_PER_BATCH, questions.length)}`)].map((label, i) => {
                const isActive = (step === "demo" && i === 0) || (step === "questions" && i === batchIndex + 1);
                const isDone = (step === "questions" && i === 0) || (step === "questions" && i < batchIndex + 1);
                return (
                  <View
                    key={label}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 12,
                      backgroundColor: isActive ? "#D94444" : isDone ? "#FADADD" : "#F0EEF5",
                    }}
                  >
                    {isDone && !isActive && <Ionicons name="checkmark" size={10} color="#D94444" />}
                    <Text style={{ fontSize: 10, fontWeight: isActive ? "700" : "500", color: isActive ? "white" : isDone ? "#D94444" : "#8B8BA0" }}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* ── Scrollable Content ─────────────────────────────────────────────── */}
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 180 }} showsVerticalScrollIndicator={false}>
        {/* ── STEP: Data Diri ─────────────────────────────────────────────── */}
        {step === "demo" && (
          <View style={{ gap: 14 }}>
            <View style={{ backgroundColor: "#FFF0F5", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderColor: "#FADADD" }}>
              <Ionicons name="information-circle" size={18} color="#D94444" style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 13, color: "#6B3030", lineHeight: 20 }}>
                Lengkapi data diri terlebih dahulu sebelum mengisi kuesioner. Data ini digunakan untuk keperluan penelitian.
              </Text>
            </View>

            {DEMO_FIELDS.map(({ key, label, placeholder }) => {
              const empty = !String((demographics as any)[key] ?? "").trim();
              return (
                <View key={key} style={{ gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A4A6A" }}>
                    {label} <Text style={{ color: "#D94444" }}>*</Text>
                  </Text>
                  <TextInput
                    value={(demographics as any)[key]}
                    onChangeText={(v) => setDemographics((d) => ({ ...d, [key]: v }))}
                    placeholder={placeholder}
                    placeholderTextColor="#9B8BA0"
                    style={{
                      backgroundColor: "white",
                      borderWidth: 2,
                      borderColor: empty ? "#FADADD" : "#C49A40",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                      fontSize: 14,
                      color: "#2D2D3E",
                    }}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* ── STEP: Question Batch ─────────────────────────────────────────── */}
        {step === "questions" && (
          <View style={{ gap: 16 }}>
            {/* Batch info banner */}
            <View style={{ backgroundColor: "#FFF8E8", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#F5EDD8", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#C49A40" }}>{batchIndex + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#5A4A20" }}>
                  Pertanyaan {batchStart + 1}–{batchEnd} dari {questions.length}
                </Text>
                <Text style={{ fontSize: 12, color: "#6B5030", marginTop: 2 }}>
                  Pilih jawaban yang paling sesuai kondisi Anda.
                </Text>
              </View>
              {/* Answered counter for this batch */}
              <View style={{ backgroundColor: batchMissingCount === 0 ? "#E8F5EE" : "#FFF0F5", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: batchMissingCount === 0 ? "#4A8F6A" : "#D94444" }}>
                  {QUESTIONS_PER_BATCH - batchMissingCount}/{Math.min(QUESTIONS_PER_BATCH, batchEnd - batchStart)}
                </Text>
              </View>
            </View>

            {batchQuestions.map((q, relativeIdx) => {
              const absoluteIdx = batchStart + relativeIdx;
              return (
                <View
                  key={absoluteIdx}
                  style={{
                    backgroundColor: "white",
                    borderRadius: 16,
                    padding: 16,
                    gap: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: scores[absoluteIdx] ? "#C49A40" : "#FADADD",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {scores[absoluteIdx]
                        ? <Ionicons name="checkmark" size={14} color="white" />
                        : <Text style={{ fontSize: 11, fontWeight: "700", color: "#D94444" }}>{absoluteIdx + 1}</Text>
                      }
                    </View>
                    <Text style={{ flex: 1, fontSize: 13, color: "#2D2D3E", lineHeight: 20 }}>{q}</Text>
                  </View>
                  <View style={{ gap: 6 }}>
                    {SCORE_OPTIONS.map(({ value, label }) => (
                      <TouchableOpacity
                        key={value}
                        onPress={() => setScore(absoluteIdx, value)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                          padding: 10,
                          borderRadius: 10,
                          backgroundColor: scores[absoluteIdx] === value ? "#FFF8E8" : "#F8F5FF",
                          borderWidth: scores[absoluteIdx] === value ? 2 : 1,
                          borderColor: scores[absoluteIdx] === value ? "#C49A40" : "#F0EAF5",
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: scores[absoluteIdx] === value ? "#C49A40" : "#B0A8C0",
                            backgroundColor: scores[absoluteIdx] === value ? "#C49A40" : "white",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {scores[absoluteIdx] === value && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "white" }} />}
                        </View>
                        <Text style={{ fontSize: 12, color: scores[absoluteIdx] === value ? "#5A4A20" : "#4A4A6A", fontWeight: scores[absoluteIdx] === value ? "700" : "400" }}>
                          {value}. {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}

            {/* Overall progress for questions step */}
            <View
              style={{
                backgroundColor: missingScoreIndexes.length === 0 ? "#E8F5EE" : "#FFF8E8",
                borderRadius: 12,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Ionicons
                name={missingScoreIndexes.length === 0 ? "checkmark-circle" : "alert-circle"}
                size={16}
                color={missingScoreIndexes.length === 0 ? "#6BAF8F" : "#C49A40"}
              />
              <Text style={{ flex: 1, fontSize: 12, color: missingScoreIndexes.length === 0 ? "#3A7A5A" : "#5A4A20", fontWeight: "600" }}>
                {missingScoreIndexes.length === 0
                  ? `Semua ${SMSES_BC_ITEM_COUNT} pertanyaan telah dijawab.`
                  : `${scores.length - missingScoreIndexes.length}/${SMSES_BC_ITEM_COUNT} dijawab · ${missingScoreIndexes.length} belum`}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Fixed Bottom Action Bar ─────────────────────────────────────────── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#F0EAF5",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          gap: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        {step === "demo" && (
          <>
            <TouchableOpacity
              onPress={handleContinueToQuestions}
              disabled={missingDemoLabels.length > 0}
              style={{
                backgroundColor: missingDemoLabels.length > 0 ? "#D8D0E8" : "#D94444",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
                {missingDemoLabels.length > 0
                  ? `Lengkapi ${missingDemoLabels.length} kolom lagi`
                  : "Lanjut ke Kuesioner →"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === "questions" && (
          <>
            {isLastBatch ? (
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting || missingScoreIndexes.length > 0}
                style={{
                  backgroundColor: submitting || missingScoreIndexes.length > 0 ? "#D8D0E8" : "#D94444",
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={18} color="white" />
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                  {submitting
                    ? "Menyimpan..."
                    : missingScoreIndexes.length > 0
                      ? `Lengkapi ${missingScoreIndexes.length} pertanyaan lagi`
                      : "Kirim Kuesioner ✓"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleNextBatch}
                disabled={batchMissingCount > 0}
                style={{
                  backgroundColor: batchMissingCount > 0 ? "#D8D0E8" : "#D94444",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
                  {batchMissingCount > 0 ? `Jawab ${batchMissingCount} pertanyaan lagi` : "Lanjut →"}
                </Text>
                {batchMissingCount === 0 && <Ionicons name="arrow-forward" size={16} color="white" />}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handlePrevBatch}
              style={{ borderRadius: 14, paddingVertical: 12, alignItems: "center", borderWidth: 1.5, borderColor: "#E0D8E8", flexDirection: "row", justifyContent: "center", gap: 6 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={14} color="#6B6B80" />
              <Text style={{ color: "#6B6B80", fontWeight: "600", fontSize: 14 }}>Kembali</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
