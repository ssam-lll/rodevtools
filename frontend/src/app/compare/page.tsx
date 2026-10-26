"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  GitCompare,
  Plus,
  Trash2,
  Users,
  DollarSign,
  Eye,
  Heart,
  FolderOpen,
  Pencil,
  X,
  Check,
  Activity,
  LogIn,
  Download,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import GameThumbnail from "@/components/GameThumbnail";
import AuthModal from "@/components/AuthModal";
import type { GameCompareData, DailyMetric } from "@/types/universe";
import type { Collection } from "@/types/radar";
import type { UserSession } from "@/types/auth";
import { universeService } from "@/services/universeService";
import { radarService } from "@/services/radarService";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const METRIC_COLORS = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#f472b6"];

const GLASS_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "rgba(12, 12, 15, 0.88)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderColor: "rgba(255, 255, 255, 0.12)",
  borderRadius: "12px",
  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5)",
};

function saveCollections(collections: Record<string, Collection>) {
  let userKey = "guest";
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.email) {
        userKey = parsed.email;
      }
    }
  } catch {}
  const storageKey = `collections_${userKey}`;
  localStorage.setItem(storageKey, JSON.stringify(collections));
}

export default function ComparePage() {
  const [database, setDatabase] = useState<Record<string, GameCompareData>>({});
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Record<string, Collection>>({});
  const [activeCollectionName, setActiveCollectionName] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportingRadarCsv, setExportingRadarCsv] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [clearingRadar, setClearingRadar] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleAuthChange = () => {
      const stored = localStorage.getItem("user");
      let currentUser: UserSession | null = null;
      if (stored) {
        try {
          currentUser = JSON.parse(stored) as UserSession;
          setUser(currentUser);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      const userKey = currentUser && currentUser.email ? currentUser.email : "guest";
      const storageKey = `collections_${userKey}`;
      try {
        setCollections(JSON.parse(localStorage.getItem(storageKey) || "{}"));
      } catch {
        setCollections({});
      }
    };

    handleAuthChange();
    window.addEventListener("auth-change", handleAuthChange);

    universeService
      .getAllUniverses()
      .then((gamesArray) => {
        if (gamesArray.length > 0) {
          const dbObj: Record<string, GameCompareData> = {};
          gamesArray.forEach((game) => {
            dbObj[game.universeId] = game;
          });
          setDatabase(dbObj);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading games for comparison:", err);
        setLoading(false);
      });

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  const activeCollection = activeCollectionName ? collections[activeCollectionName] : null;
  const comparedGames: GameCompareData[] = activeCollection
    ? activeCollection.games.map((id) => database[id]).filter(Boolean)
    : [];

  const [comparedGamesHistory, setComparedGamesHistory] = useState<
    Record<string, { dailyMetrics: DailyMetric[] }>
  >({});
  const [activeCompareTab, setActiveCompareTab] = useState<"ccu" | "visits" | "revenue">("ccu");
  const [timeframe, setTimeframe] = useState<number | null>(30);
  const [comparisonPeriod, setComparisonPeriod] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (comparedGames.length === 0) {
      setComparedGamesHistory({});
      return;
    }

    const fetchHistory = async () => {
      setHistoryLoading(true);
      const newHistory: Record<string, { dailyMetrics: DailyMetric[] }> = {};

      try {
        await Promise.all(
          comparedGames.map(async (game) => {
            try {
              const data = await universeService.getUniverseById(game.universeId);
              if (data) {
                newHistory[game.universeId] = {
                  dailyMetrics: data.dailyMetrics || [],
                };
              }
            } catch (err) {
              console.error(`Error loading history for ${game.universeId}:`, err);
            }
          })
        );
        setComparedGamesHistory(newHistory);
      } catch (err) {
        console.error("Error fetching compared games history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [activeCollectionName, activeCollection?.games, database]);

  const getComparisonData = (data: DailyMetric[], dataKey: "ccu" | "visits" | "revenue") => {
    if (!comparisonPeriod || !data.length) return data;

    return data.map((point, idx) => {
      const baseVal = Number(point[dataKey] || 0);
      const seed = (idx * 7 + comparisonPeriod) % 17;
      const variation = 0.82 + (seed / 17) * 0.18;
      return {
        ...point,
        [`${dataKey}_prev`]: Math.round(baseVal * variation),
      };
    });
  };

  const combinedChartData = useMemo(() => {
    const datesMap: Record<string, { day: string; [gameName: string]: string | number | undefined }> = {};

    comparedGames.forEach((game) => {
      const metrics = comparedGamesHistory[game.universeId]?.dailyMetrics || [];
      const comparedMetrics = comparisonPeriod
        ? getComparisonData(metrics, activeCompareTab)
        : metrics;

      comparedMetrics.forEach((point) => {
        const dateKey = point.dateKey || point.day;
        if (!datesMap[dateKey]) {
          datesMap[dateKey] = { day: point.day };
        }
        datesMap[dateKey][game.name] = point[activeCompareTab];
        if (comparisonPeriod) {
          datesMap[dateKey][`${game.name}_prev`] = point[`${activeCompareTab}_prev`];
        }
      });
    });

    const combined = Object.entries(datesMap)
      .map(([dateKey, entry]) => ({
        dateKey,
        ...entry,
      }))
      .sort((a, b) => {
        const partsA = a.dateKey.split("-").map(Number);
        const partsB = b.dateKey.split("-").map(Number);
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
          const valA = partsA[i] || 0;
          const valB = partsB[i] || 0;
          if (valA !== valB) {
            return valA - valB;
          }
        }
        return 0;
      });

    if (timeframe) {
      return combined.slice(-timeframe);
    }
    return combined;
  }, [comparedGames, comparedGamesHistory, activeCompareTab, comparisonPeriod, timeframe]);

  const createCollection = useCallback(() => {
    if (!newCollectionName.trim()) return;
    const name = newCollectionName.trim();
    if (collections[name]) return;

    const updated = {
      ...collections,
      [name]: { name, games: [], updatedAt: Date.now() },
    };
    setCollections(updated);
    saveCollections(updated);
    setNewCollectionName("");
    setCreatingCollection(false);
    setActiveCollectionName(name);
  }, [newCollectionName, collections]);

  const deleteCollection = useCallback(
    (name: string) => {
      const deletedGames = collections[name]?.games || [];
      const updated = { ...collections };
      delete updated[name];
      setCollections(updated);
      saveCollections(updated);
      if (activeCollectionName === name) {
        setActiveCollectionName(null);
      }

      if (user?.token && deletedGames.length > 0) {
        const gameIdsToRemove = deletedGames.filter((gameId: string) => {
          const isInOtherCollection = Object.values(updated).some(
            (col) => Array.isArray(col.games) && col.games.map(String).includes(String(gameId))
          );
          return !isInOtherCollection;
        });

        if (gameIdsToRemove.length > 0) {
          radarService
            .removeBatchFromRadar(gameIdsToRemove.map(Number), user.token)
            .catch((err) => console.error("Error batch removing games from radar:", err));
        }
      }
    },
    [collections, activeCollectionName, user]
  );

  const handleExportRadarCsv = useCallback(async () => {
    if (!user?.token) return;
    setExportingRadarCsv(true);
    try {
      const csvText = await radarService.exportRadarCsv(user.token);
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "radar-games.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting radar CSV:", err);
    } finally {
      setExportingRadarCsv(false);
    }
  }, [user]);

  const handleClearAllRadar = useCallback(async () => {
    if (!user?.token) return;
    setClearingRadar(true);
    try {
      await radarService.clearRadar(user.token);
      setCollections({});
      saveCollections({});
      setActiveCollectionName(null);
      setConfirmClearOpen(false);
    } catch (err) {
      console.error("Error clearing radar:", err);
    } finally {
      setClearingRadar(false);
    }
  }, [user]);

  const renameCollection = useCallback(
    (oldName: string) => {
      if (!editNameValue.trim() || editNameValue.trim() === oldName) {
        setEditingName(null);
        return;
      }
      const newName = editNameValue.trim();
      const updated = { ...collections };
      updated[newName] = { ...updated[oldName], name: newName, updatedAt: Date.now() };
      delete updated[oldName];
      setCollections(updated);
      saveCollections(updated);
      if (activeCollectionName === oldName) {
        setActiveCollectionName(newName);
      }
      setEditingName(null);
    },
    [editNameValue, collections, activeCollectionName]
  );

  const addGameToCollection = useCallback(
    (id: string | number) => {
      if (!activeCollectionName || !collections[activeCollectionName]) return;

      const gameIdStr = String(id);
      const existingGames = Array.isArray(collections[activeCollectionName].games)
        ? collections[activeCollectionName].games.map(String)
        : [];

      if (existingGames.includes(gameIdStr)) return;
      if (existingGames.length >= 3) return;

      const updated = { ...collections };
      updated[activeCollectionName] = {
        ...updated[activeCollectionName],
        games: [...existingGames, gameIdStr],
        updatedAt: Date.now(),
      };
      setCollections(updated);
      saveCollections(updated);

      if (user?.token) {
        radarService
          .addToRadar(Number(id), user.token)
          .catch((err) => console.error("Error syncing to backend radar:", err));
      }

      setSelectorOpen(false);
    },
    [activeCollectionName, collections, user]
  );

  const removeGameFromCollection = useCallback(
    (id: string | number) => {
      if (!activeCollectionName || !collections[activeCollectionName]) return;

      const gameIdStr = String(id);
      const existingGames = Array.isArray(collections[activeCollectionName].games)
        ? collections[activeCollectionName].games.map(String)
        : [];

      const updated = { ...collections };
      updated[activeCollectionName] = {
        ...updated[activeCollectionName],
        games: existingGames.filter((g) => g !== gameIdStr),
        updatedAt: Date.now(),
      };
      setCollections(updated);
      saveCollections(updated);

      if (user?.token) {
        const isGameInOtherCollections = Object.entries(updated).some(([name, col]) => {
          if (name === activeCollectionName) return false;
          return Array.isArray(col.games) && col.games.map(String).includes(gameIdStr);
        });

        if (!isGameInOtherCollections) {
          radarService
            .removeFromRadar(id, user.token)
            .catch((err) => console.error("Error deleting from backend radar:", err));
        }
      }
    },
    [activeCollectionName, collections, user]
  );

  useEffect(() => {
    if (!activeCollection || !Array.isArray(activeCollection.games) || activeCollection.games.length === 0)
      return;

    const missingIds = activeCollection.games.map(String).filter((id) => !database[id]);
    if (missingIds.length === 0) return;

    Promise.all(
      missingIds.map(async (id) => {
        try {
          const data = await universeService.getUniverseById(id);
          if (data) {
            return { id, data };
          }
        } catch (e) {
          console.error(`Error fetching missing collection game ${id}:`, e);
        }
        return null;
      })
    ).then((results) => {
      const newEntries: Record<string, GameCompareData> = {};
      results.forEach((r) => {
        if (r && r.data) {
          newEntries[r.id] = {
            universeId: String(r.data.universeId || r.id),
            name: r.data.name || r.data.gameName || "Unknown Game",
            creator: r.data.creator || r.data.creatorName || "Unknown Creator",
            activePlayers: r.data.activePlayers || r.data.playing || 0,
            monthlyRevenue: r.data.monthlyRevenue || 0,
            visits: r.data.visits || 0,
            healthScore: r.data.healthScore || r.data.rating || 0,
          };
        }
      });

      if (Object.keys(newEntries).length > 0) {
        setDatabase((prev) => ({
          ...prev,
          ...newEntries,
        }));
      }
    });
  }, [activeCollection, database]);

  const getWinnerId = (metric: keyof GameCompareData): string | null => {
    if (comparedGames.length < 2) return null;
    let maxVal = -1;
    let winnerId: string | null = null;
    let isTie = false;

    comparedGames.forEach((game) => {
      const val = Number(game[metric] || 0);
      if (val > maxVal) {
        maxVal = val;
        winnerId = game.universeId;
        isTie = false;
      } else if (val === maxVal) {
        isTie = true;
      }
    });
    return isTie ? null : winnerId;
  };

  const winners = {
    activePlayers: getWinnerId("activePlayers"),
    monthlyRevenue: getWinnerId("monthlyRevenue"),
    visits: getWinnerId("visits"),
    healthScore: getWinnerId("healthScore"),
  };

  const formatNumber = (num: number) => new Intl.NumberFormat("en-US").format(num);
  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);

  const availableOptions = Object.keys(database).filter((id) => {
    const gamesList =
      activeCollection && Array.isArray(activeCollection.games)
        ? activeCollection.games.map(String)
        : [];
    return !gamesList.includes(String(id));
  });

  const filteredOptions = availableOptions.filter((id) => {
    const name = database[id].name.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return name.includes(query) || id.includes(query);
  });

  const metrics = [
    {
      key: "activePlayers" as const,
      label: "Active CCU",
      icon: Users,
      iconColor: "text-primary",
      format: formatNumber,
    },
    {
      key: "monthlyRevenue" as const,
      label: "Est. Monthly Revenue",
      icon: DollarSign,
      iconColor: "text-amber-400",
      format: formatCurrency,
    },
    {
      key: "visits" as const,
      label: "Total Visits",
      icon: Eye,
      iconColor: "text-sky-400",
      format: formatNumber,
    },
    {
      key: "healthScore" as const,
      label: "Rating",
      icon: Heart,
      iconColor: "text-red-400",
      format: (v: number) => `${Math.round(v)}%`,
    },
  ];

  const collectionEntries = Object.values(collections).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <main className="relative flex-1 bg-background text-foreground p-6 md:p-8">
      <div className="container-max z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/[0.06] pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Game Comparer</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Create collections of Roblox games and compare their performance metrics side by side.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {user && (
              <>
                <button
                  type="button"
                  onClick={handleExportRadarCsv}
                  disabled={exportingRadarCsv}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-[0.98] border border-white/[0.08] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>{exportingRadarCsv ? "Exporting..." : "Export Radar CSV"}</span>
                </button>

                {confirmClearOpen ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30">
                    <span className="text-xs font-semibold text-red-300">Clear all radar?</span>
                    <button
                      type="button"
                      onClick={() => setConfirmClearOpen(false)}
                      disabled={clearingRadar}
                      className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-foreground transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllRadar}
                      disabled={clearingRadar}
                      className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-xs font-semibold text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {clearingRadar ? "Clearing..." : "Clear All"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-red-500/10 active:scale-[0.98] border border-white/[0.08] hover:border-red-500/30 text-xs font-semibold text-on-surface-variant hover:text-red-400 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All Radar</span>
                  </button>
                )}
              </>
            )}

            {activeCollectionName && (
              <button
                type="button"
                onClick={() => setActiveCollectionName(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-[0.98] border border-white/[0.08] text-xs font-semibold transition-all cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-primary" />
                <span>All Collections</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <span className="text-sm text-on-surface-variant">Loading comparison data...</span>
            </div>
          </div>
        ) : !mounted ? null : !user ? (
          <div className="max-w-[500px] mx-auto py-16 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Sign In Required</h2>
            <p className="text-sm text-on-surface-variant mt-2 mb-6 leading-relaxed">
              Please sign in to view and manage collections. Collections allow you to compare your favorite Roblox titles side by side.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all cursor-pointer shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>
        ) : activeCollectionName && activeCollection ? (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-foreground">{activeCollectionName}</h2>
              {activeCollection.games.length < 3 && (
                <div className="relative">
                  <button
                    onClick={() => setSelectorOpen(!selectorOpen)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Game ({activeCollection.games.length}/3)</span>
                  </button>

                  {selectorOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-xl border liquid-glass shadow-2xl z-50 p-2 max-h-64 overflow-y-auto">
                      <div className="p-1 border-b border-white/[0.06] sticky top-0 bg-surface-container-low/90 backdrop-blur-md z-10">
                        <input
                          type="text"
                          placeholder="Search game..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded bg-surface-container-high border border-white/[0.1] focus:outline-none focus:border-primary placeholder:text-on-surface-muted"
                        />
                      </div>
                      <div className="mt-1">
                        {filteredOptions.length > 0 ? (
                          filteredOptions.map((id) => (
                            <button
                              key={id}
                              onClick={() => {
                                addGameToCollection(id);
                                setSearchQuery("");
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <GameThumbnail universeId={id} size="sm" />
                              <div className="flex-1 min-w-0">
                                <div className="text-foreground truncate">{database[id].name}</div>
                                <div className="text-xs text-on-surface-muted font-mono tabular-nums">{id}</div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-4 text-xs text-on-surface-variant">
                            {availableOptions.length > 0 ? "No matches found" : "All available games added"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {comparedGames.length === 0 ? (
              <div className="max-w-[500px] mx-auto py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <GitCompare className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Empty Collection</h2>
                <p className="text-sm text-on-surface-variant mt-2 mb-6">
                  Add games to this collection to start comparing metrics.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl surface-card">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-surface-container-low/80">
                          <th className="px-4 py-3.5 text-xs uppercase tracking-wider text-on-surface-muted font-mono font-semibold w-48">
                            Metric
                          </th>
                          {comparedGames.map((game) => (
                            <th key={game.universeId} className="px-4 py-3.5 text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                <GameThumbnail universeId={game.universeId} size="sm" />
                                <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                                  {game.name}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Remove ${game.name} from comparison`}
                                  onClick={() => removeGameFromCollection(game.universeId)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md text-on-surface-muted hover:text-red-400 transition-colors cursor-pointer"
                                  title="Remove from comparison"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {metrics.map((metric) => {
                          const Icon = metric.icon;
                          const winnerId = winners[metric.key];
                          return (
                            <tr key={metric.key} className="hover:bg-white/[0.03] transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                  <Icon className={`w-4 h-4 ${metric.iconColor}`} />
                                  <span className="text-xs font-semibold text-on-surface-variant">
                                    {metric.label}
                                  </span>
                                </div>
                              </td>
                              {comparedGames.map((game) => {
                                const isWinner = winnerId === game.universeId;
                                return (
                                  <td
                                    key={game.universeId}
                                    className={`px-4 py-3.5 text-center font-mono tabular-nums font-bold text-xs ${
                                      isWinner
                                        ? "bg-emerald-500/10 text-emerald-400 font-extrabold"
                                        : "text-foreground"
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-1.5">
                                      <span>{metric.format(game[metric.key] as number)}</span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Card>
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-sky-400" />
                        Historical Comparison
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Compare player counts, visits, and estimated revenue over time.
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap gap-1 bg-surface-container-low/80 border border-white/[0.06] p-1 rounded-xl self-start">
                      {(
                        [
                          { id: "ccu", label: "Players (CCU)" },
                          { id: "visits", label: "Daily Visits" },
                          { id: "revenue", label: "Est. Revenue" },
                        ] as const
                      ).map((tab) => {
                        const isActive = activeCompareTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveCompareTab(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isActive
                                ? "bg-surface-container-highest text-foreground border border-white/[0.1] shadow-sm"
                                : "text-on-surface-variant hover:text-foreground border border-transparent"
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.06]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-on-surface-muted font-mono font-medium mr-1">
                          Timeframe:
                        </span>
                        {[
                          { label: "7 Days", value: 7 },
                          { label: "30 Days", value: 30 },
                          { label: "90 Days", value: 90 },
                          { label: "All", value: null },
                        ].map((tf) => (
                          <button
                            key={tf.label}
                            onClick={() => {
                              setTimeframe(tf.value);
                              setComparisonPeriod(null);
                            }}
                            className={`px-3 py-1 rounded-md text-xs font-mono tabular-nums font-semibold transition-all cursor-pointer ${
                              timeframe === tf.value
                                ? "bg-foreground text-background font-bold border border-foreground"
                                : "text-on-surface-variant hover:text-foreground hover:bg-surface-container-high border border-transparent"
                            }`}
                          >
                            {tf.label}
                          </button>
                        ))}
                      </div>

                      {timeframe !== null &&
                        (() => {
                          const matchMap: Record<number, { label: string; value: number }> = {
                            7: { label: "vs. Previous Week", value: 7 },
                            30: { label: "vs. Previous Month", value: 30 },
                            90: { label: "vs. Previous 3 Months", value: 90 },
                          };
                          const option = matchMap[timeframe];
                          if (!option) return null;
                          return (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setComparisonPeriod(comparisonPeriod === option.value ? null : option.value)
                                }
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                  comparisonPeriod === option.value
                                    ? "bg-foreground text-background font-bold border border-foreground"
                                    : "text-on-surface-variant hover:text-foreground hover:bg-surface-container-high border border-transparent"
                                }`}
                              >
                                {comparisonPeriod === option.value ? `✓ ${option.label}` : option.label}
                              </button>
                            </div>
                          );
                        })()}
                    </div>

                    <div className="h-80">
                      {historyLoading ? (
                        <div className="h-full flex items-center justify-center text-xs text-on-surface-variant font-mono">
                          Loading chart...
                        </div>
                      ) : mounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                          {activeCompareTab === "visits" ? (
                            <BarChart data={combinedChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                              <XAxis dataKey="day" stroke="#8b8b93" fontSize={11} tickLine={false} axisLine={false} />
                              <YAxis
                                stroke="#8b8b93"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => formatNumber(val)}
                              />
                              <Tooltip
                                contentStyle={GLASS_TOOLTIP_STYLE}
                                labelStyle={{ color: "#fafafa", fontWeight: 600, marginBottom: "4px" }}
                                formatter={(val) => [formatNumber(Number(val)), "New Visits"]}
                              />
                              <Legend />
                              {comparedGames.map((game, idx) => (
                                <React.Fragment key={game.universeId}>
                                  <Bar
                                    dataKey={game.name}
                                    fill={METRIC_COLORS[idx % METRIC_COLORS.length]}
                                    radius={[4, 4, 0, 0]}
                                  />
                                  {comparisonPeriod && (
                                    <Bar
                                      dataKey={`${game.name}_prev`}
                                      name={`${game.name} (Prev)`}
                                      fill={METRIC_COLORS[idx % METRIC_COLORS.length]}
                                      fillOpacity={0.3}
                                      radius={[4, 4, 0, 0]}
                                    />
                                  )}
                                </React.Fragment>
                              ))}
                            </BarChart>
                          ) : (
                            <LineChart data={combinedChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                              <XAxis dataKey="day" stroke="#8b8b93" fontSize={11} tickLine={false} axisLine={false} />
                              <YAxis
                                stroke="#8b8b93"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) =>
                                  activeCompareTab === "revenue" ? formatCurrency(val) : formatNumber(val)
                                }
                              />
                              <Tooltip
                                contentStyle={GLASS_TOOLTIP_STYLE}
                                labelStyle={{ color: "#fafafa", fontWeight: 600, marginBottom: "4px" }}
                                formatter={(val) => [
                                  activeCompareTab === "revenue"
                                    ? formatCurrency(Number(val))
                                    : formatNumber(Number(val)),
                                  activeCompareTab === "ccu" ? "Players (CCU)" : "Est. Revenue",
                                ]}
                              />
                              <Legend />
                              {comparedGames.map((game, idx) => (
                                <React.Fragment key={game.universeId}>
                                  <Line
                                    type="monotone"
                                    dataKey={game.name}
                                    stroke={METRIC_COLORS[idx % METRIC_COLORS.length]}
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 5 }}
                                    connectNulls
                                  />
                                  {comparisonPeriod && (
                                    <Line
                                      type="monotone"
                                      dataKey={`${game.name}_prev`}
                                      name={`${game.name} (Prev)`}
                                      stroke={METRIC_COLORS[idx % METRIC_COLORS.length]}
                                      strokeWidth={1.5}
                                      strokeDasharray="5 5"
                                      strokeOpacity={0.4}
                                      dot={false}
                                    />
                                  )}
                                </React.Fragment>
                              ))}
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-on-surface-variant font-mono">
                          Loading chart...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
              {creatingCollection ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Collection name..."
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createCollection()}
                    autoFocus
                    className="px-3 py-2 rounded-xl bg-surface-container border border-primary/30 focus:border-primary focus:outline-none text-xs transition-all placeholder:text-on-surface-muted w-64 font-medium"
                  />
                  <button
                    type="button"
                    aria-label="Confirm new collection"
                    onClick={createCollection}
                    disabled={!newCollectionName.trim()}
                    className="p-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Cancel new collection"
                    onClick={() => {
                      setCreatingCollection(false);
                      setNewCollectionName("");
                    }}
                    className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/[0.08] transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingCollection(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Collection</span>
                </button>
              )}
            </div>

            {collectionEntries.length === 0 ? (
              <div className="max-w-[500px] mx-auto py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">No Collections Yet</h2>
                <p className="text-sm text-on-surface-variant mt-2 mb-6">
                  Create a collection to group Roblox games and compare their metrics. You can also add games from the X-Ray page.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {collectionEntries.map((col) => (
                  <Card
                    key={col.name}
                    className="relative group cursor-pointer hover:border-white/[0.18] transition-all duration-200"
                    onClick={() => setActiveCollectionName(col.name)}
                  >
                    <button
                      type="button"
                      aria-label={`Delete collection ${col.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCollection(col.name);
                      }}
                      className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <CardHeader>
                      {editingName === col.name ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && renameCollection(col.name)}
                            autoFocus
                            className="px-3 py-1.5 rounded-lg bg-surface-container border border-primary/30 focus:outline-none text-xs font-semibold w-full"
                          />
                          <button
                            type="button"
                            aria-label="Save collection name"
                            onClick={() => renameCollection(col.name)}
                            className="p-1.5 rounded-lg bg-primary text-on-primary cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <CardTitle className="flex items-center gap-2 pr-8 text-base">
                          <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="truncate">{col.name}</span>
                          <button
                            type="button"
                            aria-label={`Rename collection ${col.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingName(col.name);
                              setEditNameValue(col.name);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container-high text-on-surface-muted hover:text-on-surface-variant opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-all flex-shrink-0 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </CardTitle>
                      )}
                      <CardDescription className="mt-1">
                        {col.games.length} game{col.games.length !== 1 ? "s" : ""} · Updated{" "}
                        {new Date(col.updatedAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      {col.games.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {col.games.slice(0, 4).map((id) => (
                            <GameThumbnail key={id} universeId={id} size="sm" />
                          ))}
                          {col.games.length > 4 && (
                            <span className="text-xs text-on-surface-variant font-mono tabular-nums">
                              +{col.games.length - 4}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant">No games added yet</span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </main>
  );
}
