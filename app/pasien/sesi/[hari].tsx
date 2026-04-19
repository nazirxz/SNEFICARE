import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Alert, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import YoutubePlayer, { YoutubeIframeRef } from "react-native-youtube-iframe";
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  useAudioPlayerStatus,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from "expo-audio";
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

const MAX_PLAY_SEC = 30 * 60;
const MAX_AFIRMASI_SEC = 120;

const fmtSec = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

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
  const [elapsedSec, setElapsedSec] = useState(0);

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
    setElapsedSec(0);
  };

  useEffect(() => {
    if (!playing || !ready || finished) return;
    const interval = setInterval(async () => {
      try {
        const t = await playerRef.current?.getCurrentTime();
        if (typeof t !== "number") return;
        setElapsedSec(t);
        if (t >= MAX_PLAY_SEC) {
          setPlaying(false);
          setFinished(true);
          onFinish?.();
        }
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, [playing, ready, finished, onFinish]);

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

      {/* Durasi limit 30 menit */}
      <View style={{ gap: 6 }}>
        <View style={{ height: 6, backgroundColor: "#EEE9F9", borderRadius: 3, overflow: "hidden" }}>
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: finished ? "#6BAF8F" : "#8B7EC4",
              width: `${Math.min(100, (elapsedSec / MAX_PLAY_SEC) * 100)}%` as any,
            }}
          />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 11, color: "#9B9BAE" }}>
            {fmtSec(Math.min(elapsedSec, MAX_PLAY_SEC))} / {fmtSec(MAX_PLAY_SEC)}
          </Text>
          <Text style={{ fontSize: 10, color: "#9B9BAE", fontStyle: "italic" }}>Batas sesi 30 menit</Text>
        </View>
      </View>

      {/* Quick toggle (shortcut ke iframe controls) */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        <TouchableOpacity
          onPress={toggle}
          disabled={!ready || !!errorMsg || finished}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 22,
            paddingVertical: 12,
            borderRadius: 28,
            backgroundColor: !ready || errorMsg || finished ? "#C9C4D8" : "#8B7EC4",
          }}
          activeOpacity={0.8}
        >
          <Ionicons name={playing ? "pause" : "play"} size={18} color="white" />
          <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
            {finished ? "Selesai" : playing ? "Jeda" : "Putar"}
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
          <Text style={{ fontSize: 13, color: "#4A8F6A", fontWeight: "600", flex: 1 }}>
            Sesi relaksasi 30 menit selesai ✨ Pilih kategori lain untuk mulai baru.
          </Text>
        </View>
      )}
    </View>
  );
}

