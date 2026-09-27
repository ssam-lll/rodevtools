import { apiClient } from "./apiClient";
import type { RadarPayload } from "@/types/radar";

export const radarService = {
  async addToRadar(universeId: number, token?: string, signal?: AbortSignal): Promise<unknown> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return apiClient.post<unknown>(
      "/api/radar",
      { universeId } as RadarPayload,
      { headers, signal }
    );
  },

  async removeFromRadar(universeId: string | number, token?: string, signal?: AbortSignal): Promise<unknown> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return apiClient.delete<unknown>(`/api/radar/${universeId}`, {
      headers,
      signal,
    });
  },

  async getRadar(token?: string, signal?: AbortSignal): Promise<unknown> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return apiClient.get<unknown>("/api/radar", { headers, signal });
  },
};
