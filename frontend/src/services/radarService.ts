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

  async removeBatchFromRadar(
    universeIds: number[],
    token: string,
    signal?: AbortSignal
  ): Promise<{ message: string; deletedCount: number }> {
    return apiClient.delete<{ message: string; deletedCount: number }>("/api/radar/batch", {
      body: { universeIds },
      headers: { Authorization: "Bearer " + token },
      signal,
    });
  },

  async clearRadar(
    token: string,
    signal?: AbortSignal
  ): Promise<{ message: string; deletedCount: number }> {
    return apiClient.delete<{ message: string; deletedCount: number }>("/api/radar", {
      headers: { Authorization: "Bearer " + token },
      signal,
    });
  },

  async exportRadarCsv(token: string, signal?: AbortSignal): Promise<string> {
    return apiClient.get<string>("/api/radar/export/csv", {
      headers: { Authorization: "Bearer " + token },
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
