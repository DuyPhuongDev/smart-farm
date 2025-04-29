// Key dùng để lưu trữ dữ liệu xác thực trong AsyncStorage
export const AUTH_KEY = "@auth";
export const USER = "@user";
// Type cho dữ liệu xác thực
export type LoginData = {
  access_token: string;
  refresh_token?: string; // Optional, nếu backend sử dụng refresh token
};

export type AuthCredentials = {
  username: string;
  password: string;
};
