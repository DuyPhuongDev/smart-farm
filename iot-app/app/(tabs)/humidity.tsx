import React from "react";
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import Card from "@/components/Card";
import Header from "@/components/Header";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Chart from "@/components/Chart";
import { fetchHumidityData } from "@/utils/api";


const testData = {
  status_code: 200,
  message: "Lấy dữ liệu độ ẩm thành công",
  data: [
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
  ],
};

export default function HumidityDashboard() {
  //--------------fetch real data, chua co backend nen k test ddc--------------//

  

  // useEffect(() => {
  //   async function getData() {
  //     setLoading(true);
  //     const data = await fetchHumidityData();
  //     if (data) {
  //       setSensorValue(data[0]?.soilMoisture ?? 0);

  //       const formattedData = data.map((item: { soilMoisture: number; recordedAt: string }) => ({
  //         value: item.soilMoisture,
  //         time: item.recordedAt.split(" ")[1], // Extract time
  //       }));

  //       setChartData(formattedData);
  //     }
  //     setLoading(false);
  //   }

  //   getData();
  // }, []);


  const [sensorValue, setSensorValue] = useState<number>(99);
  const [chartData, setChartData] = useState<{ value: number; time: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate data formatting
    if (testData.data) {
      setSensorValue(testData.data[0]?.soilMoisture ?? 0);
      const reversedData = [...testData.data].reverse(); 
      const formattedData = reversedData.map((item) => ({
        value: item.soilMoisture,
        time: item.recordedAt, // Extract only the time
      }));

      setChartData(formattedData);
      setLoading(false);
    }
  }, []);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Header />
        <Card data={sensorValue} title="Độ ẩm" color="#23EBE0" unit="%" />
        <Chart data={chartData} />
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
    gap: 10
  },
  title: { fontSize: 24, fontWeight: "bold" },
  data: { fontSize: 40, color: "blue" },
  
});
