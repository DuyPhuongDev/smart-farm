import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function SignUpScreen() {
  const [fullName, setFullName] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [secureConfirmText, setSecureConfirmText] = useState(true);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:9999/api/v1"; 
  //https://run.mocky.io/v3/0f4939a9-c693-4588-b560-02e0cfca682c

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
    const response = await fetch(`${API_URL}/users/register`, {
       //const response = await fetch(`https://run.mocky.io/v3/5c1ba5cd-df08-4af2-b8ba-d250c2787a2d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });

      const data = await response.json();

      if (response.status !== 201) {
        throw new Error(data?.message || "Đăng ký thất bại!");
      }

      alert("Đăng ký thành công! Hãy đăng nhập.");
      router.push("/auth/login");
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Có lỗi xảy ra, vui lòng thử lại sau!";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("./image/logo.png")} style={styles.logo} />
      <Text style={styles.title}>Đăng ký</Text>

      {/* Họ và tên */}
      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Họ và Tên</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="user" size={16} color="gray" style={styles.icon} />
          <TextInput
            placeholder="Nhập họ và tên..."
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />
        </View>
      </View>

      {/* Email */}
      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="envelope" size={16} color="gray" style={styles.icon} />
          <TextInput
            placeholder="Nhập địa chỉ email..."
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
        </View>
      </View>

      {/* Mật khẩu */}
      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Mật khẩu</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="lock" size={16} color="gray" style={styles.icon} />
          <TextInput
            placeholder="************"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureText}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setSecureText(!secureText)}>
            <FontAwesome name={secureText ? "eye-slash" : "eye"} size={16} color="gray" style={styles.rightIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Xác nhận mật khẩu */}
      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Xác nhận mật khẩu</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="lock" size={16} color="gray" style={styles.icon} />
          <TextInput
            placeholder="************"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureConfirmText}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setSecureConfirmText(!secureConfirmText)}>
            <FontAwesome name={secureConfirmText ? "eye-slash" : "eye"} size={16} color="gray" style={styles.rightIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Nút Đăng ký */}
      <TouchableOpacity style={styles.signupButton} onPress={handleSignUp} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.signupButtonText}>Đăng ký</Text>}
      </TouchableOpacity>

      {/* Quay lại đăng nhập */}
      <TouchableOpacity onPress={() => router.push("/auth/login")} style={styles.backToLogin}>
        <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f7f7", padding: 20 },
  logo: { width: 80, height: 80, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "bold", color: "#6a9e3a", marginBottom: 20 },
  inputWrapper: { width: "100%", marginBottom: 10 },
  label: { fontSize: 14, fontWeight: "bold", color: "gray", marginBottom: 5 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, width: "100%" },
  icon: { marginRight: 10 },
  rightIcon: { marginLeft: "auto" },
  input: { flex: 1, fontSize: 16 },
  signupButton: { backgroundColor: "#6a9e3a", paddingVertical: 12, borderRadius: 20, width: "100%", alignItems: "center", marginTop: 10 },
  signupButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  backToLogin: { marginTop: 10 },
  backToLoginText: { color: "#6a9e3a", fontSize: 14, fontWeight: "bold" },
});

