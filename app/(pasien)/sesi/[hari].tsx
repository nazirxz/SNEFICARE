import { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { sessions } from "../../../src/data/mockData";
import { useApp } from "../../../src/context/AppContext";
import type { Patient } from "../../../src/data/mockData";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MODULES_ALL = [
  { id: "edukasi", label: "Edukasi", icon: "book", color: "#C96B8A", bg: "#F7E8EE" },
  { id: "musik", label: "Musik Terapi", icon: "musical-notes", color: "#8B7EC4", bg: "#EEE9F9" },
  { id: "afirmasi", label: "Afirmasi", icon: "mic", color: "#6BAF8F", bg: "#E8F5EE" },
  { id: "refleksi", label: "Refleksi", icon: "pencil", color: "#C49A40", bg: "#F5EDD8" },
] as const;

const MOODS = [
  { value: 1, emoji: "😢", label: "Sangat Berat" },
  { value: 2, emoji: "😟", label: "Berat" },
  { value: 3, emoji: "😐", label: "Biasa Saja" },
  { value: 4, emoji: "🙂", label: "Cukup Baik" },
  { value: 5, emoji: "😊", label: "Sangat Baik" },
];

function MusicPlayer({ duration, title, musicType }: { duration: number; title: string; musicType: string }) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e + 1 >= duration) {
            clearInterval(timerRef.current!);
            setPlaying(false);
            setDone(true);
            return duration;
          }
          return e + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current!);
    }
    return () => clearInterval(timerRef.current!);
  }, [playing, duration]);

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const pct = (elapsed / duration) * 100;

  return (
    <View style={{ gap: 16, alignItems: "center" }}>
      {/* Fake waveform */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3, height: 60 }}>
        {Array.from({ length: 20 }, (_, i) => {
          const h = 8 + Math.abs(Math.sin(i * 0.8)) * 32;
          return (
            <View key={i} style={{ width: 8, borderRadius: 4, height: playing ? h * (0.7 + Math.random() * 0.6) : h, backgroundColor: "#8B7EC4", opacity: elapsed / duration > i / 20 ? 1 : 0.3 }} />
          );
        })}
      </View>

      <View style={{ alignItems: "center", gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="volume-high" size={16} color="#8B7EC4" />
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#2D2D3E" }}>{title}</Text>
        </View>
        <View style={{ backgroundColor: "#EEE9F9", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, color: "#8B7EC4" }}>{musicType}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={{ width: "100%", gap: 6 }}>
        <View style={{ height: 8, backgroundColor: "#EEE9F9", borderRadius: 4 }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: "#8B7EC4", width: `${pct}%` as any }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 12, color: "#9B9BAE" }}>{fmtTime(elapsed)}</Text>
          <Text style={{ fontSize: 12, color: "#9B9BAE" }}>{fmtTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
        <TouchableOpacity onPress={() => { setElapsed(0); setDone(false); setPlaying(false); }}>
          <Ionicons name="refresh" size={24} color="#9B9BAE" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPlaying(!playing)}
          style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#8B7EC4", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name={playing ? "pause" : "play"} size={24} color="white" />
        </TouchableOpacity>
      </View>

      {done && (
        <View style={{ backgroundColor: "#E8F5EE", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="checkmark-circle" size={18} color="#6BAF8F" />
          <Text style={{ fontSize: 13, color: "#4A8F6A", fontWeight: "600" }}>Sesi musik selesai ✨</Text>
        </View>
      )}
    </View>
  );
}

