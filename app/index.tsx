import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../src/context/AppContext";

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<"pasien" | "perawat" | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useApp();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Mohon isi username dan kata sandi.");
      return;
    }
    setIsLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 800));
    const result = await login(username, password);
    if (result.success) {
      if (result.role === "pasien") router.replace("/pasien");
      else router.replace("/perawat");
    } else {
      setError("Username atau kata sandi tidak sesuai. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FDE8F0" />
      <ScrollView
        style={{ flex: 1, backgroundColor: "#FDE8F0" }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ alignItems: "center", paddingTop: 20, marginBottom: 32 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              shadowColor: "#C96B8A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              backgroundColor: "#E8789A",
            }}
          >
            <Ionicons name="heart" size={40} color="white" />
          </View>
          <Text style={{ fontSize: 30, color: "#C96B8A", fontWeight: "800" }}>SNEfi Care</Text>
          <Text style={{ fontSize: 13, color: "#8B6B8A", marginTop: 4 }}>
            Pendamping Digital Pejuang Kanker
          </Text>
        </View>

        {/* Role Selection */}
        {!selectedRole ? (
          <View style={{ gap: 16 }}>
            <Text style={{ textAlign: "center", fontSize: 14, color: "#6B6B80", marginBottom: 4 }}>
              Masuk sebagai:
            </Text>

            {/* Pasien Button */}
            <TouchableOpacity
              onPress={() => setSelectedRole("pasien")}
              style={{
                backgroundColor: "white",
                borderRadius: 20,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                borderWidth: 2,
                borderColor: "#F7E8EE",
                shadowColor: "#C96B8A",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 4,
              }}
              activeOpacity={0.8}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "#F7E8EE",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="person" size={28} color="#C96B8A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E" }}>Saya Pasien</Text>
                <Text style={{ fontSize: 13, color: "#9B9BAE", marginTop: 2 }}>
                  Akses program terapi harian
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C96B8A" />
            </TouchableOpacity>

            {/* Perawat Button */}
            <TouchableOpacity
              onPress={() => setSelectedRole("perawat")}
              style={{
                backgroundColor: "white",
                borderRadius: 20,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                borderWidth: 2,
                borderColor: "#EEE9F9",
                shadowColor: "#8B7EC4",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 4,
              }}
              activeOpacity={0.8}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "#EEE9F9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="medkit" size={28} color="#8B7EC4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E" }}>
                  Perawat / Nakes
                </Text>
                <Text style={{ fontSize: 13, color: "#9B9BAE", marginTop: 2 }}>
                  Dashboard pemantauan pasien
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B7EC4" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* Back + Title */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <TouchableOpacity
                onPress={() => { setSelectedRole(null); setError(""); setUsername(""); setPassword(""); }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "white",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Ionicons name="chevron-back" size={20} color="#6B6B80" />
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D2D3E" }}>
                {selectedRole === "pasien" ? "Masuk sebagai Pasien" : "Masuk sebagai Perawat"}
              </Text>
            </View>

            {/* Form */}
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 20,
                padding: 20,
                gap: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              {/* Username */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B6B80" }}>Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Masukkan username"
                  placeholderTextColor="#C0B8CC"
                  autoCapitalize="none"
                  style={{
                    backgroundColor: "#FEF9F7",
                    borderWidth: 2,
                    borderColor: "#F0E8EE",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 15,
                    color: "#2D2D3E",
                  }}
                  onSubmitEditing={handleLogin}
                />
              </View>

              {/* Password */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B6B80" }}>Kata Sandi</Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Masukkan kata sandi"
                    placeholderTextColor="#C0B8CC"
                    secureTextEntry={!showPass}
                    style={{
                      backgroundColor: "#FEF9F7",
                      borderWidth: 2,
                      borderColor: "#F0E8EE",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      paddingRight: 48,
                      fontSize: 15,
                      color: "#2D2D3E",
                    }}
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: 12, top: 12 }}
                  >
                    <Ionicons
                      name={showPass ? "eye-off" : "eye"}
                      size={20}
                      color="#9B9BAE"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error */}
              {error ? (
                <View style={{ backgroundColor: "#FEF0F0", borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 13, color: "#C0404A" }}>{error}</Text>
                </View>
              ) : null}

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                style={{
                  backgroundColor: selectedRole === "pasien" ? "#E8789A" : "#A08EC8",
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: isLoading ? 0.7 : 1,
                }}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Masuk</Text>
                )}
              </TouchableOpacity>
            </View>

            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.6)",
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: "#D0C8E0",
                borderStyle: "dashed",
              }}
            >
              <Text style={{ fontSize: 12, color: "#6B6B80", lineHeight: 18 }}>
                Gunakan akun yang sudah terdaftar di database Supabase oleh perawat/admin.
              </Text>
            </View>
          </View>
        )}

        <Text style={{ textAlign: "center", fontSize: 11, color: "#B0A8C0", marginTop: 32, paddingBottom: 16 }}>
          © 2026 SNEfi Care · Platform Terapi Digital
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
