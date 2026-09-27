
export interface UserSession {
  username: string;
  email?: string;
  role: string;
  token?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  email?: string;
  username?: string;
  role?: string;
  token?: string;
  message?: string;
  error?: string;
}
