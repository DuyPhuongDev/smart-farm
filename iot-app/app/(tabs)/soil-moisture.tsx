import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SoilMoistureDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Soil Moisture</Text>
      <Text style={styles.data}>-- %</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
  data: { fontSize: 40, color: "green" },
});
