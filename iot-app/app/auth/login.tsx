import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true); 
  const [loading, setLoading] = useState(false); 

  const router = useRouter();

  const BASE_URL = "http://localhost:9999/api/v1"; 
  //https://run.mocky.io/v3/a2e8842c-bba2-4c97-ac64-065c0e90930a

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Vui lòng nhập email và mật khẩu!");
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/users/login`, {
    //   const response = await fetch(`https://run.mocky.io/v3/816b541d-4f59-4588-addd-9b268105ce2f`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại!");
      }
  
     
      await AsyncStorage.setItem("token", data.data);
  
      alert("Đăng nhập thành công!");
      router.push("/(tabs)");
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error);
      alert(`Lỗi: ${error.message}`);
    }
    setLoading(false);
  };
  
  return (
    <View style={styles.container}>
      <Image source={require("./image/logo.png")} style={styles.logo} />
      <Text style={styles.title}>Đăng nhập vào trang trại</Text>

      {/* Ô Email */}
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

      {/* Ô Mật khẩu */}
      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Mật khẩu</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="lock" size={16} color="gray" style={styles.icon} />
          <TextInput
            placeholder="Nhập mật khẩu..."
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureText}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setSecureText(!secureText)}>
            <FontAwesome
              name={secureText ? "eye-slash" : "eye"}
              size={16}
              color="gray"
              style={styles.rightIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Nút Đăng nhập */}
      <TouchableOpacity
        style={[styles.loginButton, loading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.loginButtonText}>Đăng nhập</Text>}
      </TouchableOpacity>

      {/* Nút Đăng ký */}
      <TouchableOpacity style={styles.registerButton} onPress={() => router.push("/auth/signup")}>
        <Text style={styles.registerButtonText}>Đăng ký</Text>
      </TouchableOpacity>

      {/* Quên mật khẩu */}
      <TouchableOpacity onPress={() => router.push("/auth/reset-password")}>
        <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    padding: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6a9e3a",
    marginBottom: 20,
  },
  inputWrapper: {
    width: "100%",
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "gray",
    marginBottom: 5,
  },
 
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, width: "100%" },
  icon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: "auto",
  },
  // input: {
  //   flex: 1,
  //   fontSize: 16,
  //   borderWidth: 0,
  //   backgroundColor: "transparent",
  //   color: "#000",
  //   paddingVertical: 8,
  // },
  input: { flex: 1, fontSize: 16 },
  loginButton: {
    backgroundColor: "#6a9e3a",
    paddingVertical: 12,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#a5d6a7",
  },
  registerButton: {
    borderWidth: 1,
    borderColor: "#6a9e3a",
    paddingVertical: 12,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  registerButtonText: {
    color: "#6a9e3a",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotPasswordText: {
    marginTop: 10,
    color: "#6a9e3a",
    textDecorationLine: "underline",
  },
});
