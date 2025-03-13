import React, { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";

export default function PumpDashboard() {
  const [pumpStatus, setPumpStatus] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pump Dashboard</Text>
      <Text style={styles.status}>Status: {pumpStatus ? "ON" : "OFF"}</Text>
      <Button title="Toggle Pump" onPress={() => setPumpStatus(!pumpStatus)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
  status: { fontSize: 20, marginBottom: 10 },
});
