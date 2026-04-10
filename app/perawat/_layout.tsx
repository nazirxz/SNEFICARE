import { Stack } from "expo-router";

export default function PerawatLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pasien/[id]" />
      <Stack.Screen name="tambah-pasien" />
    </Stack>
  );
}
