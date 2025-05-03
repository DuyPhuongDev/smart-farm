import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useGlobal } from "@/contexts/GlobalContext";
import { router } from "expo-router";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import type { SensorData, Garden, SensorInfo, SensorStatus } from "@/types";
import gardenService from "@/service/garden.service";
import { getStageLabel } from "@/utils/helper";
import { CropStage } from "@/constants/database";

// Mocked data for development
const GARDENS_DATA = [
  {
    id: 1,
    name: "Vườn cà chua",
    cropName: "Cà chua",
    cropStage: "Đang ra hoa",
    thumbnail: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e",
    location: "Nhà",
    groupName: "garden1",
    sensors: [
      {
        id: 1,
        type: "temperature",
        feedName: "temperature",
      },
      {
        id: 2,
        type: "humidity",
        feedName: "humidity",
      },
      {
        id: 3,
        type: "soilMoisture",
        feedName: "moisture",
      },
      {
        id: 4,
        type: "light",
        feedName: "light",
      },
      {
        id: 5,
        type: "pump",
        feedName: "pump1",
      },
      {
        id: 5,
        type: "pump",
        feedName: "pump2",
      },
    ],
    lastActivity: "Tưới cây (2 giờ trước)",
  },
  {
    id: 2,
    name: "Vườn trái cây",
    cropName: "Táo",
    cropStage: "Đang phát triển",
    thumbnail: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e",
    location: "Nhà",
    groupName: "garden2",
    sensors: [],
    lastActivity: "Tưới cây (3 giờ trước)",
  },
];

const SENSOR_INFO = [
  {
    id: 1,
    gardenId: 1,
    gardenName: "Vườn cà chua",
    type: "temperature",
    icon: "thermometer",
    unit: "°C",
    feedName: "temperature",
    groupName: "garden1",
  },
  {
    id: 2,
    gardenId: 1,
    gardenName: "Vườn cà chua",
    type: "humidity",
    icon: "water-percent",
    unit: "%",
    feedName: "humidity",
    groupName: "garden1",
  },
  {
    id: 3,
    gardenId: 1,
    gardenName: "Vườn cà chua",
    type: "soilMoisture",
    icon: "water",
    unit: "%",
    feedName: "moisture",
    groupName: "garden1",
  },
  {
    id: 4,
    gardenId: 1,
    gardenName: "Vườn cà chua",
    type: "light",
    icon: "white-balance-sunny",
    unit: "lux",
    feedName: "light",
    groupName: "garden1",
  },
  {
    id: 5,
    gardenId: 1,
    gardenName: "Vườn cà chua",
    type: "pump",
    icon: "water-pump",
    feedName: "pump1",
    groupName: "garden1",
  },
  {
    id: 6,
    gardenId: 1,
    gardenName: "Vườn cà chua",
    type: "pump",
    icon: "water-pump",
    feedName: "pump2",
    groupName: "garden1",
  },
];

