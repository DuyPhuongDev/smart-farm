import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { getItem, setItem, removeItem } from "@/utils/asyncStorage";
import { connect, MqttClient } from "@taoqf/react-native-mqtt";
import env from "@/config/environment";
import apiClient from "@/service/apiClient"; // Import apiClient
const { adafruitUsername, adafruitKey, mqttBroker } = env;
import {
  User,
  SensorInfo,
  AuthCredentials,
  MQTTConnectionState,
  USER,
  AUTH_KEY,
} from "@/types";

// ===== Context Creation =====
export type GlobalContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  mqttClientRef: React.MutableRefObject<MqttClient | null>;
  mqttConnectionStateRef: React.MutableRefObject<MQTTConnectionState | null>;
  publish: (groupName: string, feedName: string, message: string) => void;
  subscribe: (groupName: string, feedName: string) => void;
  unsubscribe: (groupName: string, feedName: string) => void;
  mqttMessages: Record<string, string>;
  devices: SensorInfo[];
  fetchDevices: () => Promise<void>;
  subscribeToGarden: (gardenId: number) => void;
};

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  // User state
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // MQTT state
  const mqttClientRef = useRef<MqttClient | null>(null);
  const mqttConnectionStateRef = useRef<MQTTConnectionState>("disconnected");
  const [mqttMessages, setMqttMessages] = useState<Record<string, string>>({});
  const [devices, setDevices] = useState<SensorInfo[]>([]);
  const subscribedTopics = useRef<Set<string>>(new Set());

  // Fetch devices from API using apiClient
  const fetchDevices = async () => {
    try {
      // const response = await apiClient.get("/devices");
      // if (response.data.status_code === 200) {
      //   const deviceData: SensorInfo[] = response.data.data;
      //   setDevices(deviceData);
      //   console.log("Fetched devices:", deviceData);
      // }
      // har      // Mock data for testing
      const mockData: SensorInfo[] = [
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
      setDevices(mockData);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    }
  };

  // Subscribe to all feeds in a garden
  const subscribeToGarden = (gardenId: number) => {
    if (
      !user ||
      !mqttClientRef.current ||
      mqttConnectionStateRef.current !== "connected"
    ) {
      console.warn("Cannot subscribe to garden: Invalid state");
      return;
    }

    const garden = user.gardens.find((g) => g.id === gardenId);
    if (!garden) {
      console.warn(`Garden with ID ${gardenId} not found`);
      return;
    }

    const groupTopic = `${adafruitUsername}/groups/${garden.groupName}`;
    if (!subscribedTopics.current.has(groupTopic)) {
      mqttClientRef.current.subscribe(groupTopic, { qos: 0 });
      subscribedTopics.current.add(groupTopic);
      console.log(`Subscribed to group ${groupTopic}`);
    }
  };

  // Connect to MQTT
  const connectToMQTT = (
    username: string,
    password: string,
    gardens?: User["gardens"]
  ) => {
    if (
      mqttConnectionStateRef.current === "connecting" ||
      mqttConnectionStateRef.current === "connected"
    )
      return;
    mqttConnectionStateRef.current = "connecting";

    const clientId = `garden_app_${Math.random()
      .toString(16)
      .substring(2, 10)}`;

    const options = {
      clientId,
      username,
      password,
      keepalive: 60,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
    };

    // Tạo client và thực hiện kết nối
    const client = connect(mqttBroker, options);

    client.on("connect", () => {
      console.log("✅ Connected to MQTT broker");
      mqttConnectionStateRef.current = "connected";

      // Đăng ký các garden nếu có
      if (gardens) {
        gardens.forEach((garden) => {
          subscribeToGarden(garden.id);
        });
      }
    });

    client.on("message", (topic: string, message: any) => {
      const messageStr = message.toString();
      console.log(`Received on ${topic}: ${messageStr}`);

      const topicParts = topic.split("/");
      if (topicParts.length === 3 && topicParts[1] === "groups") {
        const groupName = topicParts[2];

        try {
          const payload = JSON.parse(messageStr);
          if (payload.feeds) {
            const feedNames = Object.keys(payload.feeds);
            if (feedNames.length > 0) {
              const feedName = feedNames[0]; // lấy feed đầu tiên
              const value = payload.feeds[feedName];

              const feedTopic = `${groupName}.${feedName}`;
              setMqttMessages((prev) => ({
                ...prev,
                [feedTopic]: value,
              }));
            }
          }
        } catch (error) {
          console.error("Failed to parse MQTT message:", error);
        }
      }
    });

    client.on("error", (err: any) => {
      console.error("MQTT error:", err);
      mqttConnectionStateRef.current = "error";
    });

    client.on("offline", () => {
      console.log("⚡ MQTT offline");
      mqttConnectionStateRef.current = "disconnected";
    });

    client.on("close", () => {
      console.log("⚡ MQTT connection closed");
      mqttConnectionStateRef.current = "disconnected";
    });

    // Lưu client vào mqttClientRef
    mqttClientRef.current = client;
  };

  const disconnectFromMQTT = () => {
    if (mqttClientRef.current) {
      // Sử dụng end() để ngắt kết nối với MQTT
      mqttClientRef.current.end(); // Sử dụng end() từ @taoqf/react-native-mqtt
      mqttClientRef.current = null;
      mqttConnectionStateRef.current = "disconnected";
      setMqttMessages({});
      subscribedTopics.current.clear();
    }
  };

  // Publish message function
  const publish = (groupName: string, feedName: string, message: string) => {
    if (
      mqttClientRef.current &&
      mqttConnectionStateRef.current === "connected"
    ) {
      const topic = `${adafruitUsername}/groups/${groupName}`;
      message = message = JSON.stringify({ feeds: { [feedName]: message } });
      mqttClientRef.current.publish(topic, message);
      console.log(`Published to ${topic}: ${message}`);
    } else {
      console.warn("Cannot publish: MQTT client not connected");
    }
  };

  // Subscribe to topic
  const subscribe = (groupName: string, feedName: string) => {
    if (
      mqttClientRef.current &&
      mqttConnectionStateRef.current === "connected"
    ) {
      const topic = `${adafruitUsername}/groups/${groupName}.${feedName}`;
      if (!subscribedTopics.current.has(topic)) {
        mqttClientRef.current.subscribe(topic, { qos: 0 });
        subscribedTopics.current.add(topic);
        console.log(`Subscribed to ${topic}`);
      }
    } else {
      console.warn("Cannot subscribe: MQTT client not connected");
    }
  };

  // Unsubscribe from topic
  const unsubscribe = (groupName: string, feedName: string) => {
    if (
      mqttClientRef.current &&
      mqttConnectionStateRef.current === "connected"
    ) {
      const topic = `${adafruitUsername}/groups/${groupName}.${feedName}`;
      mqttClientRef.current.unsubscribe(topic);
      subscribedTopics.current.delete(topic);
      console.log(`Unsubscribed from ${topic}`);
    } else {
      console.warn("Cannot unsubscribe: MQTT client not connected");
    }
  };

  // Effect to load user and connect MQTT on startup
  useEffect(() => {
    async function initialize() {
      try {
        const userData = await getItem<User>(USER);
        if (userData) {
          setUser(userData);
          await fetchDevices();
          connectToMQTT(adafruitUsername, adafruitKey, userData.gardens);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();

    return () => {
      disconnectFromMQTT();
    };
  }, []);

  useEffect(() => {
    if (user) {
      disconnectFromMQTT(); // Ngắt MQTT hiện tại (nếu có)
      connectToMQTT(adafruitUsername, adafruitKey, user.gardens);
    }
  }, [user]);

  // User Authentication Functions
  const signIn = async (credentials: AuthCredentials): Promise<void> => {
    // try {
    //   // Thay thế mock login bằng API thực tế
    //   const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, credentials);
    //   const { access_token, user: userData } = response.data;
    //   // Lưu token và user data
    //   await setItem(AUTH_KEY, { access_token });
    //   await setItem("@user", userData);
    //   setUser(userData);
    //   await fetchDevices();
    //   connectToMQTT(adafruitUsername, adafruitKey, userData.gardens);
    // } catch (error) {
    //   console.error("Sign in error:", error);
    //   throw error;
    // }

    try {
      // In a real app, this would be an API call to your backend
      // Mock login check updated to use username
      if (
        credentials.username === "test" && // Changed from email to username
        credentials.password === "123"
      ) {
        const userData: User = {
          id: "1",
          firstName: "Duy",
          lastName: "Phuong",
          email: "gardener@test.com", // Keep email in user data for now
          profilePicture: "https://i.pravatar.cc/150?img=11",
          roleId: 2, // Gardener role ID
          roleName: "GARDENER",
          gardener: {
            experiencePoints: 750,
            experienceLevelId: 2,
            experienceLevel: {
              level: 2,
              title: "Garden Enthusiast",
              icon: "🌿",
            },
          },
          gardens: [
            {
              id: 1,
              groupName: "garden1",
            },
          ],
        };

        await setItem(USER, userData);
        setUser(userData);
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      disconnectFromMQTT();
      await removeItem(USER);
      await removeItem(AUTH_KEY);
      setUser(null);
      setDevices([]);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  // Context Value
  const value = {
    user,
    isLoading,
    signIn,
    signOut,
    mqttClientRef,
    mqttConnectionStateRef,
    publish,
    subscribe,
    unsubscribe,
    mqttMessages,
    devices,
    fetchDevices,
    subscribeToGarden,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
}

export function useGlobal(): GlobalContextType {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
}
