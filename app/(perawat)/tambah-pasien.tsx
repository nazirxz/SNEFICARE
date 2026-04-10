import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../src/context/AppContext";

interface FormField {
  label: string;
  key: keyof FormState;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "phone-pad";
  secureTextEntry?: boolean;
}

interface FormState {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
  age: string;
  diagnosis: string;
  chemoCycle: string;
  phone: string;
  startDate: string;
}

const FIELDS: FormField[] = [
  { label: "Nama Lengkap", key: "name", placeholder: "cth: Siti Rahayu" },
  { label: "Username", key: "username", placeholder: "cth: siti.rahayu (tanpa spasi)" },
  { label: "Password", key: "password", placeholder: "Minimal 6 karakter", secureTextEntry: true },
  { label: "Konfirmasi Password", key: "confirmPassword", placeholder: "Ulangi password", secureTextEntry: true },
  { label: "Usia", key: "age", placeholder: "cth: 45", keyboardType: "numeric" },
  { label: "Diagnosis", key: "diagnosis", placeholder: "cth: Ca Mammae Sinistra Stadium II" },
  { label: "Siklus Kemoterapi", key: "chemoCycle", placeholder: "cth: Siklus 3 dari 6" },
  { label: "Nomor HP", key: "phone", placeholder: "cth: 081234567890", keyboardType: "phone-pad" },
  { label: "Tanggal Mulai Program", key: "startDate", placeholder: "YYYY-MM-DD  cth: 2026-04-10" },
];

export default function TambahPasien() {
  const router = useRouter();
  const { createPatient } = useApp();

  const [form, setForm] = useState<FormState>({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    age: "",
    diagnosis: "",
    chemoCycle: "",
    phone: "",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Nama lengkap wajib diisi";
    if (!form.username.trim()) return "Username wajib diisi";
    if (/\s/.test(form.username)) return "Username tidak boleh mengandung spasi";
    if (form.password.length < 6) return "Password minimal 6 karakter";
    if (form.password !== form.confirmPassword) return "Konfirmasi password tidak cocok";
    if (!form.age || isNaN(Number(form.age))) return "Usia harus berupa angka";
    if (!form.diagnosis.trim()) return "Diagnosis wajib diisi";
    if (!form.chemoCycle.trim()) return "Siklus kemoterapi wajib diisi";
    if (!form.phone.trim()) return "Nomor HP wajib diisi";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) return "Format tanggal: YYYY-MM-DD";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsLoading(true);
    const result = await createPatient({
      name: form.name,
      username: form.username,
      password: form.password,
      age: parseInt(form.age),
      diagnosis: form.diagnosis,
      chemoCycle: form.chemoCycle,
      phone: form.phone,
      startDate: form.startDate,
    });
    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? "Terjadi kesalahan, coba lagi");
      return;
    }

    Alert.alert(
      "Pasien Berhasil Didaftarkan",
      `Akun untuk ${form.name} telah dibuat.\n\nUsername: ${form.username}\nPassword: ${form.password}`,
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F8F4FF" }}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{
          backgroundColor: "#8B7EC4",
          paddingTop: 56,
          paddingBottom: 24,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "white" }}>
              Daftarkan Pasien
            </Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
              Isi data pasien untuk membuat akun
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 16 }}>
          {/* Form Card */}
          <View style={{
            backgroundColor: "white",
            borderRadius: 20,
            padding: 20,
            gap: 16,
            shadowColor: "#8B7EC4",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
          }}>
            {FIELDS.map((field) => {
              const isPassword = field.key === "password";
              const isConfirm = field.key === "confirmPassword";
              const isSecure = field.secureTextEntry &&
                (isPassword ? !showPassword : isConfirm ? !showConfirm : true);

              return (
                <View key={field.key} style={{ gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B6B80" }}>
                    {field.label}
                  </Text>
                  <View style={{ position: "relative" }}>
                    <TextInput
                      value={form[field.key]}
                      onChangeText={(v) => updateField(field.key, v)}
                      placeholder={field.placeholder}
                      placeholderTextColor="#C0B8CC"
                      keyboardType={field.keyboardType ?? "default"}
                      secureTextEntry={isSecure}
                      autoCapitalize="none"
                      style={{
                        backgroundColor: "#FAF8FF",
                        borderWidth: 2,
                        borderColor: "#EEE8F8",
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        paddingRight: field.secureTextEntry ? 48 : 16,
                        fontSize: 15,
                        color: "#2D2D3E",
                      }}
                    />
                    {field.secureTextEntry && (
                      <TouchableOpacity
                        onPress={() =>
                          isPassword
                            ? setShowPassword((v) => !v)
                            : setShowConfirm((v) => !v)
                        }
                        style={{ position: "absolute", right: 12, top: 13 }}
                      >
                        <Ionicons
                          name={
                            (isPassword ? showPassword : showConfirm) ? "eye-off" : "eye"
                          }
                          size={20}
                          color="#9B9BAE"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Error */}
          {error ? (
            <View style={{
              backgroundColor: "#FEF0F0", borderRadius: 12, padding: 14,
              flexDirection: "row", alignItems: "center", gap: 8,
            }}>
              <Ionicons name="alert-circle" size={18} color="#C0404A" />
              <Text style={{ fontSize: 13, color: "#C0404A", flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          {/* Info Box */}
          <View style={{
            backgroundColor: "#EEF4FF", borderRadius: 12, padding: 14,
            flexDirection: "row", gap: 10,
          }}>
            <Ionicons name="information-circle" size={18} color="#4A7EC4" style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 12, color: "#4A7EC4", flex: 1, lineHeight: 18 }}>
              Username dan password ini akan digunakan pasien untuk login. Catat dan sampaikan langsung kepada pasien.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? "#BFB2E0" : "#8B7EC4",
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: "center",
              shadowColor: "#8B7EC4",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="person-add" size={20} color="white" />
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                  Daftarkan Pasien
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
