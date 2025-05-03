import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import { GardenType, CropStage } from "@/constants/database";
import gardenService from "@/service/garden.service";
import type { GardenRequest } from "@/types";

export default function CreateGardenScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [gardenName, setGardenName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(""); // Simple location for now
  const [cropName, setCropName] = useState("");
  const [groupName, setGroupName] = useState(""); // New field for group name
  const [gardenType, setGardenType] = useState<GardenType | null>(null);
  const [cropStage, setCropStage] = useState<CropStage | null>(null); // New field for crop stage

  const handleSubmit = async () => {
    // Basic validation
    if (!gardenName || !cropName || !gardenType) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập tên vườn, loại cây trồng và chọn loại vườn."
      );
      return;
    }

    const newGarden: GardenRequest = {
      name: gardenName,
      description,
      location,
      cropName,
      groupName,
      gardenType: gardenType,
      cropStage: cropStage || CropStage.Seed, // Default to Seed if not provided
    };

    console.log("New Garden Data:", newGarden);
    try {
      await gardenService.createGarden(newGarden);
      // reset form fields
      setGardenName("");
      setDescription("");
      setLocation("");
      setCropName("");
      setGroupName("");
      setGardenType(null);
      setCropStage(null);
      // Show success alert

      Alert.alert("Thành công", "Đã tạo vườn mới.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error creating garden:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi tạo vườn mới.");
    }
    // TODO: Implement API call to create garden
    // TODO: Navigate back or to the new garden's detail screen
    // router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Tạo Vườn Mới" }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Thông tin vườn</Text>

        {/* Garden Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên vườn *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Vườn rau sân thượng"
            value={gardenName}
            onChangeText={setGardenName}
            placeholderTextColor={theme.textTertiary}
          />
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả ngắn về khu vườn của bạn"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor={theme.textTertiary}
          />
        </View>

        {/* Location Input (Simplified) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vị trí</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Tầng 5, Chung cư ABC"
            value={location}
            onChangeText={setLocation}
            placeholderTextColor={theme.textTertiary}
          />
        </View>

        {/* Group Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên Group Adafruit</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: garden1"
            value={groupName}
            onChangeText={setGroupName}
            placeholderTextColor={theme.textTertiary}
          />
        </View>

        {/* Plant Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Loại cây trồng chính *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Cà chua, Húng quế"
            value={cropName}
            onChangeText={setCropName}
            placeholderTextColor={theme.textTertiary}
          />
        </View>

        {/* Crop Stage Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Giai đoạn phát triển</Text>
          <View style={styles.typeSelectorContainer}>
            {Object.values(CropStage).map((stage) => (
              <TouchableOpacity
                key={stage}
                style={[
                  styles.typeButton,
                  cropStage === stage && styles.typeButtonSelected,
                ]}
                onPress={() => setCropStage(stage)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    cropStage === stage && styles.typeButtonTextSelected,
                  ]}
                >
                  {/* Convert enum to readable Vietnamese text */}
                  {stage === CropStage.Seed && "Hạt giống"}
                  {stage === CropStage.Germination && "Nảy mầm"}
                  {stage === CropStage.Vegetative && "Sinh trưởng"}
                  {stage === CropStage.Budding && "Ra nụ"}
                  {stage === CropStage.Flowering && "Ra hoa"}
                  {stage === CropStage.Fruiting && "Ra quả"}
                  {stage === CropStage.Maturity && "Trưởng thành"}
                  {stage === CropStage.Harvest && "Thu hoạch"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Garden Type Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Loại hình vườn *</Text>
          <View style={styles.typeSelectorContainer}>
            {Object.values(GardenType).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  gardenType === type && styles.typeButtonSelected,
                ]}
                onPress={() => setGardenType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    gardenType === type && styles.typeButtonTextSelected,
                  ]}
                >
                  {/* Convert enum to readable text */}
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Ionicons name="leaf-outline" size={20} color={theme.card} />
          <Text style={styles.submitButtonText}>Tạo vườn</Text>
        </TouchableOpacity>
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
      padding: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: "Inter-Bold",
      color: theme.text,
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontFamily: "Inter-Medium",
      color: theme.textSecondary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.card,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
    },
    textArea: {
      height: 100,
      textAlignVertical: "top", // Align text to top for multiline
    },
    typeSelectorContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    typeButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    typeButtonSelected: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    typeButtonText: {
      fontSize: 14,
      fontFamily: "Inter-Medium",
      color: theme.textSecondary,
    },
    typeButtonTextSelected: {
      color: theme.primary,
    },
    submitButton: {
      backgroundColor: theme.primary,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 24,
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    submitButtonText: {
      color: theme.card, // White text on primary button
      fontSize: 18,
      fontFamily: "Inter-SemiBold",
    },
  });
