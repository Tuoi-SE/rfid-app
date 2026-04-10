export interface LoginCredentials {
  loginKey: string;  // Now accepts email OR username
  password?: string;
  pin_code?: string;
  deviceType?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  mustChangePassword?: boolean;
  user?: {
    id: string;
    username: string;
    role: string;
    locationId?: string;
  };
}
