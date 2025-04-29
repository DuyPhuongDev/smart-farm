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
}

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
}

export type SensorStatus = "normal" | "warning" | "critical" | "on" | "off";

export interface SensorData {
  sensorId: number;
  value: number;
  status: SensorStatus;
  timestamp: string;
}
