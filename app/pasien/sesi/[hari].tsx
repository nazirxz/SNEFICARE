import { useState, useRef, useMemo, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Alert, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import YoutubePlayer, { YoutubeIframeRef } from "react-native-youtube-iframe";
import { useApp } from "../../../src/context/AppContext";
import type { Patient, RelaxationTrack, RelaxationCategory } from "../../../src/types/domain";
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

const CATEGORY_META: Record<RelaxationCategory, { label: string; icon: string }> = {
  "ombak":      { label: "Ombak",      icon: "water" },
  "hujan":      { label: "Hujan",      icon: "rainy" },
  "hutan":      { label: "Hutan",      icon: "leaf" },
  "sungai":     { label: "Sungai",     icon: "git-branch" },
  "air-terjun": { label: "Air Terjun", icon: "trending-down" },
  "burung":     { label: "Burung",     icon: "musical-note" },
  "angin":      { label: "Angin",      icon: "cloud-outline" },
  "musik":      { label: "Musik",      icon: "musical-notes" },
  "campuran":   { label: "Campuran",   icon: "layers" },
};

function MusicPlayer({
  tracks,
  fallbackTitle,
  fallbackType,
  onFinish,
}: {
  tracks: RelaxationTrack[];
  fallbackTitle: string;
  fallbackType: string;
  onFinish?: () => void;
}) {
  const playerRef = useRef<YoutubeIframeRef>(null);
  const [selectedId, setSelectedId] = useState<string | null>(tracks[0]?.id ?? null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [finished, setFinished] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedTrack = useMemo(
    () => tracks.find((t) => t.id === selectedId) ?? tracks[0] ?? null,
    [tracks, selectedId],
  );

  const onChangeState = useCallback((state: string) => {
    if (state === "playing") setPlaying(true);
    else if (state === "paused" || state === "buffering") setPlaying(false);
    else if (state === "ended") {
      setPlaying(false);
      setFinished(true);
      onFinish?.();
    }
  }, [onFinish]);

  const onError = useCallback((err: string) => {
    setErrorMsg(err || "Gagal memuat video");
    setPlaying(false);
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setReady(false);
    setPlaying(false);
    setFinished(false);
    setErrorMsg(null);
  };

  const toggle = () => setPlaying((p) => !p);

  const displayTitle = selectedTrack?.title ?? fallbackTitle;
  const displayType = selectedTrack ? CATEGORY_META[selectedTrack.category]?.label ?? fallbackType : fallbackType;

  if (tracks.length === 0) {
    return (
      <View style={{ padding: 16, borderRadius: 14, backgroundColor: "#F7E8EE", gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#C96B8A" }}>Belum ada video relaksasi</Text>
        <Text style={{ fontSize: 12, color: "#6B6B80", lineHeight: 18 }}>
          Hubungi perawatmu untuk meminta konten relaksasi ditambahkan.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {/* Category selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8, paddingVertical: 2 }}>
          {tracks.map((t) => {
            const isSel = t.id === selectedTrack?.id;
            const meta = CATEGORY_META[t.category];
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleSelect(t.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: isSel ? "#8B7EC4" : "#EEE9F9",
                }}
              >
                <Ionicons name={(meta?.icon ?? "musical-notes") as any} size={14} color={isSel ? "white" : "#8B7EC4"} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: isSel ? "white" : "#8B7EC4" }}>
                  {meta?.label ?? t.category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* YouTube iframe */}
      <View style={{ borderRadius: 14, overflow: "hidden", backgroundColor: "#0A0A0A", position: "relative" }}>
        {selectedTrack ? (
          <YoutubePlayer
            ref={playerRef}
            key={selectedTrack.id}
            height={200}
            play={playing}
            videoId={selectedTrack.youtubeVideoId}
            onChangeState={onChangeState}
            onReady={() => setReady(true)}
            onError={onError}
            webViewProps={{ androidLayerType: "hardware" }}
            initialPlayerParams={{
              controls: true,
              modestbranding: true,
              rel: false,
              iv_load_policy: 3,
            }}
          />
        ) : null}
        {!ready && !errorMsg && (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color="white" />
          </View>
        )}
      </View>

      {/* Track info */}
      <View style={{ alignItems: "center", gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="volume-high" size={16} color="#8B7EC4" />
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#2D2D3E" }} numberOfLines={1}>
            {displayTitle}
          </Text>
        </View>
        <View style={{ backgroundColor: "#EEE9F9", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, color: "#8B7EC4" }}>{displayType}</Text>
        </View>
        {selectedTrack?.description ? (
          <Text style={{ fontSize: 12, color: "#6B6B80", textAlign: "center", paddingHorizontal: 8 }}>
            {selectedTrack.description}
          </Text>
        ) : null}
      </View>

      {/* Quick toggle (shortcut ke iframe controls) */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        <TouchableOpacity
          onPress={toggle}
          disabled={!ready || !!errorMsg}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 22,
            paddingVertical: 12,
            borderRadius: 28,
            backgroundColor: !ready || errorMsg ? "#C9C4D8" : "#8B7EC4",
          }}
          activeOpacity={0.8}
        >
          <Ionicons name={playing ? "pause" : "play"} size={18} color="white" />
          <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
            {playing ? "Jeda" : "Putar"}
          </Text>
        </TouchableOpacity>
      </View>

      {errorMsg && (
        <View style={{ backgroundColor: "#FDECEC", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          <Ionicons name="alert-circle" size={18} color="#C9414A" style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 12, color: "#8B2E37", lineHeight: 18 }}>
            Gagal memutar video. Pastikan koneksi internetmu stabil atau video masih tersedia. ({errorMsg})
          </Text>
        </View>
      )}

      {finished && !errorMsg && (
        <View style={{ backgroundColor: "#E8F5EE", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="checkmark-circle" size={18} color="#6BAF8F" />
          <Text style={{ fontSize: 13, color: "#4A8F6A", fontWeight: "600" }}>Video relaksasi selesai ✨</Text>
        </View>
      )}
    </View>
  );
}

export default function PatientSession() {
  const { hari } = useLocalSearchParams<{ hari: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, getPatientSessions, completeSession, getEffectiveCurrentDay, getProgramSessions, getRelaxationTracks } = useApp();
  const patient = currentUser as Patient;
  const sessions = getProgramSessions();

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
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async () => {
    if (!mood) {
      Alert.alert("Pilih Mood", "Silakan pilih mood kamu hari ini.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    const durationMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    const result = await completeSession(patient.id, {
      day,
      status: "selesai",
      completedAt: new Date().toISOString(),
      durationMinutes,
      mood,
      refleksiAnswers: reflection ? { q1: reflection } : undefined,
    });
    setSubmitting(false);
    if (!result.success) {
      Alert.alert(
        "Gagal Menyimpan",
        `Sesi belum tersimpan di server. Coba lagi.\n\nDetail: ${result.error ?? "tidak diketahui"}`,
      );
      return;
    }
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
          onPress={() => router.replace("/pasien")}
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
              tracks={getRelaxationTracks()}
              fallbackTitle={sessionDef.musik.title}
              fallbackType={sessionDef.musik.musicType}
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
              disabled={submitting}
              style={{ backgroundColor: submitting ? "#D9A8B9" : "#C96B8A", borderRadius: 16, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10 }}
              activeOpacity={0.8}
            >
              {submitting && <ActivityIndicator color="white" />}
              <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                {submitting ? "Menyimpan..." : "Selesaikan Sesi Hari Ini 🎉"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}
