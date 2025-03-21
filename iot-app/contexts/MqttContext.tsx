import { createContext, useContext, useEffect, useRef } from "react";
import { connect, MqttClient } from "@taoqf/react-native-mqtt";

const MQTT_BROKER = "wss://io.adafruit.com";
const ADAFRUIT_USERNAME = "dphuongdev";
const ADAFRUIT_KEY = "aio_vWpj24h5lR0GXgS89014cgLEOnll";
const FEEDS = [
  "feeds/temperature",
  "feeds/humidity",
  "feeds/lux",
  "feeds/moisture",
  "feeds/pump",
]; // ✅ Các topic cần subscribe

// ✅ Tạo Context cho MQTT
const MqttContext = createContext<MqttClient | null>(null);

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const mqttClientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    if (!mqttClientRef.current) {
      // ✅ Tạo kết nối MQTT dùng chung
      mqttClientRef.current = connect(`${MQTT_BROKER}`, {
        username: ADAFRUIT_USERNAME,
        password: ADAFRUIT_KEY,
        port: 443,
        protocol: "wss",
      });

      mqttClientRef.current.on("connect", () => {
        console.log("✅ Kết nối MQTT thành công!");
        FEEDS.forEach((feed) =>
          mqttClientRef.current?.subscribe(`${ADAFRUIT_USERNAME}/${feed}`)
        );
      });

      mqttClientRef.current.on("error", (err) =>
        console.error("❌ Lỗi MQTT:", err)
      );
    }

    // ✅ Cleanup khi app đóng
    return () => {
      if (mqttClientRef.current) {
        console.log("🔌 Ngắt kết nối MQTT...");
        mqttClientRef.current.end();
        mqttClientRef.current = null;
      }
    };
  }, []);

  return (
    <MqttContext.Provider value={mqttClientRef.current}>
      {children}
    </MqttContext.Provider>
  );
}

// ✅ Hook để dùng MQTT client trong toàn bộ app
export function useMqtt() {
  return useContext(MqttContext);
}
