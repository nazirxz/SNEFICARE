import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../../src/context/AppContext";
import type { Patient } from "../../../src/types/domain";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MOODS = ["😢", "😟", "😐", "🙂", "😊"];
const MOOD_LABELS = ["Sangat Berat", "Berat", "Biasa Saja", "Cukup Baik", "Sangat Baik"];

function ApprovalCard({ session, sessionDefs, onApprove }: {
  session: any;
  sessionDefs: { day: number; title: string }[];
  onApprove: (day: number, status: "disetujui" | "ditolak", note: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
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
          </View>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#9B9BAE" />
      </TouchableOpacity>

      {/* Expanded */}
      {expanded && (
        <View style={{ padding: 14, gap: 12 }}>
          {reflectionText ? (
            <View style={{ backgroundColor: "#F8F5FF", borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#9B9BAE", marginBottom: 4 }}>Refleksi pasien:</Text>
              <Text style={{ fontSize: 13, color: "#4A4A6A", lineHeight: 20, fontStyle: "italic" }}>"{reflectionText}"</Text>
            </View>
          ) : null}

          {!rejectMode ? (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => { onApprove(session.day, "disetujui", ""); setSubmitted(true); }}
                style={{ flex: 1, backgroundColor: "#6BAF8F", borderRadius: 12, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={16} color="white" />
                <Text style={{ color: "white", fontWeight: "700" }}>Setujui</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRejectMode(true)}
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
                  onPress={() => { onApprove(session.day, "ditolak", note); setSubmitted(true); }}
                  style={{ flex: 1, backgroundColor: "#E85858", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>Kirim Penolakan</Text>
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
  const { getPatientById, getPatientSessions, approveSession, getProgramSessions } = useApp();
  const sessions = getProgramSessions();

  const patient = getPatientById(id ?? "") as Patient | undefined;
  const allSessions = getPatientSessions(id ?? "");

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
