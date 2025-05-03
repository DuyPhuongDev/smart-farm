/**
 * API Endpoints
 *
 * Centralized location for all API endpoints used in the application.
 * This makes it easier to maintain URLs and version them.
 */

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  REFRESH: "/auth/refresh-token",
};

// User endpoints
export const USER_ENDPOINTS = {
  ME: "/auth/me",
  UPDATE_PROFILE: "/auth/profile",
};

// Garden endpoints
export const GARDEN_ENDPOINTS = {
  LIST: "/gardens",
  CREATE: "/gardens/create",
};

// Lesson endpoints
export const DEVICE_ENPOINTS = {
  SENSORS: "/devices/sensors",
  PUMPS: (gardenId: number) => `/devices/${gardenId}/pumps`,
  CREATE_SENSOR: "/devices/sensor",
  CREATE_PUMP: "/devices/pump",
};

// Other endpoints can be added here

// Combine all endpoints for easier imports
export default {
  AUTH: AUTH_ENDPOINTS,
  USER: USER_ENDPOINTS,
  GARDEN: GARDEN_ENDPOINTS,
  DEVICE: DEVICE_ENPOINTS,
};
