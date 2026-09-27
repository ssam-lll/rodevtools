import { apiClient } from "./apiClient";
import type { AuthCredentials, AuthResponse } from "@/types/auth";

export const authService = {
  async login(credentials: AuthCredentials, signal?: AbortSignal): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/api/auth/login", credentials, { signal });
  },

  async register(credentials: AuthCredentials, signal?: AbortSignal): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/api/auth/register", credentials, { signal });
  },
};
