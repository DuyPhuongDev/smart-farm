import React, { useState, useMemo, useRef, useEffect } from "react";
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
import { useUser } from "@/contexts/UserContext";
import { router } from "expo-router";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { connect, MqttClient } from "@taoqf/react-native-mqtt";
import env from "@/config/environment";

const {
  adafruitUsername,
  adafruitKey,
  mqttBroker,
  feedTemperature,
  feedHumidity,
  feedLight,
  feedMoisture,
  feedPump,
} = env;

// Mocked data for development
const GARDENS_DATA = [
  {
    id: 1,
    name: "Vườn của phương đẹp trai",
    cropName: "Cà chua",
    cropStage: "Đang ra hoa",
    thumbnail: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e",
    location: "Nhà",
    sensors: {
      1: "temperature",
      2: "humidity",
      3: "soilMoisture",
      4: "light",
      5: "pump",
    },
    lastActivity: "Tưới cây (2 giờ trước)",
  },
  {
    id: 2,
    name: "Vườn của phương đẹp trai",
    cropName: "Cà chua",
    cropStage: "Đang ra hoa",
    thumbnail: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e",
    location: "Nhà",
    sensors: {},
    lastActivity: "Tưới cây (2 giờ trước)",
  },
];

const SENSOR_INFO = [
  {
    id: 1,
    gardenId: 1,
    gardenName: "Vườn của phương đẹp trai",
    type: "temperature",
    icon: "thermometer",
    unit: "°C",
  },
  {
    id: 2,
    gardenId: 1,
    gardenName: "Vườn của phương đẹp trai",
    type: "humidity",
    icon: "water-percent",
    unit: "%",
  },
  {
    id: 3,
    gardenId: 1,
    gardenName: "Vườn của phương đẹp trai",
    type: "soilMoisture",
    icon: "water",
    unit: "%",
  },
  {
    id: 4,
    gardenId: 1,
    gardenName: "Vườn của phương đẹp trai",
    type: "light",
    icon: "white-balance-sunny",
    unit: "lux",
  },
  {
    id: 5,
    gardenId: 1,
    gardenName: "Vườn của phương đẹp trai",
    type: "pump",
    icon: "water-pump",
  },
];

// Define Garden and SensorData interfaces
interface Garden {
  id: number;
  name: string;
  cropName: string;
  cropStage: string;
  thumbnail: string;
  location: string;
  // map id:type
  sensors: {
    [key: number]: string;
  };
  lastActivity: string;
}

interface SensorInfo {
  id: number;
  gardenId: number;
  gardenName: string;
  type: string;
  icon: string;
  unit?: string;
}

