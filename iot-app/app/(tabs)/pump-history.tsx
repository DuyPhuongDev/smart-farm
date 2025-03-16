import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { Switch } from "react-native-gesture-handler";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Header from "@/components/Header";
import { SafeAreaProvider } from "react-native-safe-area-context";
export default function PumpDashboard() {
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.title_wrapper}>
          <Text style={styles.title}>Trạng thái : </Text>
          <Text style={styles.title}>{isEnabled ? "Bật" : "Tắt"}</Text>
        </View>
        <View style={styles.wrapper}>
          <View style={styles.content}>
            <MaterialCommunityIcons name="water-pump" size={25} color="black" />
            <Text style={{ fontSize: 25 }}>Máy bơm</Text>
          </View>
          <Switch
            trackColor={{ false: "#D3D7D1", true: "#B9F494" }}
            thumbColor={"white"}
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>
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
    gap: 20,
  },
  title_wrapper: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "semibold",
  },
  wrapper: {
    backgroundColor: "#E7FFEA",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 30,
    gap: 50,
    borderRadius: 15,
  },
  content: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});
