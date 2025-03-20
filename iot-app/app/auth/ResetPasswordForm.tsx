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
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ResetPasswordForm() {
  const { email } = useLocalSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");

  const handleResetPassword = () => {
    if (!password) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu mới!");
      return;
    }

    Alert.alert("Thành công", "Mật khẩu đã được đặt lại!");
    router.push("/auth/login");
  };

  return (
    <View style={styles.container}>
          <Image source={require("./image/forgot.png")} style={styles.logo} />  
              
      <Text style={styles.title}>Đặt lại mật khẩu</Text>
      <Text style={styles.subtitle}>Nhập mật khẩu mới</Text>

      <TextInput
        placeholder="Mật khẩu mới..."
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleResetPassword}>
        <Text style={styles.submitButtonText}>Đặt lại mật khẩu</Text>
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6a9e3a",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 20,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  submitButton: {
    backgroundColor: "#6a9e3a",
    paddingVertical: 12,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  logo: { width: 80, height: 80, marginBottom: 10 },
});
