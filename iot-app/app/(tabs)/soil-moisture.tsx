import React from "react";
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import Card from "@/components/Card";
import Header from "@/components/Header";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Chart from "@/components/Chart";
import { fetchsoilMoisture } from "@/utils/api";

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

  useEffect(() => {

    async function getData() {
      const dat = await fetchsoilMoisture();
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
        <Card data={26} title="Độ ẩm đất" color="#8B4513" unit="%" />
        <Chart data={transformData(testData)} />
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
    gap: 10
  },
  title: { fontSize: 24, fontWeight: "bold" },
  data: { fontSize: 40, color: "green" },
});