export default function HomeScreen() {
  const theme = useAppTheme();
  const { user, mqttMessages } = useGlobal();
  const [refreshing, setRefreshing] = useState(false);
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [sensorInfo, setSensorInfo] = useState<SensorInfo[]>([]);
  const [selectedGarden, setSelectedGarden] = useState<number | null>(1); // Default selected garden ID
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Format greeting based on time of day
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return "Good Morning";
    if (currentHour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const fetchGardens = useCallback(async () => {
    const gardens = await gardenService.getgardens();
    setSelectedGarden(gardens[0]?.id || 1);
    setGardens(gardens);
  }, []);
  const fetchSensorInfo = useCallback(async () => {
    const sensors = await gardenService.getSensors();
    setSensorInfo(sensors);
  }, []);

  useEffect(() => {
    fetchGardens();
    fetchSensorInfo();
  }, [fetchGardens, fetchSensorInfo]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGardens();
    await fetchSensorInfo();
    setRefreshing(false);
  }, [fetchGardens, fetchSensorInfo]);

  const filteredSensorInfo = selectedGarden
    ? sensorInfo.filter(
        (sensor) => sensor.gardenId === selectedGarden && sensor.type !== "pump"
      )
    : sensorInfo;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return theme.error;
      case "warning":
        return theme.warning;
      case "off":
        return theme.error;
      default:
        return theme.success;
    }
  };

  function getStatusByValue(sensorType: string, value: number): SensorStatus {
    switch (sensorType) {
      case "temperature":
        if (value > 40) return "critical";
        if (value > 30) return "warning";
        return "normal";

      case "humidity":
        if (value < 20) return "critical";
        if (value < 40) return "warning";
        return "normal";

      case "light":
        if (value < 5) return "warning";
        return "normal";

      case "soilMoisture":
        if (value < 30) return "critical";
        if (value < 50) return "warning";
        return "normal";

      default:
        return "normal";
    }
  }

  const getSensorIcon = (type: string, icon: string) => {
    // Use the provided icon or fall back to a default based on type
    switch (icon) {
      case "thermometer":
      case "water-percent":
      case "water":
      case "white-balance-sunny":
      case "water-pump":
        return (
          <MaterialCommunityIcons name={icon} size={24} color={theme.primary} />
        );
      default:
        return <Ionicons name="leaf-outline" size={24} color={theme.primary} />;
    }
  };

  const renderGardenItem = ({ item }: { item: Garden }) => {
    let temperatureData: SensorData | undefined;
    let humidityData: SensorData | undefined;
    let soilMoistureData: SensorData | undefined;
    let lightData: SensorData | undefined;

    // mapp function to get sensor data
    const sensorMap: { [key: string]: (sensor: SensorData) => void } = {
      temperature: (s) => (temperatureData = s),
      humidity: (s) => (humidityData = s),
      moisture: (s) => (soilMoistureData = s),
      light: (s) => (lightData = s),
    };

    const getSensorValue = (feedName: string): number => {
      const feedKey = `${item.groupName}.${feedName}`; // Ví dụ: "garden1.temperature"
      const mqttValue = mqttMessages[feedKey];
      if (mqttValue !== undefined) {
        return parseFloat(mqttValue);
      }
      return 0;
    };

    item.sensors.forEach((sensor) => {
      if (sensor.type === "PUMP") return;
      const sensorId = sensor.id;
      const feedName = sensor.feedName;
      sensorMap[sensor.type.toLowerCase()]?.({
        sensorId,
        value: getSensorValue(feedName),
        status: "normal",
        timestamp: new Date().toISOString(),
      });
    });

    return (
      <TouchableOpacity
        style={[
          styles.gardenCard,
          {
            backgroundColor: theme.card,
            borderColor:
              selectedGarden === item.id ? theme.primary : "transparent",
          },
        ]}
        onPress={() => setSelectedGarden(item.id)}
      >
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.gardenThumbnail}
          resizeMode="cover"
        />
        <View style={styles.gardenContent}>
          <View style={styles.gardenHeader}>
            <Text
              style={[styles.gardenTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>

          <Text style={[styles.gardenLocation, { color: theme.textSecondary }]}>
            <Ionicons name="location-outline" size={14} />
            {" " + item.location}
          </Text>

          <Text style={[styles.gardenCrop, { color: theme.textSecondary }]}>
            {item.cropName} • {getStageLabel(item.cropStage as CropStage)}
          </Text>

          {Object.keys(item.sensors).length > 0 ? (
            <View style={styles.sensorPreviewContainer}>
              {temperatureData && (
                <View style={styles.sensorPreview}>
                  <MaterialCommunityIcons
                    name="thermometer"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[styles.sensorValue, { color: theme.textSecondary }]}
                  >
                    {temperatureData.value}°C
                  </Text>
                </View>
              )}

              {humidityData && (
                <View style={styles.sensorPreview}>
                  <MaterialCommunityIcons
                    name="water-percent"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[styles.sensorValue, { color: theme.textSecondary }]}
                  >
                    {humidityData.value}%
                  </Text>
                </View>
              )}
              {soilMoistureData && (
                <View style={styles.sensorPreview}>
                  <MaterialCommunityIcons
                    name="water"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[styles.sensorValue, { color: theme.textSecondary }]}
                  >
                    {soilMoistureData.value}%
                  </Text>
                </View>
              )}
              {lightData && (
                <View style={styles.sensorPreview}>
                  <MaterialCommunityIcons
                    name="white-balance-sunny"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[styles.sensorValue, { color: theme.textSecondary }]}
                  >
                    {lightData.value} lux
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.sensorPreviewContainer}>
              <Text style={[styles.sensorValue, { color: theme.textTertiary }]}>
                No sensors
              </Text>
            </View>
          )}

          <View style={styles.gardenFooter}>
            <Text style={[styles.lastActivity, { color: theme.textTertiary }]}>
              {item.lastActivity === "" ? "No activity" : item.lastActivity}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSensorItem = ({ item }: { item: SensorInfo }) => {
    const feedKey = `${item.groupName}.${item.feedName}`; // Ví dụ: "garden1.temperature"
    console.log("Feed Key:", feedKey);
    const mqttValue = mqttMessages[feedKey];
    const newValue = mqttValue !== undefined ? parseFloat(mqttValue) : 0;
    const status = getStatusByValue(item.type, newValue);
    const timestamp = new Date().toISOString();

    return (
      <TouchableOpacity
        style={[styles.sensorCard, { backgroundColor: theme.card }]}
        onPress={() => router.push(`/(modules)/sensors/${item.id}`)}
      >
        <View style={styles.sensorHeader}>
          <View
            style={[
              styles.sensorIconContainer,
              { backgroundColor: getStatusColor(status) + "15" },
            ]}
          >
            {getSensorIcon(item.type, item.icon)}
          </View>
          <View
            style={[
              styles.sensorStatus,
              { backgroundColor: getStatusColor(status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.sensorStatusText,
                { color: getStatusColor(status) },
              ]}
            >
              {status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.sensorType, { color: theme.text }]}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </Text>

        <View style={styles.sensorValueContainer}>
          <Text style={[styles.sensorValueText, { color: theme.text }]}>
            {newValue}
            <Text style={[styles.sensorUnit, { color: theme.textSecondary }]}>
              {item.unit}
            </Text>
          </Text>
        </View>

        <Text style={[styles.sensorGarden, { color: theme.textSecondary }]}>
          {item.gardenName}
        </Text>

        {timestamp && (
          <Text style={[styles.sensorTimestamp, { color: theme.textTertiary }]}>
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
      edges={["bottom"]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.username, { color: theme.text }]}>
              {user?.firstName
                ? `${user?.firstName} ${user?.lastName}`
                : "Gardener"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.weatherButton, { backgroundColor: theme.card }]}
            onPress={() => {
              router.push("/(modules)/weather" as any);
            }}
          >
            <MaterialCommunityIcons
              name="weather-partly-cloudy"
              size={22}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

        {/* My Gardens Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              My Gardens
            </Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                router.push("/(modules)/gardens/all" as any);
              }}
            >
              <Text style={[styles.viewAllText, { color: theme.primary }]}>
                View All
              </Text>
              <MaterialIcons
                name="arrow-forward-ios"
                size={14}
                color={theme.primary}
              />
            </TouchableOpacity>
          </View>

          {gardens.length > 0 ? (
            <FlatList
              data={gardens as Garden[]}
              renderItem={renderGardenItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gardensListContent}
              ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            />
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
              <MaterialCommunityIcons
                name="sprout"
                size={40}
                color={theme.textTertiary}
              />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                No gardens yet
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: theme.textSecondary },
                ]}
              >
                Add your first garden to get started
              </Text>
              <TouchableOpacity
                style={[
                  styles.emptyStateButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => router.push("/(modules)/gardens/new" as any)}
              >
                <Text style={styles.emptyStateButtonText}>Add Garden</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sensor Data Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Sensor Data
            </Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                router.push("/(modules)/sensors" as any);
              }}
            >
              <Text style={[styles.viewAllText, { color: theme.primary }]}>
                All Sensors
              </Text>
              <MaterialIcons
                name="arrow-forward-ios"
                size={14}
                color={theme.primary}
              />
            </TouchableOpacity>
          </View>

          {filteredSensorInfo.length > 0 ? (
            <FlatList
              data={filteredSensorInfo as SensorInfo[]}
              renderItem={renderSensorItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sensorListContent}
              ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            />
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
              <MaterialCommunityIcons
                name="access-point"
                size={40}
                color={theme.textTertiary}
              />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                No sensor data
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: theme.textSecondary },
                ]}
              >
                {selectedGarden
                  ? "No sensors found for this garden"
                  : "Add sensors to your garden to monitor conditions"}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.card }]}
              onPress={() => router.push("/(modules)/tasks/new" as any)}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <MaterialIcons
                  name="add-task"
                  size={24}
                  color={theme.primary}
                />
              </View>
              <Text style={[styles.quickActionText, { color: theme.text }]}>
                Add Task
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.card }]}
              onPress={() => router.push("/(modules)/gardens/new" as any)}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <MaterialCommunityIcons
                  name="flower"
                  size={24}
                  color={theme.primary}
                />
              </View>
              <Text style={[styles.quickActionText, { color: theme.text }]}>
                New Garden
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.card }]}
              onPress={() =>
                router.push(`/(modules)/gardens/pumps/${selectedGarden}`)
              }
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <MaterialCommunityIcons
                  name="water-pump"
                  size={24}
                  color={theme.primary}
                />
              </View>
              <Text style={[styles.quickActionText, { color: theme.text }]}>
                Pump Action
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.card }]}
              onPress={() => router.push("/(modules)/sensors/scan" as any)}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={24}
                  color={theme.primary}
                />
              </View>
              <Text style={[styles.quickActionText, { color: theme.text }]}>
                Scan Sensor
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    welcomeSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
    },
    greeting: {
      fontSize: 16,
      fontFamily: "Inter-Regular",
    },
    username: {
      fontSize: 24,
      fontFamily: "Inter-Bold",
      marginTop: 4,
    },
    weatherButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    section: {
      marginTop: 24,
      paddingHorizontal: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: "Inter-Bold",
    },
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    viewAllText: {
      fontSize: 14,
      fontFamily: "Inter-Medium",
      marginRight: 4,
    },
    gardensListContent: {
      paddingRight: 20,
    },
    gardenCard: {
      width: 300,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 2,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    gardenThumbnail: {
      width: "100%",
      height: 120,
    },
    gardenContent: {
      padding: 12,
    },
    gardenHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    gardenTitle: {
      fontSize: 16,
      fontFamily: "Inter-SemiBold",
      flex: 1,
    },
    gardenLocation: {
      fontSize: 14,
      fontFamily: "Inter-Regular",
      marginBottom: 6,
    },
    gardenCrop: {
      fontSize: 14,
      fontFamily: "Inter-Regular",
      marginBottom: 8,
    },
    sensorPreviewContainer: {
      flexDirection: "row",
      marginBottom: 8,
    },
    sensorPreview: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 12,
    },
    sensorValue: {
      fontSize: 14,
      fontFamily: "Inter-Medium",
      marginLeft: 4,
    },
    gardenFooter: {
      borderTopWidth: 1,
      borderTopColor: "#EEEEEE",
      paddingTop: 8,
    },
    lastActivity: {
      fontSize: 12,
      fontFamily: "Inter-Regular",
    },
    sensorListContent: {
      paddingRight: 20,
    },
    sensorCard: {
      width: 140,
      borderRadius: 12,
      padding: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    sensorHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sensorIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    sensorStatus: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    sensorStatusText: {
      fontSize: 10,
      fontFamily: "Inter-Medium",
    },
    sensorType: {
      fontSize: 14,
      fontFamily: "Inter-SemiBold",
      marginBottom: 4,
    },
    sensorValueContainer: {
      marginBottom: 8,
    },
    sensorValueText: {
      fontSize: 20,
      fontFamily: "Inter-Bold",
    },
    sensorUnit: {
      fontSize: 14,
      fontFamily: "Inter-Regular",
    },
    sensorGarden: {
      fontSize: 12,
      fontFamily: "Inter-Regular",
      marginBottom: 4,
    },
    sensorTimestamp: {
      fontSize: 11,
      fontFamily: "Inter-Regular",
    },
    emptyState: {
      alignItems: "center",
      padding: 20,
      borderRadius: 12,
      marginBottom: 20,
    },
    emptyStateTitle: {
      fontSize: 16,
      fontFamily: "Inter-SemiBold",
      marginTop: 12,
      marginBottom: 4,
    },
    emptyStateSubtitle: {
      fontSize: 14,
      fontFamily: "Inter-Regular",
      textAlign: "center",
      marginBottom: 16,
    },
    emptyStateButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    emptyStateButtonText: {
      color: "#FFFFFF",
      fontFamily: "Inter-Medium",
      fontSize: 14,
    },
    quickActionsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: 8,
    },
    quickAction: {
      width: "48%",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      alignItems: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      backgroundColor: theme.card,
    },
    quickActionIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    quickActionText: {
      fontSize: 14,
      fontFamily: "Inter-Medium",
    },
    addButton: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      backgroundColor: theme.primary,
    },
  });
