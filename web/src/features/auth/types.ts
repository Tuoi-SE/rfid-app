export interface LoginCredentials {
  username: string;
  password?: string;
  pin_code?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}
