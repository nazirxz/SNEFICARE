import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../src/context/AppContext";
import { sessions } from "../../src/data/mockData";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MOODS = ["😢", "😟", "😐", "🙂", "😊"];

function AdherenceBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "#6BAF8F" : pct >= 50 ? "#C49A40" : "#C96B8A";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "#F0EDF8" }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: color, width: `${pct}%` as any }} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: "700", color }}>{pct}%</Text>
    </View>
  );
}

export default function NurseDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getAllPatients, getPatientSessions, getPendingApprovals, logout } = useApp();
  const patients = getAllPatients();

  const patientStats = patients.map((p) => {
    const sess = getPatientSessions(p.id);
    const completed = sess.filter((s) => s.status === "selesai");
    const adherence = Math.round((completed.length / 15) * 100);
    const todayDone = sess.find((s) => s.day === p.currentDay)?.status === "selesai";
    const lastMood = completed.length > 0 ? completed[completed.length - 1]?.mood : null;
    const totalDur = completed.reduce((a, s) => a + (s.durationMinutes ?? 0), 0);
    const pendingCount = sess.filter((s) => s.approvalStatus === "menunggu").length;
    return { ...p, completed: completed.length, adherence, todayDone, lastMood, totalDur, pendingCount };
  });

  const totalCompleted = patientStats.reduce((a, p) => a + p.completed, 0);
  const avgAdherence =
    patientStats.length > 0
      ? Math.round(patientStats.reduce((a, p) => a + p.adherence, 0) / patientStats.length)
      : 0;
  const todayActive = patientStats.filter((p) => p.todayDone).length;
  const pendingApprovals = getPendingApprovals();
  const totalPending = pendingApprovals.length;
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const hasLowAdherence = patientStats.some((p) => p.adherence < 50);

  const handleLogout = () => {
    Alert.alert("Keluar", "Apakah kamu yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: async () => { await logout(); router.replace("/"); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FEF9F7" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F0F8" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#F5F0F8", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#2D2D3E" }}>Dashboard Perawat</Text>
            <Text style={{ fontSize: 12, color: "#8B7EC4", marginTop: 2 }}>{today}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EEE9F9", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="log-out-outline" size={18} color="#8B7EC4" />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, paddingVertical: 20, gap: 20 }}>
          {/* Tambah Pasien */}
          <TouchableOpacity
            onPress={() => router.push("/perawat/tambah-pasien")}
            style={{
              backgroundColor: "#8B7EC4",
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              shadowColor: "#8B7EC4",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={20} color="white" />
            <Text style={{ color: "white", fontSize: 15, fontWeight: "700" }}>
              Daftarkan Pasien Baru
            </Text>
          </TouchableOpacity>

          {/* Stats grid */}
          <View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E", marginBottom: 12 }}>Ringkasan Hari Ini</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[
                { label: "Total Pasien", value: patients.length, icon: "people", color: "#8B7EC4", bg: "#EEE9F9" },
                { label: "Sesi Hari Ini", value: todayActive, icon: "checkmark-circle", color: "#6BAF8F", bg: "#E8F5EE" },
                { label: "Total Sesi", value: totalCompleted, icon: "star", color: "#C49A40", bg: "#F5EDD8" },
                { label: "Kepatuhan Rata", value: `${avgAdherence}%`, icon: "trending-up", color: "#C96B8A", bg: "#F7E8EE" },
              ].map(({ label, value, icon, color, bg }) => (
                <View key={label} style={{ width: "47%", backgroundColor: "white", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: bg, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <Ionicons name={icon as any} size={16} color={color} />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: "#2D2D3E" }}>{value}</Text>
                  <Text style={{ fontSize: 11, color: "#9B9BAE", marginTop: 2 }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pending approvals banner */}
          {totalPending > 0 && (
            <View style={{ backgroundColor: "#FFF3D0", borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#F0D090" }}>
              <View style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="notifications" size={18} color="#C49A40" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#8A6A20" }}>{totalPending} sesi menunggu persetujuanmu</Text>
                  <Text style={{ fontSize: 12, color: "#B09040", marginTop: 2 }}>Tinjau untuk mengizinkan pasien lanjut</Text>
                </View>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#C49A40", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "white" }}>{totalPending}</Text>
                </View>
              </View>
              {pendingApprovals.slice(0, 3).map(({ patient, session }) => {
                const def = sessions.find((s) => s.day === session.day);
                return (
                  <TouchableOpacity
                    key={`${patient.id}-${session.day}`}
                    onPress={() => router.push(`/perawat/pasien/${patient.id}` as any)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#FAF8FF" }}
                    activeOpacity={0.8}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEE9F9", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: "#8B7EC4" }}>{patient.name[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#2D2D3E" }}>{patient.name}</Text>
                      <Text style={{ fontSize: 11, color: "#9B9BAE" }}>Hari {session.day}: {def?.title}</Text>
                    </View>
                    <View style={{ backgroundColor: "#FFF3D0", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: "#8A6A20" }}>Tinjau</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Low adherence alert */}
          {hasLowAdherence && (
            <View style={{ backgroundColor: "#FFF0F0", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderColor: "#F0C8C8" }}>
              <Ionicons name="alert-circle" size={18} color="#C85858" style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 13, color: "#8A3838", lineHeight: 20 }}>
                Beberapa pasien memiliki kepatuhan di bawah 50%. Pertimbangkan untuk menghubungi mereka.
              </Text>
            </View>
          )}

          {/* Patient list */}
          <View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E", marginBottom: 12 }}>Daftar Pasien</Text>
            <View style={{ gap: 12 }}>
              {patientStats.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => router.push(`/perawat/pasien/${p.id}` as any)}
                  style={{
                    backgroundColor: "white",
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: p.pendingCount > 0 ? 1.5 : 1,
                    borderColor: p.pendingCount > 0 ? "#F0D090" : "#F5F0F8",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 3,
                    gap: 10,
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: "#EEE9F9", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 18, fontWeight: "800", color: "#8B7EC4" }}>{p.name[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#2D2D3E" }}>{p.name}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          {p.pendingCount > 0 && (
                            <View style={{ backgroundColor: "#FFF3D0", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
                              <Text style={{ fontSize: 11, fontWeight: "700", color: "#8A6A20" }}>⏳ {p.pendingCount}</Text>
                            </View>
                          )}
                          <Ionicons name="chevron-forward" size={16} color="#C0B8D0" />
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: "#9B9BAE", marginTop: 2 }}>{p.chemoCycle} · Hari ke-{p.currentDay}</Text>
                    </View>
                  </View>

                  {/* Stats row */}
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {[
                      { icon: "checkmark-circle", color: "#6BAF8F", value: `${p.completed}/15 sesi` },
                      { icon: "time", color: "#8B7EC4", value: `${p.totalDur} mnt` },
                      p.lastMood ? { icon: "happy", color: "#C49A40", value: MOODS[p.lastMood - 1] } : null,
                    ].filter(Boolean).map((item, i) => (
                      <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name={(item as any).icon} size={14} color={(item as any).color} />
                        <Text style={{ fontSize: 12, color: "#6B6B80", fontWeight: "600" }}>{(item as any).value}</Text>
                      </View>
                    ))}
                  </View>

                  <AdherenceBar pct={p.adherence} />

                  {/* Today status */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    <View style={{ backgroundColor: p.todayDone ? "#E8F5EE" : "#F7E8EE", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: p.todayDone ? "#4A8F6A" : "#C96B8A" }}>
                        {p.todayDone ? "✓ Sesi hari ini selesai" : "○ Sesi hari ini belum selesai"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 16 }} />
        </View>
      </ScrollView>
    </View>
  );
}
