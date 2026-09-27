import { apiClient } from "./apiClient";
import type {
  ListGame,
  XRayGameDetails,
  RisingStarGame,
  GameCompareData,
  PaginatedResponse,
  TopGamesParams,
  RisingGamesParams,
} from "@/types/universe";

export const universeService = {
  async searchUniverses(query: string, size = 6, signal?: AbortSignal): Promise<ListGame[]> {
    const data = await apiClient.get<ListGame[] | { content?: ListGame[] }>("/api/universes", {
      params: { search: query, size },
      signal,
    });
    return Array.isArray(data) ? data : (data && Array.isArray(data.content) ? data.content : []);
  },

  async getTopGames(params: TopGamesParams = {}, signal?: AbortSignal): Promise<PaginatedResponse<ListGame>> {
    const { page = 0, size = 20, sort = "playing", dir = "desc", search } = params;
    const queryParams: Record<string, string | number | undefined> = {
      page,
      size,
      sort,
      dir,
    };
    if (search && search.trim()) {
      queryParams.search = search.trim();
    }

    const data = await apiClient.get<PaginatedResponse<ListGame> | ListGame[]>("/api/universes", {
      params: queryParams,
      signal,
    });

    const isPaginated = !Array.isArray(data) && typeof data === "object" && data !== null;
    const content: ListGame[] = Array.isArray(data)
      ? data
      : (isPaginated && Array.isArray(data.content) ? data.content : []);

    return {
      content,
      totalPages: isPaginated && typeof data.totalPages === "number" ? data.totalPages : 1,
      totalElements: isPaginated && typeof data.totalElements === "number" ? data.totalElements : content.length,
      number: isPaginated && typeof data.number === "number" ? data.number : page,
      size: isPaginated && typeof data.size === "number" ? data.size : size,
    };
  },

  async resolveUniverse(query: string, signal?: AbortSignal): Promise<XRayGameDetails> {
    return apiClient.get<XRayGameDetails>("/api/universes/resolve", {
      params: { query },
      signal,
    });
  },

  async getRisingGames(params: RisingGamesParams = {}, signal?: AbortSignal): Promise<PaginatedResponse<RisingStarGame>> {
    const { page = 0, size = 20, sort = "playing", dir = "desc", search } = params;
    const queryParams: Record<string, string | number | undefined> = {
      page,
      size,
      sort,
      dir,
    };
    if (search && search.trim()) {
      queryParams.search = search.trim();
    }

    const data = await apiClient.get<PaginatedResponse<RisingStarGame> | RisingStarGame[]>("/api/universes/rising", {
      params: queryParams,
      signal,
    });

    const isPaginated = !Array.isArray(data) && typeof data === "object" && data !== null;
    const content: RisingStarGame[] = Array.isArray(data)
      ? data
      : (isPaginated && Array.isArray(data.content) ? data.content : []);

    return {
      content,
      totalPages: isPaginated && typeof data.totalPages === "number" ? data.totalPages : 0,
      totalElements: isPaginated && typeof data.totalElements === "number" ? data.totalElements : 0,
      number: isPaginated && typeof data.number === "number" ? data.number : page,
      size: isPaginated && typeof data.size === "number" ? data.size : size,
    };
  },

  async getAllUniverses(signal?: AbortSignal): Promise<GameCompareData[]> {
    const data = await apiClient.get<GameCompareData[] | { content?: GameCompareData[] }>("/api/universes", { signal });
    return Array.isArray(data) ? data : (data && Array.isArray(data.content) ? data.content : []);
  },

  async getUniverseById(id: string | number, signal?: AbortSignal): Promise<XRayGameDetails | null> {
    return apiClient.get<XRayGameDetails | null>(`/api/universes/${id}`, {
      signal,
    });
  },
};
