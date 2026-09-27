
export interface Collection {
  name: string;
  games: string[];
  updatedAt: number;
}

export interface RadarPayload {
  universeId: number;
}

export interface RadarItem {
  id?: number | string;
  universeId: number;
  addedAt?: string;
}
