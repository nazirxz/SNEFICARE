import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../../src/context/AppContext";
import type { Patient } from "../../../src/data/mockData";
import {
  SMSES_BC_ITEM_COUNT,
  createEmptyScoreState,
  isProgramInterventionComplete,
  isValidScores,
  type QuestionnaireDemographics,
  type QuestionnairePhase,
} from "../../../src/data/researchQuestionnaire";
import { SMSES_BC_QUESTIONS } from "../../../src/data/smssesBcQuestions";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCORE_OPTIONS = [
  { value: 1, label: "Sangat Tidak Setuju" },
  { value: 2, label: "Tidak Setuju" },
  { value: 3, label: "Netral" },
  { value: 4, label: "Setuju" },
  { value: 5, label: "Sangat Setuju" },
];

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

export default function PatientResearchQuestionnaire() {
  const { fase } = useLocalSearchParams<{ fase: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, getPatientSessions, getQuestionnaireBundle, saveQuestionnaireSubmission } = useApp();
  const patient = currentUser as Patient;

  const phase: QuestionnairePhase | null = fase === "pre" || fase === "post" ? fase : null;
  const [demographics, setDemographics] = useState<QuestionnaireDemographics>(emptyDemo);
  const [scores, setScores] = useState<(number | null)[]>(() => createEmptyScoreState());
  const [step, setStep] = useState<"demo" | "questions">("demo");

  if (!patient || !phase) {
    router.replace("/(pasien)");
    return null;
  }

  const allSessions = getPatientSessions(patient.id);
  const bundle = getQuestionnaireBundle(patient.id);
  const programComplete = isProgramInterventionComplete(allSessions);

  if (phase === "pre" && bundle.pre) { router.replace("/(pasien)"); return null; }
  if (phase === "post" && (!bundle.pre || !programComplete || bundle.post)) { router.replace("/(pasien)"); return null; }

  const title = phase === "pre" ? "Kuesioner Pra (Pre-test)" : "Kuesioner Pasca (Post-test)";

  const setScore = (index: number, value: number | null) => {
    setScores((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = () => {
    const validScores = scores.map((s) => s ?? 0);
    if (!isValidScores(validScores)) {
      Alert.alert("Belum lengkap", "Mohon isi semua pertanyaan kuesioner.");
      return;
    }
    saveQuestionnaireSubmission(patient.id, {
      phase,
      demographics,
      scores: validScores,
      submittedAt: new Date().toISOString(),
    });
    Alert.alert("Terima Kasih!", "Kuesioner berhasil disimpan.", [
      { text: "OK", onPress: () => router.replace("/(pasien)") },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FEF9F7" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8E8" />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: "#FFF8E8", borderBottomWidth: 1, borderBottomColor: "#F0D090" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => step === "questions" ? setStep("demo") : router.back()}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="chevron-back" size={20} color="#6B6B80" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#2D2D3E" }}>{title}</Text>
            <Text style={{ fontSize: 11, color: "#9B9BAE" }}>SMSES-BC · {SMSES_BC_ITEM_COUNT} item</Text>
          </View>
        </View>
        {/* Step indicator */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {["Data Diri", "Kuesioner SMSES-BC"].map((s, i) => (
            <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: (step === "questions" && i === 0) || (step === "demo" && i === 0) ? "#C49A40" : step === "questions" && i === 1 ? "#C49A40" : "#E0D8C0", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "white" }}>{i + 1}</Text>
              </View>
              <Text style={{ fontSize: 11, color: "#8A6A20", fontWeight: step === "demo" && i === 0 ? "700" : step === "questions" && i === 1 ? "700" : "400" }}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {step === "demo" ? (
          <View style={{ gap: 14 }}>
            <Text style={{ fontSize: 14, color: "#6B6B80", lineHeight: 22 }}>
              Lengkapi data diri terlebih dahulu sebelum mengisi kuesioner. Data ini digunakan untuk keperluan penelitian.
            </Text>
            {[
              { key: "initials", label: "Inisial Nama", placeholder: "Contoh: SR" },
              { key: "age", label: "Usia", placeholder: "Contoh: 45" },
              { key: "sex", label: "Jenis Kelamin", placeholder: "Perempuan / Laki-laki" },
              { key: "education", label: "Pendidikan Terakhir", placeholder: "Contoh: SMA, S1" },
              { key: "occupation", label: "Pekerjaan", placeholder: "Contoh: Ibu Rumah Tangga" },
              { key: "religion", label: "Agama", placeholder: "Contoh: Islam" },
              { key: "ethnicity", label: "Suku", placeholder: "Contoh: Jawa" },
            ].map(({ key, label, placeholder }) => (
              <View key={key} style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B6B80" }}>{label}</Text>
                <TextInput
                  value={(demographics as any)[key]}
                  onChangeText={(v) => setDemographics((d) => ({ ...d, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor="#C0B8CC"
                  style={{ backgroundColor: "white", borderWidth: 2, borderColor: "#F0E8E0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#2D2D3E" }}
                />
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setStep("questions")}
              style={{ backgroundColor: "#C49A40", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8 }}
              activeOpacity={0.8}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>Lanjut ke Kuesioner →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: "#FFF8E8", borderRadius: 14, padding: 14 }}>
              <Text style={{ fontSize: 13, color: "#8A6A20", lineHeight: 20 }}>
                Pilih jawaban yang paling sesuai dengan kondisi Anda. Tidak ada jawaban yang benar atau salah.
              </Text>
            </View>

            {SMSES_BC_QUESTIONS.map((q, i) => (
              <View key={i} style={{ backgroundColor: "white", borderRadius: 16, padding: 16, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: scores[i] ? "#C49A40" : "#F0E8E0", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: scores[i] ? "white" : "#9B9BAE" }}>{i + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 13, color: "#2D2D3E", lineHeight: 20 }}>{q}</Text>
                </View>
                <View style={{ gap: 6 }}>
                  {SCORE_OPTIONS.map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => setScore(i, value)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        padding: 10,
                        borderRadius: 10,
                        backgroundColor: scores[i] === value ? "#FFF8E8" : "#F8F5FF",
                        borderWidth: scores[i] === value ? 2 : 1,
                        borderColor: scores[i] === value ? "#C49A40" : "#F0EAF5",
                      }}
                    >
                      <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: scores[i] === value ? "#C49A40" : "#C0B8D0", backgroundColor: scores[i] === value ? "#C49A40" : "white", alignItems: "center", justifyContent: "center" }}>
                        {scores[i] === value && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "white" }} />}
                      </View>
                      <Text style={{ fontSize: 12, color: scores[i] === value ? "#8A6A20" : "#6B6B80", fontWeight: scores[i] === value ? "600" : "400" }}>
                        {value}. {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={handleSubmit}
              style={{ backgroundColor: "#C49A40", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
              activeOpacity={0.8}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Kirim Kuesioner ✓</Text>
            </TouchableOpacity>
            <View style={{ height: 32 }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
