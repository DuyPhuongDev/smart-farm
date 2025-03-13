import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="pump-settings" />
      <Stack.Screen name="user-setting" />
    </Stack>
  );
}
