import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      initialRouteName="temperature"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: { position: "absolute" }, // Hiệu ứng blur trên iOS
          default: {},
        }),
      }}
    >
      {/* Nhiệt độ */}
      <Tabs.Screen
        name="temperature"
        options={{
          title: "Temperature",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="thermometer" color={color} />
          ),
        }}
      />

      {/* Độ ẩm */}
      <Tabs.Screen
        name="humidity"
        options={{
          title: "Humidity",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="drop.fill" color={color} />
          ),
        }}
      />

      {/* Độ ẩm đất */}
      <Tabs.Screen
        name="soil-moisture"
        options={{
          title: "Soil Moisture",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="leaf.fill" color={color} />
          ),
        }}
      />

      {/* Ánh sánh\g */}
      <Tabs.Screen
        name="light"
        options={{
          title: "Light",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="sun.max.fill" color={color} />
          ),
        }}
      />

      {/* Máy bơm */}
      <Tabs.Screen
        name="pump-history"
        options={{
          title: "Pump",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gauge.high" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
