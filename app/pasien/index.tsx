import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../src/context/AppContext";
import { sessions } from "../../src/data/mockData";
import type { Patient } from "../../src/data/mockData";
import { PROGRAM_CONTACT } from "../../src/data/programContact";
import { isProgramInterventionComplete } from "../../src/data/researchQuestionnaire";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const motivationalQuotes = [
  "Kamu lebih kuat dari yang kamu kira. 💗",
  "Setiap hari yang kamu lalui adalah bukti keberanianmu. 🌸",
  "Langkah kecil tetap adalah langkah maju. ✨",
  "Kamu tidak sendirian dalam perjalanan ini. 🤍",
  "Tubuhmu berjuang, dan kamu mendukungnya. 🌺",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function PatientDashboard() {
  const { currentUser, getPatientSessions, getEffectiveCurrentDay, getQuestionnaireBundle } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const patient = currentUser as Patient;
  const allSessions = getPatientSessions(patient?.id ?? "");
  const quote = motivationalQuotes[new Date().getDay() % motivationalQuotes.length];

  const completedCount = allSessions.filter((s) => s.status === "selesai").length;
  const progressPct = Math.round((completedCount / 15) * 100);
  const todayDay = getEffectiveCurrentDay(patient?.id ?? "");
  const todaySessionDef = sessions.find((s) => s.day === todayDay);
  const todayRecord = allSessions.find((s) => s.day === todayDay);
  const isTodayCompleted = todayRecord?.status === "selesai";
  const todayApproval = todayRecord?.approvalStatus;
  const recentCompleted = allSessions
    .filter((s) => s.status === "selesai" && s.approvalStatus === "disetujui")
    .slice(-3)
    .reverse();

  const qBundle = getQuestionnaireBundle(patient?.id ?? "");
  const preTestDone = Boolean(qBundle.pre);
  const postTestDone = Boolean(qBundle.post);
  const programComplete = isProgramInterventionComplete(allSessions);
  const needsPreTest = !preTestDone;
  const needsPostTest = programComplete && preTestDone && !postTestDone;

  function getDotState(d: number) {
    const rec = allSessions.find((s) => s.day === d);
    if (!rec || rec.status !== "selesai") {
      return d === todayDay ? "current" : d < todayDay ? "missed" : "locked";
    }
    if (rec.approvalStatus === "disetujui") return "approved";
    if (rec.approvalStatus === "menunggu") return "pending";
    if (rec.approvalStatus === "ditolak") return "rejected";
    return "approved";
  }

  const dotColors: Record<string, { bg: string; borderColor?: string; borderWidth?: number }> = {
    approved: { bg: "#6BAF8F" },
    pending: { bg: "#F5A623", borderColor: "#D4891A", borderWidth: 2 },
    rejected: { bg: "#E85858" },
    current: { bg: "#F7E8EE", borderColor: "#C96B8A", borderWidth: 2 },
    missed: { bg: "#F0EDF5" },
    locked: { bg: "#F0EDF5" },
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FEF9F7" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7E8EE" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: insets.top + 16,
            paddingBottom: 24,
            backgroundColor: "#F7E8EE",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <View>
              <Text style={{ fontSize: 13, color: "#9B7B8A" }}>{getGreeting()},</Text>
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#2D2D3E" }}>
                {patient?.name?.split(" ")[0]} 🌸
              </Text>
            </View>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: "#E8789A",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="heart" size={24} color="white" />
            </View>
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 16, padding: 12, marginTop: 12 }}>
            <Text style={{ fontSize: 13, color: "#8B6B8A", fontStyle: "italic" }}>{quote}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingVertical: 20, gap: 20 }}>
          {/* Pre-test banner */}
          {needsPreTest && (
            <View style={{ backgroundColor: "#FFF8E8", borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: "#F0D090", gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <Ionicons name="clipboard" size={20} color="#C49A40" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#8A6A20" }}>Kuesioner pra wajib diisi</Text>
                  <Text style={{ fontSize: 12, color: "#B09040", marginTop: 4, lineHeight: 18 }}>
                    Sebelum memulai sesi hari pertama, lengkapi kuesioner penelitian (SMSES-BC) terlebih dahulu.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/pasien/kuesioner/pre" as any)}
                style={{ backgroundColor: "#C49A40", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>Isi kuesioner pra →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Post-test banner */}
          {needsPostTest && (
            <View style={{ backgroundColor: "#E8F5EE", borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: "#B0DDB8", gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <Ionicons name="clipboard" size={20} color="#4A8F6A" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#2A5A3A" }}>Kuesioner pasca program</Text>
                  <Text style={{ fontSize: 12, color: "#3A7A5A", marginTop: 4, lineHeight: 18 }}>
                    Selamat, kamu telah menyelesaikan 15 hari! Mohon isi kuesioner pasca (post-test).
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/pasien/kuesioner/post" as any)}
                style={{ backgroundColor: "#6BAF8F", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>Isi kuesioner pasca →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Progress strip */}
          <View style={{ backgroundColor: "white", borderRadius: 20, padding: 16, shadowColor: "#C96B8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E" }}>Program 15 Hari</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#C96B8A" }}>{progressPct}%</Text>
            </View>
            <View style={{ height: 10, backgroundColor: "#F7E8EE", borderRadius: 10, marginBottom: 8 }}>
              <View style={{ height: 10, backgroundColor: "#E8789A", borderRadius: 10, width: `${progressPct}%` as any }} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 11, color: "#9B9BAE" }}>{completedCount} dari 15 sesi selesai</Text>
              <Text style={{ fontSize: 11, color: "#9B9BAE" }}>Hari ke-{todayDay}</Text>
            </View>

            {/* Day dots */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 12 }}>
              {Array.from({ length: 15 }, (_, i) => i + 1).map((d) => {
                const state = getDotState(d);
                const style = dotColors[state] ?? dotColors.locked;
                return (
                  <View
                    key={d}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: style.bg,
                      borderColor: style.borderColor,
                      borderWidth: style.borderWidth ?? 0,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {state === "approved" && <Ionicons name="checkmark" size={12} color="white" />}
                    {state === "pending" && <Ionicons name="time" size={10} color="white" />}
                    {state === "rejected" && <Text style={{ fontSize: 8, color: "white", fontWeight: "700" }}>✗</Text>}
                    {(state === "current" || state === "missed" || state === "locked") && (
                      <Text style={{ fontSize: 9, color: state === "current" ? "#C96B8A" : "#C0B8D0", fontWeight: "700" }}>{d}</Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Legend */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              {[
                { color: "#6BAF8F", label: "Disetujui" },
                { color: "#F5A623", label: "Menunggu" },
                { color: "#E85858", label: "Ditinjau" },
              ].map(({ color, label }) => (
                <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
                  <Text style={{ fontSize: 10, color: "#9B9BAE" }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Today's session */}
          <View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E", marginBottom: 12 }}>Sesi Hari Ini</Text>
            {todaySessionDef && (
              <View style={{ borderRadius: 20, overflow: "hidden", shadowColor: "#C96B8A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 }}>
                {/* Gradient header - simulated with solid color */}
                <View style={{ padding: 20, backgroundColor: todaySessionDef.colorFrom }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: "flex-start" }}>
                        <Text style={{ fontSize: 11, color: "white", fontWeight: "600" }}>Hari ke-{todayDay}</Text>
                      </View>
                      <Text style={{ fontSize: 18, fontWeight: "800", color: "white", marginTop: 8 }}>{todaySessionDef.title}</Text>
                      <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>{todaySessionDef.theme}</Text>
                    </View>
                    {isTodayCompleted && (todayApproval === "disetujui" || todayApproval === "menunggu") && (
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name={todayApproval === "disetujui" ? "checkmark-circle" : "time"} size={24} color="white" />
                      </View>
                    )}
                  </View>

                  <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                    {[
                      { icon: "book", label: "Edukasi" },
                      { icon: "musical-notes", label: "Musik" },
                      { icon: "mic", label: "Afirmasi" },
                      { icon: "pencil", label: "Refleksi" },
                    ].slice(todayDay === 1 ? 0 : 1).map(({ icon, label }) => (
                      <View key={label} style={{ alignItems: "center", gap: 4 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name={icon as any} size={16} color="white" />
                        </View>
                        <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.8)" }}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={{ padding: 16, backgroundColor: "white" }}>
                  {isTodayCompleted && todayApproval === "disetujui" && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons name="star" size={20} color="#6BAF8F" />
                      <Text style={{ color: "#6BAF8F", fontWeight: "700" }}>Sesi hari ini disetujui perawat 🎉</Text>
                    </View>
                  )}
                  {isTodayCompleted && todayApproval === "menunggu" && (
                    <View style={{ backgroundColor: "#FFF8E8", borderRadius: 12, padding: 12, flexDirection: "row", gap: 10 }}>
                      <Ionicons name="time" size={18} color="#C49A40" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#8A6A20" }}>Menunggu persetujuan perawat ⏳</Text>
                        <Text style={{ fontSize: 12, color: "#B09040", marginTop: 2 }}>Perawatmu akan meninjau progresmu sebelum lanjut.</Text>
                      </View>
                    </View>
                  )}
                  {isTodayCompleted && todayApproval === "ditolak" && (
                    <View style={{ gap: 12 }}>
                      <View style={{ backgroundColor: "#FFF0F0", borderRadius: 12, padding: 12, flexDirection: "row", gap: 10 }}>
                        <Ionicons name="alert-circle" size={18} color="#C85858" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: "700", color: "#8A3838" }}>Sesi perlu ditinjau ulang</Text>
                          {todayRecord?.approvalNote ? (
                            <Text style={{ fontSize: 12, color: "#9B5858", marginTop: 4 }}>📋 Catatan perawat: "{todayRecord.approvalNote}"</Text>
                          ) : null}
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => router.push(`/pasien/sesi/${todayDay}` as any)}
                        style={{ backgroundColor: todaySessionDef.colorFrom, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
                      >
                        <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>Ulangi Sesi Hari Ini →</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {!isTodayCompleted && (
                    <TouchableOpacity
                      onPress={() => router.push(needsPreTest ? "/pasien/kuesioner/pre" : `/pasien/sesi/${todayDay}` as any)}
                      style={{ backgroundColor: todaySessionDef.colorFrom, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
                        {needsPreTest ? "Isi kuesioner pra dulu →" : "Mulai Sesi Hari Ini →"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Upcoming sessions */}
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E" }}>Sesi Berikutnya</Text>
              <TouchableOpacity onPress={() => router.push("/pasien/kemajuan" as any)}>
                <Text style={{ fontSize: 13, color: "#C96B8A", fontWeight: "600" }}>Lihat semua</Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              {sessions.filter((s) => s.day > todayDay).slice(0, 3).map((s) => (
                <View key={s.day} style={{ backgroundColor: "white", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#F5F0F8", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="lock-closed" size={16} color="#C0B8D0" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E" }}>Hari {s.day}: {s.title}</Text>
                    <Text style={{ fontSize: 11, color: "#9B9BAE", marginTop: 2 }}>{s.theme}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#D0C8E0" />
                </View>
              ))}
            </View>
          </View>

          {/* Recent completed */}
          {recentCompleted.length > 0 && (
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E", marginBottom: 12 }}>Sesi Terselesaikan</Text>
              <View style={{ gap: 8 }}>
                {recentCompleted.map((s) => {
                  const def = sessions.find((sd) => sd.day === s.day);
                  return (
                    <View key={s.day} style={{ backgroundColor: "#F8F5FF", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Ionicons name="checkmark-circle" size={20} color="#6BAF8F" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#2D2D3E" }}>Hari {s.day}: {def?.title}</Text>
                        <Text style={{ fontSize: 11, color: "#9B9BAE", marginTop: 2 }}>
                          {s.mood ? ["😢", "😟", "😐", "🙂", "😊"][s.mood - 1] : ""} Durasi: {s.durationMinutes} menit
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Program contact */}
          <View style={{ backgroundColor: "white", borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: "#F0E8EE", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#F7E8EE", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="headset" size={20} color="#C96B8A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E" }}>Kontak pendamping</Text>
              <Text style={{ fontSize: 12, color: "#6B6B80", marginTop: 2 }}>{PROGRAM_CONTACT.name}</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#C96B8A", marginTop: 2 }}>{PROGRAM_CONTACT.phoneDisplay}</Text>
            </View>
          </View>

          <View style={{ height: 16 }} />
        </View>
      </ScrollView>
    </View>
  );
}