function AfirmasiRecorder({
  confirmedUri,
  onConfirm,
  onClear,
}: {
  confirmedUri: string | null;
  onConfirm: (uri: string) => void;
  onClear: () => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 250);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [permError, setPermError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const player = useAudioPlayer(previewUri ?? confirmedUri ?? null);
  const playerStatus = useAudioPlayerStatus(player);

  const recordingSec = Math.floor((recState.durationMillis ?? 0) / 1000);

  useEffect(() => {
    if (recState.isRecording && recordingSec >= MAX_AFIRMASI_SEC) {
      (async () => {
        try {
          await recorder.stop();
          const uri = recorder.uri;
          if (uri) setPreviewUri(uri);
        } catch {}
      })();
    }
  }, [recState.isRecording, recordingSec, recorder]);

  const startRecording = useCallback(async () => {
    setPermError(null);
    setBusy(true);
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setPermError("Izin mikrofon ditolak. Aktifkan di pengaturan aplikasi.");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      setPreviewUri(null);
      onClear();
      recorder.record();
    } catch (err: any) {
      setPermError(err?.message ?? "Gagal memulai rekaman");
    } finally {
      setBusy(false);
    }
  }, [onClear, recorder]);

  const stopRecording = useCallback(async () => {
    setBusy(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) setPreviewUri(uri);
    } catch (err: any) {
      setPermError(err?.message ?? "Gagal menghentikan rekaman");
    } finally {
      setBusy(false);
    }
  }, [recorder]);

  const retake = useCallback(() => {
    try { player.pause(); } catch {}
    setPreviewUri(null);
    onClear();
  }, [onClear, player]);

  const confirm = useCallback(() => {
    if (!previewUri) return;
    try { player.pause(); } catch {}
    onConfirm(previewUri);
  }, [onConfirm, player, previewUri]);

  const togglePlay = useCallback(() => {
    if (playerStatus.playing) player.pause();
    else {
      if (playerStatus.currentTime && playerStatus.duration && playerStatus.currentTime >= playerStatus.duration - 0.1) {
        player.seekTo(0).catch(() => {});
      }
      player.play();
    }
  }, [player, playerStatus.currentTime, playerStatus.duration, playerStatus.playing]);

  const isRecording = recState.isRecording;
  const hasPreview = !!previewUri && !confirmedUri;
  const isConfirmed = !!confirmedUri;

  return (
    <View
      style={{
        backgroundColor: "#FEFBF5",
        borderRadius: 14,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: "#F0E8EE",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name="mic" size={18} color="#6BAF8F" />
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D3E", flex: 1 }}>
          Rekam Suara Afirmasi
        </Text>
        <Text style={{ fontSize: 11, color: "#9B9BAE" }}>Maks 2 menit</Text>
      </View>
      <Text style={{ fontSize: 12, color: "#6B6B80", lineHeight: 18 }}>
        Bacakan afirmasi di atas dengan suara yang nyaman. Rekaman akan dikirim ke perawat bersama sesi hari ini.
      </Text>

      {isRecording && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FDECEC", padding: 12, borderRadius: 12 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#C9414A" }} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#C9414A", flex: 1 }}>
            Merekam... {fmtSec(recordingSec)} / {fmtSec(MAX_AFIRMASI_SEC)}
          </Text>
        </View>
      )}

      {(hasPreview || isConfirmed) && (
        <View style={{ backgroundColor: "#EEE9F9", borderRadius: 12, padding: 12, gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              onPress={togglePlay}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#8B7EC4", alignItems: "center", justifyContent: "center" }}
              activeOpacity={0.8}
            >
              <Ionicons name={playerStatus.playing ? "pause" : "play"} size={18} color="white" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#2D2D3E" }}>
                {isConfirmed ? "Rekaman tersimpan" : "Pratinjau rekaman"}
              </Text>
              <Text style={{ fontSize: 11, color: "#6B6B80" }}>
                {fmtSec(playerStatus.currentTime ?? 0)} / {fmtSec(playerStatus.duration ?? 0)}
              </Text>
            </View>
            {isConfirmed && <Ionicons name="checkmark-circle" size={22} color="#6BAF8F" />}
          </View>
        </View>
      )}

      {permError && (
        <View style={{ backgroundColor: "#FDECEC", borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 12, color: "#8B2E37" }}>{permError}</Text>
        </View>
      )}

      {/* Controls */}
      {!isRecording && !hasPreview && !isConfirmed && (
        <TouchableOpacity
          onPress={startRecording}
          disabled={busy}
          style={{ backgroundColor: busy ? "#A7C9B7" : "#6BAF8F", borderRadius: 12, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
          activeOpacity={0.8}
        >
          {busy ? <ActivityIndicator color="white" /> : <Ionicons name="mic" size={18} color="white" />}
          <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>Mulai Rekam</Text>
        </TouchableOpacity>
      )}

      {isRecording && (
        <TouchableOpacity
          onPress={stopRecording}
          disabled={busy}
          style={{ backgroundColor: "#C9414A", borderRadius: 12, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
          activeOpacity={0.8}
        >
          <Ionicons name="stop" size={18} color="white" />
          <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>Hentikan</Text>
        </TouchableOpacity>
      )}

      {hasPreview && (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={retake}
            style={{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", borderWidth: 2, borderColor: "#E8789A", flexDirection: "row", justifyContent: "center", gap: 6 }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color="#C96B8A" />
            <Text style={{ color: "#C96B8A", fontWeight: "700", fontSize: 13 }}>Rekam Ulang</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={confirm}
            style={{ flex: 1, backgroundColor: "#6BAF8F", borderRadius: 12, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>Gunakan</Text>
          </TouchableOpacity>
        </View>
      )}

      {isConfirmed && (
        <TouchableOpacity
          onPress={retake}
          style={{ borderRadius: 12, paddingVertical: 12, alignItems: "center", borderWidth: 2, borderColor: "#E8789A", flexDirection: "row", justifyContent: "center", gap: 6 }}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={16} color="#C96B8A" />
          <Text style={{ color: "#C96B8A", fontWeight: "700", fontSize: 13 }}>Ganti Rekaman</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function PatientSession() {
  const { hari } = useLocalSearchParams<{ hari: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentUser,
    getPatientSessions,
    completeSession,
    getEffectiveCurrentDay,
    getProgramSessions,
    getRelaxationTracks,
    uploadAfirmasiRecording,
  } = useApp();
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
  const [afirmasiUri, setAfirmasiUri] = useState<string | null>(null);

  const modules = day === 1 ? MODULES_ALL : MODULES_ALL.slice(1);

  if (!sessionDef) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Sesi tidak ditemukan</Text>
      </View>
    );
  }

  const handleCompleteModule = () => {
    const mod = modules[activeModule];
    if (mod?.id === "afirmasi" && !afirmasiUri) {
      Alert.alert("Rekaman Belum Ada", "Mohon rekam suara afirmasimu terlebih dahulu sebelum melanjutkan.");
      return;
    }
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

    let audioPath: string | undefined;
    if (afirmasiUri) {
      const uploadRes = await uploadAfirmasiRecording(patient.id, day, afirmasiUri);
      if (!uploadRes.success) {
        setSubmitting(false);
        Alert.alert(
          "Gagal Mengunggah Rekaman",
          `Rekaman afirmasi gagal terunggah. Coba lagi.\n\nDetail: ${uploadRes.error ?? "tidak diketahui"}`,
        );
        return;
      }
      audioPath = uploadRes.path;
    }

    const durationMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    const result = await completeSession(patient.id, {
      day,
      status: "selesai",
      completedAt: new Date().toISOString(),
      durationMinutes,
      mood,
      refleksiAnswers: reflection ? { q1: reflection } : undefined,
      affirmationAudioUrl: audioPath,
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
              <AfirmasiRecorder
                confirmedUri={afirmasiUri}
                onConfirm={(uri) => setAfirmasiUri(uri)}
                onClear={() => setAfirmasiUri(null)}
              />
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