export default function PatientSession() {
  const { hari } = useLocalSearchParams<{ hari: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, getPatientSessions, completeSession, getEffectiveCurrentDay } = useApp();
  const patient = currentUser as Patient;

  const day = parseInt(hari ?? "1");
  const sessionDef = sessions.find((s) => s.day === day);
  const allSessions = getPatientSessions(patient?.id ?? "");
  const todayDay = getEffectiveCurrentDay(patient?.id ?? "");
  const existingRecord = allSessions.find((s) => s.day === day);

  const [activeModule, setActiveModule] = useState(0);
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());
  const [mood, setMood] = useState<number | null>(null);
  const [reflection, setReflection] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());

  const modules = day === 1 ? MODULES_ALL : MODULES_ALL.slice(1);

  if (!sessionDef) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Sesi tidak ditemukan</Text>
      </View>
    );
  }

  const handleCompleteModule = () => {
    const next = new Set(completedModules);
    next.add(activeModule);
    setCompletedModules(next);
    if (activeModule < modules.length - 1) {
      setActiveModule(activeModule + 1);
    }
  };

  const handleSubmit = () => {
    if (!mood) {
      Alert.alert("Pilih Mood", "Silakan pilih mood kamu hari ini.");
      return;
    }
    const durationMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    completeSession(patient.id, {
      day,
      status: "selesai",
      completedAt: new Date().toISOString(),
      durationMinutes,
      mood,
      refleksiAnswers: reflection ? { q1: reflection } : undefined,
    });
    setSubmitted(true);
  };

  if (submitted || existingRecord?.status === "selesai") {
    return (
      <View style={{ flex: 1, backgroundColor: "#FEF9F7", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#E8F5EE", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Ionicons name="checkmark-circle" size={48} color="#6BAF8F" />
        </View>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#2D2D3E", textAlign: "center" }}>Sesi Selesai! 🎉</Text>
        <Text style={{ fontSize: 14, color: "#9B9BAE", textAlign: "center", marginTop: 8, lineHeight: 22 }}>
          Sesi hari {day} berhasil diselesaikan. Perawatmu akan meninjau progresmu.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(pasien)")}
          style={{ backgroundColor: "#C96B8A", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, marginTop: 24 }}
          activeOpacity={0.8}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentMod = modules[activeModule];
  const allModulesCompleted = completedModules.size === modules.length;

  return (
    <View style={{ flex: 1, backgroundColor: "#FEF9F7" }}>
      <StatusBar barStyle="light-content" backgroundColor={sessionDef.colorFrom} />

      {/* Header */}
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: sessionDef.colorFrom }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="chevron-back" size={22} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>Hari ke-{day}</Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "white" }}>{sessionDef.title}</Text>
          </View>
        </View>

        {/* Module tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {modules.map((mod, i) => {
              const isDone = completedModules.has(i);
              const isActive = activeModule === i;
              return (
                <TouchableOpacity
                  key={mod.id}
                  onPress={() => setActiveModule(i)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isActive ? "white" : "rgba(255,255,255,0.2)",
                  }}
                >
                  <Ionicons
                    name={isDone ? "checkmark-circle" : (mod.icon as any)}
                    size={16}
                    color={isActive ? sessionDef.colorFrom : "white"}
                  />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: isActive ? sessionDef.colorFrom : "white" }}>
                    {mod.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* Module content */}
        <View style={{ backgroundColor: "white", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: currentMod.bg, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={currentMod.icon as any} size={22} color={currentMod.color} />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#2D2D3E" }}>{currentMod.label}</Text>
              <Text style={{ fontSize: 12, color: "#9B9BAE" }}>Hari {day} · {sessionDef.theme}</Text>
            </View>
          </View>

          {currentMod.id === "edukasi" && (
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E" }}>{sessionDef.edukasi.title}</Text>
              {sessionDef.edukasi.content.map((pt: string, i: number) => (
                <Text key={i} style={{ fontSize: 13, lineHeight: 20, color: "#4A4A6A" }}>{pt}</Text>
              ))}
              {sessionDef.edukasi.keyPoints.length > 0 && (
                <View style={{ gap: 8, marginTop: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#C96B8A" }}>Poin Kunci:</Text>
                  {sessionDef.edukasi.keyPoints.map((pt: string, i: number) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#F7E8EE", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#C96B8A" }}>{i + 1}</Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 13, lineHeight: 20, color: "#4A4A6A" }}>{pt}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {currentMod.id === "musik" && (
            <MusicPlayer
              duration={sessionDef.musik.duration * 60}
              title={sessionDef.musik.title}
              musicType={sessionDef.musik.musicType}
            />
          )}

          {currentMod.id === "afirmasi" && (
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E" }}>{sessionDef.afirmasi.title}</Text>
              <View style={{ backgroundColor: "#E8F5EE", borderRadius: 14, padding: 16, borderLeftWidth: 3, borderLeftColor: "#6BAF8F" }}>
                <Text style={{ fontSize: 15, color: "#2A5A3A", fontStyle: "italic", lineHeight: 24 }}>"{sessionDef.afirmasi.mainText}"</Text>
              </View>
              <Text style={{ fontSize: 13, color: "#6B6B80", lineHeight: 20 }}>{sessionDef.afirmasi.instructions}</Text>
              {sessionDef.afirmasi.positivePhrases?.map((phrase: string, i: number) => (
                <View key={i} style={{ backgroundColor: "#F7E8EE", borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 13, color: "#C96B8A" }}>{phrase}</Text>
                </View>
              ))}
            </View>
          )}

          {currentMod.id === "refleksi" && (
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E" }}>{sessionDef.refleksi.title}</Text>
              {sessionDef.refleksi.questions.map((q: { id: string; label: string; placeholder: string }, i: number) => (
                <View key={q.id} style={{ gap: 6 }}>
                  <Text style={{ fontSize: 13, color: "#6B6B80" }}>{i + 1}. {q.label}</Text>
                  <TextInput
                    value={reflection}
                    onChangeText={setReflection}
                    placeholder={q.placeholder}
                    placeholderTextColor="#C0B8CC"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={{ backgroundColor: "#FEF9F7", borderWidth: 2, borderColor: "#F0E8EE", borderRadius: 12, padding: 12, fontSize: 13, color: "#2D2D3E", minHeight: 100 }}
                  />
                </View>
              ))}
            </View>
          )}

          {!completedModules.has(activeModule) && (
            <TouchableOpacity
              onPress={handleCompleteModule}
              style={{ backgroundColor: currentMod.color, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 }}
              activeOpacity={0.8}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
                {activeModule < modules.length - 1 ? "Lanjut ke Modul Berikutnya →" : "Selesaikan Modul Ini ✓"}
              </Text>
            </TouchableOpacity>
          )}
          {completedModules.has(activeModule) && (
            <View style={{ backgroundColor: "#E8F5EE", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="checkmark-circle" size={18} color="#6BAF8F" />
              <Text style={{ fontSize: 13, color: "#4A8F6A", fontWeight: "600" }}>Modul selesai ✨</Text>
            </View>
          )}
        </View>

        {/* Mood & submit — show when all modules done */}
        {allModulesCompleted && (
          <View style={{ backgroundColor: "white", borderRadius: 20, padding: 20, gap: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#2D2D3E" }}>Bagaimana perasaanmu hari ini?</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => setMood(m.value)}
                  style={{ alignItems: "center", gap: 6, padding: 8, borderRadius: 12, backgroundColor: mood === m.value ? "#F7E8EE" : "transparent", borderWidth: mood === m.value ? 2 : 0, borderColor: "#C96B8A" }}
                >
                  <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
                  <Text style={{ fontSize: 9, color: "#9B9BAE", textAlign: "center" }}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              style={{ backgroundColor: "#C96B8A", borderRadius: 16, paddingVertical: 16, alignItems: "center" }}
              activeOpacity={0.8}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Selesaikan Sesi Hari Ini 🎉</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}
