import React from "react";
import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import Card from "@/components/Card";
import Header from "@/components/Header";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Chart from "@/components/Chart";
import ColChart from "@/components/ColChart";
import { fetchHumidity } from "@/utils/api";
import { connect, MqttClient } from "@taoqf/react-native-mqtt";
import { useMqtt } from "@/contexts/MqttContext";
// import {
//   MQTT_BROKER,
//   ADAFRUIT_USERNAME,
//   ADAFRUIT_KEY,
//   FEED_HUMIDITY,
// } from "@env";

const ADAFRUIT_USERNAME = "dphuongdev";
const ADAFRUIT_KEY = "aio_vWpj24h5lR0GXgS89014cgLEOnll";
const MQTT_BROKER = "wss://io.adafruit.com:443/mqtt";
const FEED_HUMIDITY = "dphuongdev/feeds/humidity";

//-------test hardcode data-------//
interface DataItem {
  dataId: number;
  soilMoisture: number;
  recordedAt: string;
}
interface TransformedData {
  value: number;
  time: string;
}
let testData = [
  { dataId: 145, soilMoisture: 18.12, recordedAt: "22" },
  { dataId: 139, soilMoisture: 22.2, recordedAt: "20" },
  { dataId: 133, soilMoisture: 18.06, recordedAt: "18" },
  { dataId: 127, soilMoisture: 22.2, recordedAt: "16" },
  { dataId: 121, soilMoisture: 26.9, recordedAt: "14" },
  { dataId: 145, soilMoisture: 30.12, recordedAt: "12" },
  { dataId: 139, soilMoisture: 28.2, recordedAt: "10" },
  { dataId: 133, soilMoisture: 26.06, recordedAt: "8" },
  { dataId: 127, soilMoisture: 18.2, recordedAt: "6" },
  { dataId: 121, soilMoisture: 18.9, recordedAt: "4" },
  { dataId: 145, soilMoisture: 13.12, recordedAt: "2" },
  { dataId: 139, soilMoisture: 11.2, recordedAt: "0" },
];

export default function HumidityDashboard() {
  const [sensorValue, setSensorValue] = useState<number>(99);
  const [data, setData] = useState<
    { dataId: number; soilMoisture: number; recordedAt: string }[]
  >([]);

  // ✅ Dùng useRef để giữ kết nối MQTT (tránh bị tạo lại khi re-render)
  const mqttClientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    if (!mqttClientRef.current) {
      // ✅ Tạo kết nối MQTT một lần duy nhất
      mqttClientRef.current = connect(MQTT_BROKER, {
        username: ADAFRUIT_USERNAME,
        password: ADAFRUIT_KEY,
      });

      mqttClientRef.current.on("connect", () => {
        console.log("✅ Kết nối MQTT thành công!");
        mqttClientRef.current?.subscribe(FEED_HUMIDITY);
      });

      mqttClientRef.current.on("message", (topic, message) => {
        if (topic === FEED_HUMIDITY) {
          const moisture = parseFloat(message.toString());
          console.log(`📡 Nhận MQTT: ${topic} -> ${moisture}`);
          setSensorValue(moisture);
        }
      });
    }

    // ✅ Cleanup khi component unmount
    return () => {
      if (mqttClientRef.current) {
        console.log("🔌 Ngắt kết nối MQTT...");
        mqttClientRef.current.end();
        mqttClientRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    async function getData() {
      const dat = await fetchHumidity();
      if (dat && dat.length > 0) {
        setSensorValue(dat[0].soilMoisture);
        setData(dat);
        testData = dat;
      }
    }
    getData();
  }, []);

  //-------extraxt data------//
  const transformData = (testData: DataItem[]): TransformedData[] => {
    return testData.map((item) => ({
      value: item.soilMoisture,
      time: item.recordedAt,
    }));
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Header />
        <Card data={sensorValue} title="Độ ẩm" color="#23EBE0" unit="%" />
        <Chart data={transformData(testData)} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  data: { fontSize: 40, color: "blue" },
});
