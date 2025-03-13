import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function LightDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Light</Text>
      <Text style={styles.data}>-- lux</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
  data: { fontSize: 40, color: "yellow" },
});
