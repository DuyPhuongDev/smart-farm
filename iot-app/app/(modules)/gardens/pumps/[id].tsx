import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useGlobal } from "@/contexts/GlobalContext";
import { PumpStatus } from "@/constants/database";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { SensorData, SensorInfo } from "@/types";

// Define types for pump data
interface PumpInfo extends SensorInfo {
  status: PumpStatus;
  name: string;
  lastActivated?: string;
  isAutomatic: boolean;
}

const PUMP_DATA = [
  {
    id: 1,
    name: "Máy bơm 1",
    gardenId: 1,
    gardenName: "Vườn cà chua",
    type: "pump",
    icon: "water-pump",
    status: PumpStatus.ON,
    lastActivated: "2025-04-29T12:00:00Z",
    isAutomatic: true,
    groupName: "garden1",
    feedName: "pump1",
  },
  {
    id: 2,
    name: "Máy bơm 2",
    status: PumpStatus.OFF,
    gardenId: 1,
    gardenName: "Vườn cà chua",
    type: "pump",
    icon: "water-pump",
    lastActivated: "2023-10-02T14:00:00Z",
    isAutomatic: false,
    groupName: "garden1",
    feedName: "pump2",
  },
  {
    id: 3,
    name: "Máy bơm 3",
    status: PumpStatus.MAINTENANCE,
    gardenId: 1,
    gardenName: "Vườn cà chua",
    type: "pump",
    icon: "water-pump",
    lastActivated: "2023-10-02T14:00:00Z",
    isAutomatic: false,
    groupName: "garden1",
    feedName: "pump2",
  },
  {
    id: 4,
    name: "Máy bơm 4",
    status: PumpStatus.ERROR,
    gardenId: 1,
    gardenName: "Vườn cà chua",
    type: "pump",
    icon: "water-pump",
    lastActivated: "2023-10-02T14:00:00Z",
    isAutomatic: false,
    groupName: "garden1",
    feedName: "pump2",
  },
];
const generateMockPumps = (gardenId: number): PumpInfo[] => {
  return PUMP_DATA.filter((pump) => pump.gardenId === gardenId);
};

export default function PumpActionScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { mqttMessages, publish } = useGlobal();
  const { id: gardenId } = useLocalSearchParams<{ id: string }>(); // Get gardenId from route '[id]'
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [pumps, setPumps] = useState<PumpInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load pump data
  const loadPumps = useCallback(async () => {
    if (!gardenId) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 700));
    try {
      const mockPumps = generateMockPumps(parseInt(gardenId));
      setPumps(mockPumps);
    } catch (error) {
      console.error("Failed to load pumps:", error);
    } finally {
      setIsLoading(false);
    }
  }, [gardenId]);

  useEffect(() => {
    loadPumps();
  }, [loadPumps]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPumps();
    setRefreshing(false);
  }, [loadPumps]);

  // Handle pump status toggle
  const handleTogglePump = useCallback(
    (pump: PumpInfo, newStatus: boolean) => {
      // Update pump status through MQTT
      const status = newStatus ? PumpStatus.ON : PumpStatus.OFF;
      publish(pump.groupName, pump.feedName, status);
      console.log(`Toggled pump ${pump.id} to ${status}`);

      // Update local state for immediate UI feedback
      setPumps((currentPumps) =>
        currentPumps.map((p) =>
          p.id === pump.id ? { ...p, status: status } : p
        )
      );
    },
    [publish]
  );

  // Render a single pump card
  const renderPumpCard = ({ item }: { item: PumpInfo }) => {
    // Get real-time status from MQTT if available
    const feedKey = `${item.groupName}.${item.feedName}`;
    const mqttStatus = mqttMessages[feedKey];

    // If we have MQTT status, use it, otherwise use the local state
    const currentStatus = mqttStatus || item.status;
    const isOn = currentStatus === PumpStatus.ON;

    return (
      <View style={[styles.pumpCard, { backgroundColor: theme.card }]}>
        <View style={styles.pumpHeader}>
          <MaterialCommunityIcons
            name="water-pump"
            size={24}
            color={isOn ? theme.success : theme.textSecondary}
          />
          <Text style={[styles.pumpName, { color: theme.text }]}>
            {item.name}
          </Text>
        </View>

        <View style={styles.pumpDetails}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: isOn ? theme.success : theme.error },
              ]}
            />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              {isOn ? "Đang hoạt động" : "Đã tắt"}
            </Text>
          </View>

          {item.lastActivated && (
            <Text
              style={[styles.lastActivatedText, { color: theme.textTertiary }]}
            >
              Kích hoạt lần cuối:{" "}
              {new Date(item.lastActivated).toLocaleString("vi-VN")}
            </Text>
          )}
        </View>

        <View style={styles.controlContainer}>
          <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>
            {isOn ? "Tắt máy bơm" : "Bật máy bơm"}
          </Text>
          <Switch
            value={isOn}
            onValueChange={(value) => handleTogglePump(item, value)}
            trackColor={{
              false: theme.borderLight,
              true: `${theme.success}80`,
            }}
            thumbColor={isOn ? theme.success : theme.border}
          />
        </View>

        <View
          style={[
            styles.automaticContainer,
            { borderTopColor: theme.borderLight },
          ]}
        >
          <View style={styles.automaticTextContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={18}
              color={theme.textSecondary}
            />
            <Text
              style={[styles.automaticText, { color: theme.textSecondary }]}
            >
              Chế độ tự động
            </Text>
          </View>
          <Switch
            value={item.isAutomatic}
            onValueChange={() => {
              // Toggle automatic mode
              setPumps((currentPumps) =>
                currentPumps.map((p) =>
                  p.id === item.id ? { ...p, isAutomatic: !p.isAutomatic } : p
                )
              );
            }}
            trackColor={{
              false: theme.borderLight,
              true: `${theme.primary}80`,
            }}
            thumbColor={item.isAutomatic ? theme.primary : theme.border}
          />
        </View>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="water-pump-off"
        size={60}
        color={theme.textTertiary}
      />
      <Text style={styles.emptyText}>
        Không có máy bơm nào được thiết lập cho vườn này.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: `Máy bơm - Vườn ${gardenId}` }} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách máy bơm...</Text>
        </View>
      ) : (
        <FlatList
          data={pumps}
          renderItem={renderPumpCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.textSecondary,
    },
    listContentContainer: {
      padding: 16,
      paddingBottom: 80, // Add padding for FAB
    },
    pumpCard: {
      marginBottom: 16,
      borderRadius: 8,
      padding: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    pumpHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    pumpName: {
      fontSize: 18,
      fontFamily: "Inter-SemiBold",
      marginLeft: 8,
    },
    pumpDetails: {
      marginBottom: 16,
    },
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    statusIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    statusText: {
      fontSize: 14,
      fontFamily: "Inter-Medium",
    },
    lastActivatedText: {
      fontSize: 12,
      fontFamily: "Inter-Regular",
    },
    controlContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    controlLabel: {
      fontSize: 14,
      fontFamily: "Inter-Medium",
    },
    automaticContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      paddingTop: 8,
    },
    automaticTextContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    automaticText: {
      fontSize: 14,
      fontFamily: "Inter-Medium",
      marginLeft: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 50, // Adjust as needed
      paddingHorizontal: 30,
    },
    emptyText: {
      fontSize: 18,
      fontFamily: "Inter-SemiBold",
      color: theme.textSecondary,
      marginTop: 16,
      textAlign: "center",
    },
  });
