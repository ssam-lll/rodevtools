
export interface HistoricalCCUPoint {
  day: string;
  ccu: number;
}

export interface HistoricalRevenuePoint {
  month: string;
  revenue: number;
}

export interface DailyMetric {
  dateKey: string;
  day: string;
  ccu: number;
  visits: number;
  playtime: number;
  revenue: number;
  [key: string]: string | number | undefined;
}

export interface XRayGameDetails {
  universeId: string;
  rootPlaceId?: string | number;
  name: string;
  gameName?: string;
  creator: string;
  creatorName?: string;
  activePlayers: number;
  playing?: number;
  healthScore: number;
  rating?: number;
  visits: number;
  monthlyRevenue: number;
  historicalCCU: HistoricalCCUPoint[];
  historicalRevenue: HistoricalRevenuePoint[];
  playtime?: number;
  dailyMetrics?: DailyMetric[];
}

export interface ListGame {
  universeId: string;
  rootPlaceId?: string | number;
  name: string;
  creator: string;
  activePlayers: number;
  growth24h: number;
  monthlyRevenueEst: number;
  healthScore: number;
  visits: number;
}

export interface RisingStarGame {
  universeId: string;
  name: string;
  creator: string;
  activePlayers: number;
  growth24h: number;
  monthlyRevenueEst: number;
  healthScore: number;
}

export interface GameCompareData {
  universeId: string;
  name: string;
  creator: string;
  activePlayers: number;
  monthlyRevenue: number;
  visits: number;
  healthScore: number;
  playtime: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface HistoryItem {
  id: string;
  name: string;
}

export interface TopGamesParams {
  page?: number;
  size?: number;
  sort?: string;
  dir?: "asc" | "desc";
  search?: string;
}

export interface RisingGamesParams {
  page?: number;
  size?: number;
  sort?: string;
  dir?: "asc" | "desc";
  search?: string;
}
