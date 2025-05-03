import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

// Mock data for gardens
const MOCK_GARDENS = [
  { id: "1", name: "Vườn Rau Xanh", type: "vegetable" },
  { id: "2", name: "Vườn Hoa", type: "flower" },
  { id: "3", name: "Vườn Gia Vị", type: "herb" },
  { id: "4", name: "Vườn Cây Ăn Quả", type: "fruit" },
];

// Task types in Vietnamese
const TASK_TYPES = [
  { value: "WATERING", label: "Tưới nước" },
  { value: "FERTILIZING", label: "Bón phân" },
  { value: "PRUNING", label: "Tỉa cành" },
  { value: "HARVESTING", label: "Thu hoạch" },
  { value: "PEST_CONTROL", label: "Kiểm soát sâu bệnh" },
  { value: "PLANTING", label: "Gieo trồng" },
  { value: "WEEDING", label: "Làm cỏ" },
];

// Task status options in Vietnamese
const TASK_STATUSES = [
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "SKIPPED", label: "Đã bỏ qua" },
];

interface TaskFormData {
  type: string;
  description: string;
  gardenName: string;
  dueDate: Date;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
}

export default function NewTaskScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    type: "WATERING",
    description: "",
    gardenName: MOCK_GARDENS[0].id,
    dueDate: new Date(Date.now() + 86400000), // Tomorrow
    status: "PENDING",
  });

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showTaskTypeModal, setShowTaskTypeModal] = useState(false);
  const [showGardenModal, setShowGardenModal] = useState(false);

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (selectedDate) {
      const currentDate = new Date(formData.dueDate);
      selectedDate.setHours(currentDate.getHours());
      selectedDate.setMinutes(currentDate.getMinutes());

      handleInputChange("dueDate", selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);

    if (selectedTime) {
      const newDate = new Date(formData.dueDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());

      handleInputChange("dueDate", newDate);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.description.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mô tả công việc");
      return false;
    }

    if (!formData.gardenName) {
      Alert.alert("Lỗi", "Vui lòng chọn khu vườn");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // In a real app, you would send the data to an API here
      console.log("Submitting new task:", formData);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert("Thành công", "Công việc mới đã được tạo", [
        {
          text: "OK",
          onPress: () => router.push("/(modules)/tasks"),
        },
      ]);
    } catch (error) {
      console.error("Error creating task:", error);
      Alert.alert("Lỗi", "Không thể tạo công việc. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTimeDisplay = (date: Date): string => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSelectedTaskTypeLabel = (): string => {
    const selectedType = TASK_TYPES.find(
      (type) => type.value === formData.type
    );
    return selectedType ? selectedType.label : "Chọn loại công việc";
  };

  const getSelectedGardenName = (): string => {
    const selectedGarden = MOCK_GARDENS.find(
      (garden) => garden.id === formData.gardenName
    );
    return selectedGarden ? selectedGarden.name : "Chọn khu vườn";
  };

  const renderTaskTypeModal = () => (
    <Modal
      visible={showTaskTypeModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowTaskTypeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Loại Công Việc</Text>
            <TouchableOpacity onPress={() => setShowTaskTypeModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={TASK_TYPES}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  formData.type === item.value && styles.selectedModalItem,
                ]}
                onPress={() => {
                  handleInputChange("type", item.value);
                  setShowTaskTypeModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    formData.type === item.value &&
                      styles.selectedModalItemText,
                  ]}
                >
                  {item.label}
                </Text>
                {formData.type === item.value && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderGardenModal = () => (
    <Modal
      visible={showGardenModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowGardenModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Khu Vườn</Text>
            <TouchableOpacity onPress={() => setShowGardenModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={MOCK_GARDENS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  formData.gardenName === item.id && styles.selectedModalItem,
                ]}
                onPress={() => {
                  handleInputChange("gardenName", item.id);
                  setShowGardenModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    formData.gardenName === item.id &&
                      styles.selectedModalItemText,
                  ]}
                >
                  {item.name}
                </Text>
                {formData.gardenName === item.id && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "Thêm Công Việc Mới",
          headerTitleAlign: "center",
        }}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Task Type */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Loại Công Việc</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowTaskTypeModal(true)}
          >
            <Text style={styles.selectorButtonText}>
              {getSelectedTaskTypeLabel()}
            </Text>
            <MaterialIcons
              name="arrow-drop-down"
              size={24}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Garden Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Khu Vườn</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowGardenModal(true)}
          >
            <Text style={styles.selectorButtonText}>
              {getSelectedGardenName()}
            </Text>
            <MaterialIcons
              name="arrow-drop-down"
              size={24}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Task Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Mô Tả Công Việc</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nhập mô tả công việc chi tiết"
            placeholderTextColor={theme.textTertiary}
            value={formData.description}
            onChangeText={(text) => handleInputChange("description", text)}
            multiline
            textAlignVertical="top"
            numberOfLines={4}
          />
        </View>

        {/* Due Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Ngày Hết Hạn</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons
              name="calendar-today"
              size={20}
              color={theme.primary}
            />
            <Text style={styles.datePickerButtonText}>
              {formatDateDisplay(formData.dueDate)}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={formData.dueDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Due Time */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Giờ Thực Hiện</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={theme.primary} />
            <Text style={styles.datePickerButtonText}>
              {formatTimeDisplay(formData.dueDate)}
            </Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={formData.dueDate}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Text style={styles.submitButtonText}>Đang Xử Lý...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.submitButtonText}>Tạo Công Việc</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <Text style={[styles.cancelButtonText, { color: theme.primary }]}>
            Hủy Bỏ
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {renderTaskTypeModal()}
      {renderGardenModal()}
    </SafeAreaView>
  );
}

const getStatusColor = (status: string, theme: any): string => {
  switch (status) {
    case "COMPLETED":
      return theme.success;
    case "SKIPPED":
      return theme.warning;
    case "PENDING":
    default:
      return theme.primary;
  }
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundSecondary,
    },
    scrollContainer: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 40,
    },
    formGroup: {
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
      fontFamily: "Inter-Regular",
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
    },
    selectorButton: {
      backgroundColor: theme.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectorButtonText: {
      fontSize: 16,
      color: theme.text,
      fontFamily: "Inter-Regular",
    },
    datePickerButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    datePickerButtonText: {
      fontSize: 16,
      color: theme.text,
      marginLeft: 8,
      fontFamily: "Inter-Regular",
    },
    statusButtonsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    statusButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      minWidth: 100,
      alignItems: "center",
    },
    statusButtonSelected: {
      borderWidth: 1,
    },
    statusButtonText: {
      fontSize: 14,
      fontFamily: "Inter-Medium",
    },
    submitButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 14,
      marginTop: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2,
    },
    submitButtonDisabled: {
      backgroundColor: theme.textTertiary,
    },
    submitButtonText: {
      color: "white",
      fontSize: 16,
      fontFamily: "Inter-SemiBold",
      marginLeft: 8,
    },
    cancelButton: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      marginTop: 12,
    },
    cancelButtonText: {
      fontSize: 16,
      fontFamily: "Inter-Medium",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContainer: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Platform.OS === "ios" ? 40 : 20,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
    },
    modalItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    selectedModalItem: {
      backgroundColor: theme.primaryLight + "30",
    },
    modalItemText: {
      fontSize: 16,
      color: theme.text,
    },
    selectedModalItemText: {
      color: theme.primary,
      fontWeight: "bold",
    },
  });
