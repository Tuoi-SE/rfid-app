export interface AuthResponse {
  access_token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  deviceType?: string;
}
