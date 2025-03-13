import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SensorCard({ title, value, unit }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>
        {value} {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderWidth: 1, borderRadius: 10, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "bold" },
  value: { fontSize: 24, color: "blue" },
});
