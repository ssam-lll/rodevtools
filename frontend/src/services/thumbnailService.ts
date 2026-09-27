import { apiClient } from "./apiClient";

export interface ThumbnailItem {
  targetId?: number;
  state?: string;
  imageUrl?: string;
}

export interface ThumbnailResponse {
  data?: ThumbnailItem[];
}

export const thumbnailService = {
  async getThumbnails(
    universeIds: string | number | (string | number)[],
    size = "150x150",
    signal?: AbortSignal
  ): Promise<ThumbnailResponse> {
    const ids = Array.isArray(universeIds) ? universeIds.join(",") : String(universeIds);

    return apiClient.get<ThumbnailResponse>("/api/thumbnails", {
      params: {
        universeIds: ids,
        size,
      },
      signal,
    });
  },
};
