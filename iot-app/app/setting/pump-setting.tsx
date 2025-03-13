import React, { useState } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";

export default function PumpSettings() {
  const [autoPump, setAutoPump] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pump Settings</Text>
      <View style={styles.row}>
        <Text>Auto Pump</Text>
        <Switch value={autoPump} onValueChange={setAutoPump} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
});
