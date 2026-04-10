import { Stack } from "expo-router";
import { AppProvider } from "../src/context/AppContext";
import "../global.css";

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}
