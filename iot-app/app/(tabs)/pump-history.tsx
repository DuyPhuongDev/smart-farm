import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { Switch } from "react-native-gesture-handler";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Header from "@/components/Header";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { connect } from "@taoqf/react-native-mqtt";
// import { MQTT_BROKER, ADAFRUIT_USERNAME, ADAFRUIT_KEY, FEED_PUMP } from "@env";

const ADAFRUIT_USERNAME = "dphuongdev";
const ADAFRUIT_KEY = "aio_vWpj24h5lR0GXgS89014cgLEOnll";
const MQTT_BROKER = "wss://io.adafruit.com:443/mqtt";
const FEED_PUMP = "dphuongdev/feeds/pump";

export default function PumpDashboard() {
  const [isEnabled, setIsEnabled] = useState(false);
  const mqttClientRef = useRef<any>(null);

  useEffect(() => {
    // ✅ Dùng useRef để lưu client, tránh connect nhiều lần
    mqttClientRef.current = connect(MQTT_BROKER, {
      username: ADAFRUIT_USERNAME,
      password: ADAFRUIT_KEY,
    });

    mqttClientRef.current.on("connect", () => {
      console.log("✅ Kết nối MQTT thành công!");
      mqttClientRef.current.subscribe(FEED_PUMP);
    });

    mqttClientRef.current.on("message", (topic: string, message: Buffer) => {
      if (topic === FEED_PUMP) {
        const data = message.toString();
        console.log(`📡 Nhận MQTT: ${topic} -> ${data}`);
        setIsEnabled(data === "ON");
      }
    });

    return () => {
      console.log("🔌 Ngắt kết nối MQTT...");
      mqttClientRef.current?.end();
    };
  }, []);

  // ✅ Gửi lệnh bật/tắt máy bơm qua MQTT
  const toggleSwitch = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    const message = newState ? "ON" : "OFF";

    console.log(`📤 Gửi MQTT: ${FEED_PUMP} -> ${message}`);
    mqttClientRef.current?.publish(FEED_PUMP, message);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.title_wrapper}>
          <Text style={styles.title}>Trạng thái : </Text>
          <Text style={styles.title}>{isEnabled ? "Bật" : "Tắt"}</Text>
        </View>
        <View style={styles.wrapper}>
          <View style={styles.content}>
            <MaterialCommunityIcons name="water-pump" size={25} color="black" />
            <Text style={{ fontSize: 25 }}>Máy bơm</Text>
          </View>
          <Switch
            trackColor={{ false: "#D3D7D1", true: "#B9F494" }}
            thumbColor={"white"}
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "white",
    gap: 20,
  },
  title_wrapper: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "semibold",
  },
  wrapper: {
    backgroundColor: "#E7FFEA",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 30,
    gap: 50,
    borderRadius: 15,
  },
  content: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});
