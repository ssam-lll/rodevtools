import { apiClient } from "./apiClient";
import type {
  AuthCredentials,
  AuthResponse,
  ChangePasswordPayload,
  DeleteAccountPayload,
} from "@/types/auth";

export const authService = {
  async login(credentials: AuthCredentials, signal?: AbortSignal): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/api/auth/login", credentials, { signal });
  },

  async register(credentials: AuthCredentials, signal?: AbortSignal): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/api/auth/register", credentials, { signal });
  },

  async changePassword(
    payload: ChangePasswordPayload,
    token: string,
    signal?: AbortSignal
  ): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>("/api/auth/password", payload, {
      headers: { Authorization: "Bearer " + token },
      signal,
    });
  },

  async deleteAccount(
    payload: DeleteAccountPayload,
    token: string,
    signal?: AbortSignal
  ): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>("/api/auth/account", {
      body: payload,
      headers: { Authorization: "Bearer " + token },
      signal,
    });
  },
};
