import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Card from "../../components/Card";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import Chart from "@/components/Chart";
export default function TemperatureDashboard() {
  const datas = [
    { value: 20.7, time: "13:50" },
    { value: 30.5, time: "13:50" },
    { value: 32.6, time: "13:50" },
    { value: 45.6, time: "13:50" },
    { value: 32.7, time: "13:50" },
    { value: 26.5, time: "13:50" },
    { value: 29.4, time: "13:50" },
    { value: 25.1, time: "13:50" },
    { value: 30.2, time: "13:50" },
    { value: 28.2, time: "13:50" },
  ];
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Header />
        <Card data={26} title="Nhiệt độ" color="#61D215" unit="°C" />
        <Chart data={datas}/>
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
