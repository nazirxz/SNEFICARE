import { View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../src/context/AppContext";
import { sessions } from "../../src/data/mockData";
import type { Patient } from "../../src/data/mockData";
import { isProgramInterventionComplete } from "../../src/data/researchQuestionnaire";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MOODS = ["😢", "😟", "😐", "🙂", "😊"];

export default function PatientProgress() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, getPatientSessions, getEffectiveCurrentDay, getQuestionnaireBundle } = useApp();
  const patient = currentUser as Patient;
  const allSessions = getPatientSessions(patient?.id ?? "");
  const todayDay = getEffectiveCurrentDay(patient?.id ?? "");

  const completed = allSessions.filter((s) => s.status === "selesai");
  const totalDuration = completed.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);
  const avgMood =
    completed.length > 0
      ? (completed.reduce((a, s) => a + (s.mood ?? 3), 0) / completed.length).toFixed(1)
      : "—";
  const adherencePct = Math.round((completed.length / 15) * 100);

  const qBundle = getQuestionnaireBundle(patient?.id ?? "");
  const needsPostTest =
    isProgramInterventionComplete(allSessions) && Boolean(qBundle.pre) && !qBundle.post;

  function getSessionState(day: number) {
    const rec = allSessions.find((s) => s.day === day);
    if (!rec || rec.status !== "selesai") {
      return day === todayDay ? "current" : day < todayDay ? "missed" : "locked";
    }
    return rec.approvalStatus ?? "approved";
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FEF9F7" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEE9F9" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 24, backgroundColor: "#EEE9F9" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#2D2D3E" }}>Kemajuanku 📈</Text>
          <Text style={{ fontSize: 13, color: "#9B9BAE", marginTop: 4 }}>Program 15 Hari SNEfi Care</Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingVertical: 20, gap: 20 }}>
          {/* Post-test reminder */}
          {needsPostTest && (
            <View style={{ backgroundColor: "#E8F5EE", borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: "#B0DDB8" }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <Ionicons name="clipboard" size={18} color="#4A8F6A" style={{ marginTop: 2 }} />
                <Text style={{ flex: 1, fontSize: 13, color: "#2A5A3A", lineHeight: 20 }}>
                  Program 15 hari telah selesai. Jangan lupa mengisi <Text style={{ fontWeight: "700" }}>kuesioner pasca</Text> di Beranda.
                </Text>
              </View>
            </View>
          )}

          {/* Stat cards */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { label: "Sesi Selesai", value: `${completed.length}/15`, icon: "checkmark-circle", color: "#6BAF8F", bg: "#E8F5EE" },
              { label: "Kepatuhan", value: `${adherencePct}%`, icon: "trending-up", color: "#C96B8A", bg: "#F7E8EE" },
              { label: "Total Waktu", value: `${totalDuration}m`, icon: "time", color: "#8B7EC4", bg: "#EEE9F9" },
              { label: "Rata Mood", value: avgMood === "—" ? "—" : MOODS[Math.round(Number(avgMood)) - 1] ?? avgMood, icon: "happy", color: "#C49A40", bg: "#FFF8E8" },
            ].map(({ label, value, icon, color, bg }) => (
              <View
                key={label}
                style={{
                  flex: 1,
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 12,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: bg, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                  <Ionicons name={icon as any} size={18} color={color} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#2D2D3E" }}>{value}</Text>
                <Text style={{ fontSize: 9, color: "#9B9BAE", marginTop: 2, textAlign: "center" }}>{label}</Text>
              </View>
            ))}
          </View>

          {/* All sessions list */}
          <View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E", marginBottom: 12 }}>Semua Sesi</Text>
            <View style={{ gap: 8 }}>
              {sessions.map((s) => {
                const state = getSessionState(s.day);
                const rec = allSessions.find((r) => r.day === s.day);
                const isCompleted = rec?.status === "selesai";
                const isLocked = !isCompleted && s.day > todayDay;
                const isCurrent = s.day === todayDay && !isCompleted;

                let stateColor = "#C0B8D0";
                let stateIcon: any = "lock-closed";
                let stateBg = "#F5F0F8";

                if (state === "disetujui") { stateColor = "#6BAF8F"; stateIcon = "checkmark-circle"; stateBg = "#E8F5EE"; }
                else if (state === "menunggu") { stateColor = "#C49A40"; stateIcon = "time"; stateBg = "#FFF8E8"; }
                else if (state === "ditolak") { stateColor = "#E85858"; stateIcon = "alert-circle"; stateBg = "#FFF0F0"; }
                else if (isCurrent) { stateColor = "#C96B8A"; stateIcon = "play-circle"; stateBg = "#F7E8EE"; }

                return (
                  <TouchableOpacity
                    key={s.day}
                    onPress={() => !isLocked && router.push(`/pasien/sesi/${s.day}` as any)}
                    activeOpacity={isLocked ? 1 : 0.8}
                    style={{
                      backgroundColor: "white",
                      borderRadius: 16,
                      padding: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      borderWidth: isCurrent ? 2 : 1,
                      borderColor: isCurrent ? "#C96B8A" : "#F0EAF5",
                      opacity: isLocked ? 0.6 : 1,
                    }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: stateBg, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name={stateIcon} size={20} color={stateColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E" }}>Hari {s.day}: {s.title}</Text>
                      <Text style={{ fontSize: 11, color: "#9B9BAE", marginTop: 1 }}>{s.theme}</Text>
                      {rec?.mood && (
                        <Text style={{ fontSize: 11, color: "#9B9BAE", marginTop: 2 }}>
                          {MOODS[(rec.mood ?? 3) - 1]} {rec.durationMinutes} menit
                        </Text>
                      )}
                    </View>
                    {!isLocked && <Ionicons name="chevron-forward" size={16} color="#D0C8E0" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ height: 16 }} />
        </View>
      </ScrollView>
    </View>
  );
}
