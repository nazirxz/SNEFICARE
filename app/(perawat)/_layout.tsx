import { Stack } from "expo-router";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../src/context/AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PerawatLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
