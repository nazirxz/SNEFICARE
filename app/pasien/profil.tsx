import { View, Text, ScrollView, TouchableOpacity, Alert, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../src/context/AppContext";
import type { Patient } from "../../src/types/domain";
import { PROGRAM_CONTACT } from "../../src/data/programContact";
import { isProgramInterventionComplete } from "../../src/data/researchQuestionnaire";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PatientProfile() {
  const { currentUser, logout, getPatientSessions, getQuestionnaireBundle } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const patient = currentUser as Patient;
  const sessions = getPatientSessions(patient?.id ?? "");
  const completed = sessions.filter((s) => s.status === "selesai");
  const qBundle = getQuestionnaireBundle(patient?.id ?? "");
  const programDone = isProgramInterventionComplete(sessions);
  const canPostTest = programDone && Boolean(qBundle.pre) && !qBundle.post;

  const handleLogout = () => {
    Alert.alert("Keluar", "Apakah kamu yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: async () => { await logout(); router.replace("/"); } },
    ]);
  };

  const infoItems = [
    { icon: "person", label: "Nama Lengkap", value: patient?.name },
    { icon: "fitness", label: "Diagnosis", value: patient?.diagnosis },
    { icon: "heart", label: "Siklus Kemoterapi", value: patient?.chemoCycle },
    { icon: "calendar", label: "Tanggal Mulai Program", value: patient?.startDate ? new Date(patient.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—" },
    { icon: "call", label: "Nomor Telepon", value: patient?.phone },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#FEF9F7" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7E8EE" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 32, backgroundColor: "#F7E8EE", alignItems: "center", gap: 12 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#E8789A", alignItems: "center", justifyContent: "center", shadowColor: "#C96B8A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}>
            <Ionicons name="person" size={40} color="white" />
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#2D2D3E" }}>{patient?.name}</Text>
            <Text style={{ fontSize: 13, color: "#9B7B8A", marginTop: 2 }}>Pasien SNEfi Care</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {[
              { label: "Sesi Selesai", value: completed.length },
              { label: "Hari Aktif", value: patient?.currentDay ?? 1 },
            ].map(({ label, value }) => (
              <View key={label} style={{ backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: "#C96B8A" }}>{value}</Text>
                <Text style={{ fontSize: 11, color: "#9B7B8A" }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingVertical: 20, gap: 16 }}>
          {/* Post-test CTA */}
          {canPostTest && (
            <TouchableOpacity
              onPress={() => router.push("/pasien/kuesioner/post" as any)}
              style={{ backgroundColor: "#6BAF8F", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
              activeOpacity={0.8}
            >
              <Ionicons name="clipboard" size={24} color="white" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "white" }}>Isi Kuesioner Pasca</Text>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>Program 15 hari selesai! Isi kuesioner post-test.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          )}

          {/* Info items */}
          <View style={{ backgroundColor: "white", borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
            {infoItems.map(({ icon, label, value }, i) => (
              <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i < infoItems.length - 1 ? 1 : 0, borderBottomColor: "#F0EAF5" }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#F7E8EE", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={icon as any} size={18} color="#C96B8A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: "#9B9BAE" }}>{label}</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#2D2D3E", marginTop: 2 }}>{value ?? "—"}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Program contact */}
          <View style={{ backgroundColor: "white", borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: "#F0E8EE", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#F7E8EE", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="headset" size={20} color="#C96B8A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E" }}>Kontak Pendamping</Text>
              <Text style={{ fontSize: 12, color: "#6B6B80", marginTop: 2 }}>{PROGRAM_CONTACT.name}</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#C96B8A", marginTop: 2 }}>{PROGRAM_CONTACT.phoneDisplay}</Text>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{ backgroundColor: "white", borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: "#FEE0E0" }}
            activeOpacity={0.8}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#FEF0F0", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="log-out" size={20} color="#E85858" />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#E85858" }}>Keluar dari Akun</Text>
          </TouchableOpacity>

          <Text style={{ textAlign: "center", fontSize: 11, color: "#C0B8D0", marginTop: 8 }}>
            SNEfi Care v1.0.0 · © 2026 Platform Terapi Digital
          </Text>
          <View style={{ height: 16 }} />
        </View>
      </ScrollView>
    </View>
  );
}