interface SensorData {
  sensorId: number;
  value: number;
  status: "normal" | "warning" | "critical" | "on" | "off";
  timestamp: string;
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [gardens, setGardens] = useState(GARDENS_DATA);
  const [sensorInfo, setSensorInfo] = useState(SENSOR_INFO);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [selectedGarden, setSelectedGarden] = useState<number | null>(1); // Default selected garden ID
  const sensorDataMap = useMemo(() => {
    const map = new Map<number, SensorData>();
    sensorData.forEach((d) => map.set(d.sensorId, d));
    return map;
  }, [sensorData]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  // ✅ Dùng useRef để giữ kết nối MQTT (tránh bị tạo lại khi re-render)
  const mqttClientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    if (!mqttClientRef.current) {
      // ✅ Tạo kết nối MQTT một lần duy nhất
      mqttClientRef.current = connect(mqttBroker, {
        username: adafruitUsername,
        password: adafruitKey,
      });

      mqttClientRef.current.on("connect", () => {
        console.log("✅ Kết nối MQTT thành công!");
        mqttClientRef.current?.subscribe(feedTemperature);
        mqttClientRef.current?.subscribe(feedHumidity);
        mqttClientRef.current?.subscribe(feedLight);
        mqttClientRef.current?.subscribe(feedMoisture);
        mqttClientRef.current?.subscribe(feedPump);
      });

      // MQTT message handler
      mqttClientRef.current.on("message", (topic, message) => {
        // Find the sensorId based on the topic
        let sensorId: number | null = null;

        if (topic === feedTemperature) {
          sensorId = 1; // Assuming 1 is the sensorId for temperature
        } else if (topic === feedHumidity) {
          sensorId = 2; // Assuming 2 is the sensorId for humidity
        } else if (topic === feedLight) {
          sensorId = 3; // Assuming 3 is the sensorId for light
        } else if (topic === feedMoisture) {
          sensorId = 4; // Assuming 4 is the sensorId for moisture
        } else if (topic === feedPump) {
          sensorId = 5; // Assuming 5 is the sensorId for pump
        }

        const changeValue = (value: string) => {
          if (sensorId === 5) {
            return value === "ON" ? 1 : 0;
          }
          return parseFloat(value);
        };

        const newValue = changeValue(message.toString());
        const timestamp = new Date().toISOString();

        if (sensorId !== null) {
          // Check if the sensor already exists in sensorData
          setSensorData((prevData) => {
            const updatedData = [...prevData];
            const sensorIndex = updatedData.findIndex(
              (d) => d.sensorId === sensorId
            );

            if (sensorIndex !== -1) {
              // If the sensor exists, update it
              updatedData[sensorIndex] = {
                ...updatedData[sensorIndex],
                value: newValue,
                timestamp,
              };
            } else {
              // If the sensor does not exist, add a new one
              let data: SensorData = {
                sensorId,
                value: newValue,
                status: "normal", // Assuming "normal" status by default
                timestamp,
              };

              if (sensorId === 5) {
                data.status = newValue === 1 ? "on" : "off";
              }

              updatedData.push(data);
            }
            return updatedData;
          });
        }
      });
    }

    // ✅ Cleanup khi component unmount
    return () => {
      if (mqttClientRef.current) {
        console.log("🔌 Ngắt kết nối MQTT...");
        mqttClientRef.current.end();
        mqttClientRef.current = null;
      }
    };
  }, []);

  // Format greeting based on time of day
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return "Good Morning";
    if (currentHour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setGardens(GARDENS_DATA);
      setSensorInfo(SENSOR_INFO);
      setRefreshing(false);
    }, 1500);
  }, []);

  const filteredSensorInfo = selectedGarden
    ? sensorInfo.filter((sensor) => sensor.gardenId === selectedGarden)
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
    let pumpData: SensorData | undefined;

    const sensorMap: { [key: string]: (sensor: SensorData) => void } = {
      temperature: (s) => (temperatureData = s),
      humidity: (s) => (humidityData = s),
      soilMoisture: (s) => (soilMoistureData = s),
      light: (s) => (lightData = s),
      pump: (s) => (pumpData = s),
    };

    Object.keys(item.sensors).forEach((key) => {
      const sensorId = parseInt(key);
      const sensor = sensorDataMap.get(sensorId) ?? {
        sensorId,
        value: 0,
        status: "normal",
        timestamp: new Date().toISOString(),
      };

      if (sensorId === 5) {
        sensor.status = sensor.value === 1 ? "on" : "off";
      }

      const sensorType = item.sensors[sensorId];
      sensorMap[sensorType]?.(sensor);
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
            {item.cropName} • {item.cropStage}
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
              <Text style={styles.sensorValue}>No sensors</Text>
            </View>
          )}
          <View style={styles.gardenFooter}>
            <Text style={[styles.lastActivity, { color: theme.textTertiary }]}>
              {item.lastActivity}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSensorItem = ({ item }: { item: SensorInfo }) => {
    // Tìm data realtime theo id
    const sensorRealtimeData = sensorDataMap.get(item.id);

    const generateValue = () => {
      if (item.id === 5) {
        return sensorRealtimeData
          ? sensorRealtimeData.value === 1
            ? "ON"
            : "OFF"
          : "OFF";
      }
      return sensorRealtimeData ? sensorRealtimeData.value : 0;
    };
    const status = sensorRealtimeData ? sensorRealtimeData.status : "normal";
    const timestamp = sensorRealtimeData ? sensorRealtimeData.timestamp : "";

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
            {generateValue()}
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

  const togglePump = () => {
    console.log("Toggle pump");
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
              onPress={togglePump}
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
                {sensorDataMap.get(5)
                  ? sensorDataMap.get(5)
                    ? "ON"
                    : "OFF"
                  : "No pump"}
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
