import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Card from "../../components/Card";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import Chart from "@/components/Chart";
import { fetchTemperature } from "@/utils/api";
import { useState, useEffect } from "react";
import { connect } from "@taoqf/react-native-mqtt";


const ADAFRUIT_USERNAME = "dphuongdev";
const ADAFRUIT_KEY = "aio_vWpj24h5lR0GXgS89014cgLEOnll";
const MQTT_BROKER = `wss://io.adafruit.com:443/mqtt`;

const FEED_TEMPERATURE = `${ADAFRUIT_USERNAME}/feeds/temp`;



interface DataItem {
  dataId: number;
  soilMoisture: number;
  recordedAt: string;
}
interface TransformedData {
  value: number;
  time: string;
}
let testData =[
    { dataId: 1, soilMoisture: 18.12, recordedAt: "22" },
    { dataId: 2, soilMoisture: 22.2, recordedAt: "20" },
    { dataId: 3, soilMoisture: 18.06, recordedAt: "18" },
    { dataId: 4, soilMoisture: 22.2, recordedAt: "16" },
    { dataId: 5, soilMoisture: 26.9, recordedAt: "14" },
    { dataId: 6, soilMoisture: 30.12, recordedAt: "12" },
    { dataId: 7, soilMoisture: 28.2, recordedAt: "10" },
    { dataId: 8, soilMoisture: 26.06, recordedAt: "8" },
    { dataId: 9, soilMoisture: 18.2, recordedAt: "6" },
    { dataId: 10, soilMoisture: 18.9, recordedAt: "4" },
    { dataId: 11, soilMoisture: 13.12, recordedAt: "2" },
    { dataId: 12, soilMoisture: 11.2, recordedAt: "0" },
  ];
export default function TemperatureDashboard() {

  const [sensorValue, setSensorValue] = useState<number>(99);
  const [data, setData] = useState<{ dataId: number;soilMoisture: number; recordedAt: string }[]>([]);

  const mqttClient = connect(MQTT_BROKER, {
    username: ADAFRUIT_USERNAME,
    password: ADAFRUIT_KEY,
  });

  useEffect(() => {
    const mqttClient = connect(MQTT_BROKER, {
      username: ADAFRUIT_USERNAME,
      password: ADAFRUIT_KEY,
    });

    mqttClient.on("connect", () => {
      console.log("✅ Kết nối MQTT thành công!");
      mqttClient.subscribe(FEED_TEMPERATURE);
    });

    mqttClient.on("message", (topic, message) => {
      const data = message.toString();
      console.log(`📡 Nhận MQTT: ${topic} -> ${data}`);
      if (topic === FEED_TEMPERATURE) {
        setSensorValue(parseFloat(data)); // ✅ Cập nhật độ ẩm
        // Cập nhật dữ liệu biểu đồ
      } 
    });

    // ✅ Trả về một hàm cleanup để ngắt kết nối khi component unmount
    return () => {
      console.log("🔌 Ngắt kết nối MQTT...");
      mqttClient.end();
    };
  }, []);



  useEffect(() => {

    async function getData() {
      const dat = await fetchTemperature();
      if (dat && dat.length > 0) {
        setSensorValue(dat[0].soilMoisture);
        setData(dat);
        testData = dat;
      }
    }

    getData();
  }, []);

  const transformData = (testData: DataItem[]): TransformedData[] => {
    return testData.map(item => ({
      value: item.soilMoisture,
      time: item.recordedAt, 
    }));
  };
  
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Header />
        <Card data={sensorValue} title="Nhiệt độ" color="#61D215" unit="°C" />
        <Chart data={transformData(testData)}/>
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
  data: { fontSize: 40, color: "red" },
});
