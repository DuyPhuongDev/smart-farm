import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* <Stack.Screen name="auth" options={{ headerShown: false }} /> */}
      {/* <Stack.Screen name="index" options={{ title: "Đăng nhập" }} /> */}
      <Stack.Screen name="login" /> 
      <Stack.Screen name="signup" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="ResetPasswordForm" />
      <Stack.Screen name="VerifyOTPScreen" />
    </Stack>
  );
}
