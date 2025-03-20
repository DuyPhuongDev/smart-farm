import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,  
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function VerifyOTPScreen() {
  const router = useRouter();
  const FIXED_OTP = "123456"; // Định nghĩa mã OTP cố định
  const [otp, setOTP] = useState("");

  const handleVerifyOTP = () => {
    if (otp !== FIXED_OTP) {  
      Alert.alert("Lỗi", "Mã OTP không đúng, vui lòng thử lại!");
      return;
    }
  
    Alert.alert("Thành công", "OTP chính xác, hãy đặt lại mật khẩu mới!");
    router.push("/auth/ResetPasswordForm");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/auth/login")} style={styles.backButton}>
        <FontAwesome name="arrow-left" size={18} color="black" />
      </TouchableOpacity>

      <Image source={require("./image/forgot.png")} style={styles.logo} />  
      
      <Text style={styles.title}>Xác thực OTP</Text>
      <Text style={styles.subtitle}>Nhập mã OTP 6 chữ số gửi đến email</Text>

      <TextInput
        placeholder="Nhập mã OTP..."
        value={otp}
        onChangeText={setOTP}
        keyboardType="numeric"
        maxLength={6}
        style={styles.input}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleVerifyOTP}>
        <Text style={styles.submitButtonText}>Xác nhận</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f7f7", padding: 20 },
  backButton: { position: "absolute", top: 40, left: 20 },
  title: { fontSize: 20, fontWeight: "bold", color: "#6a9e3a", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "gray", marginBottom: 20 },
  input: { backgroundColor: "white", padding: 12, borderRadius: 10, fontSize: 16, width: "100%", textAlign: "center" },
  submitButton: { backgroundColor: "#6a9e3a", paddingVertical: 12, borderRadius: 20, width: "100%", alignItems: "center", marginTop: 10 },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  logo: { width: 80, height: 80, marginBottom: 10 },
});
