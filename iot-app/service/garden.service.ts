import apiClient from "./apiClient";
import { GARDEN_ENDPOINTS, DEVICE_ENPOINTS } from "./endpoints";
import type { ApiResponse, Garden, SensorInfo, GardenRequest } from "@/types";

// api for garden and deivce
class GardenService {
  // Get all gardens
  async getgardens(): Promise<Garden[]> {
    try {
      const response = await apiClient.get<ApiResponse<Garden[]>>(
        GARDEN_ENDPOINTS.LIST
      );
      const gardens = response.data.data;
      return gardens;
    } catch (error) {
      throw error;
    }
  }

  // create new garden
  async createGarden(garden: GardenRequest): Promise<Garden> {
    try {
      const response = await apiClient.post<ApiResponse<Garden>>(
        GARDEN_ENDPOINTS.CREATE,
        garden
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // get all sensors
  async getSensors(): Promise<SensorInfo[]> {
    try {
      const response = await apiClient.get<ApiResponse<SensorInfo[]>>(
        DEVICE_ENPOINTS.SENSORS
      );
      const sensors = response.data.data;
      return sensors;
    } catch (error) {
      throw error;
    }
  }

  // get all pumps
  async getPumps(gardenId: number): Promise<SensorInfo[]> {
    try {
      const response = await apiClient.get<ApiResponse<SensorInfo[]>>(
        DEVICE_ENPOINTS.PUMPS(gardenId)
      );
      const pumps = response.data.data;
      return pumps;
    } catch (error) {
      throw error;
    }
  }
}

export default new GardenService();
