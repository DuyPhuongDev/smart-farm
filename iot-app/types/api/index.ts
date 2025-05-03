import { GardenType } from "@/constants/database";
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  roleId: number;
  roleName?: string;
  gardener?: {
    experiencePoints: number;
    experienceLevelId: number;
    experienceLevel?: {
      level: number;
      title: string;
      icon: string;
    };
  };
  gardens: { id: number; groupName: string }[];
}

export interface SensorInfo {
  id: number;
  gardenId: number;
  gardenName: string;
  type: string;
  icon: string;
  unit?: string;
  feedName: string;
  groupName: string;
  name?: string;
  status?: PumpStatus;
}

export type SensorStatus = "normal" | "warning" | "critical";

export interface SensorData {
  sensorId: number;
  value: number;
  status: SensorStatus;
  timestamp: string;
}

// pump status enum
export enum PumpStatus {
  MAINTENANCE = "MAINTENANCE",
  AUTOMATIC = "AUTOMATIC",
  MANUAL = "MANUAL",
  ERROR = "ERROR",
}

export enum PumpValue {
  ON = "ON",
  OFF = "OFF",
}
export interface PumpData {
  sensorId: number;
  value: PumpValue;
  lastActivated: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string; // ISO datetime string
  path: string;
}
export interface GardenRequest {
  name: string;
  cropName: string;
  cropStage: string;
  description: string;
  // thumbnail: string;
  location: string;
  groupName: string;
  gardenType: GardenType;
}

export interface Garden {
  id: number;
  name: string;
  cropName: string;
  cropStage: string;
  thumbnail: string;
  location: string;
  groupName: string;
  // map id:type
  // list sensors: SensorInfo[];
  sensors: {
    id: number;
    type: string;
    feedName: string;
  }[];
  lastActivity: string;
  gardenType: GardenType;
}
