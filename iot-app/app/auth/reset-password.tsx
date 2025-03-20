import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSendOTP = () => {
    if (!email) {
      Alert.alert("Lỗi", "Vui lòng nhập địa chỉ email!");
      return;
    }
  
    // Mã OTP cứng để test
    const fixedOTP = "123456";
    console.log("Mã OTP:", fixedOTP);
  
    Alert.alert("Thông báo", `Mã OTP của bạn là: ${fixedOTP}`);
  
  
    router.push(`/auth/VerifyOTPScreen?email=${encodeURIComponent(email)}&otp=${fixedOTP}`);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/auth/login")} style={styles.backButton}>
        <FontAwesome name="arrow-left" size={18} color="black" />
      </TouchableOpacity>

      <Image source={require("./image/forgot.png")} style={styles.logo} />

      <Text style={styles.title}>Quên mật khẩu</Text>
      <Text style={styles.subtitle}>Nhập email để nhận mã xác nhận</Text>

      <View style={styles.inputContainer}>
        <FontAwesome name="envelope" size={16} color="gray" style={styles.icon} />
        <TextInput
          placeholder="Nhập địa chỉ email..."
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSendOTP}>
        <Text style={styles.submitButtonText}>Gửi mã xác nhận</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f7f7", padding: 20 },
  backButton: { position: "absolute", top: 40, left: 20 },
  logo: { width: 80, height: 80, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "bold", color: "#6a9e3a", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "gray", marginBottom: 20 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, width: "100%" },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  submitButton: { backgroundColor: "#6a9e3a", paddingVertical: 12, borderRadius: 20, width: "100%", alignItems: "center", marginTop: 10 },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
