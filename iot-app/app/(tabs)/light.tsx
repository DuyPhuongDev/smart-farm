import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import Card from "@/components/Card";
import Header from "@/components/Header";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Chart from "@/components/Chart";
export default function LightDashboard() {
  const datas = [
    { value: 50, time: "13:50" },
    { value: 80, time: "13:50" },
    { value: 90, time: "13:50" },
    { value: 70, time: "13:50" },
    { value: 50, time: "13:50" },
    { value: 80, time: "13:50" },
    { value: 90, time: "13:50" },
    { value: 70, time: "13:50" },
    { value: 90, time: "13:50" },
    { value: 70, time: "13:50" },
  ];
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Header />
        <Card data={26} title="Ánh sáng" color="#F1DC00" unit="lux" />
        <Chart data={datas} />
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
  data: { fontSize: 40, color: "yellow" },
});
