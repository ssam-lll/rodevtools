"use client";

import { useState, useEffect, useCallback } from "react";
import type { HistoryItem } from "@/types/universe";

const STORAGE_KEY = "xray_search_history";

export function useSearchHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (!savedHistory) return;

    try {
      const parsed = JSON.parse(savedHistory);
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .map((item: any) => {
            if (typeof item === "string") return { id: item, name: item };
            if (item && typeof item === "object" && item.id) {
              return { id: String(item.id), name: item.name || String(item.id) };
            }
            return null;
          })
          .filter(Boolean) as HistoryItem[];
        setHistory(normalized);
      }
    } catch (e) {
      console.error("Error parsing history:", e);
    }
  }, []);

  const addToHistory = useCallback((item: { id: string | number; name?: string }) => {
    const idStr = String(item.id);
    const nameStr = item.name || idStr;

    setHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== idStr);
      const updated = [{ id: idStr, name: nameStr }, ...filtered].slice(0, 5);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addToHistory, clearHistory };
}
