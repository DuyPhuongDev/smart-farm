import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HumidityDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Humidity</Text>
      <Text style={styles.data}>-- %</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
  data: { fontSize: 40, color: "blue" },
});
