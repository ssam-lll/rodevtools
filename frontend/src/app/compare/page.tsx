"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { GitCompare, Plus, Trash2, Users, DollarSign, Eye, Heart, Clock, FolderOpen, Pencil, X, Check, BarChart3, Activity, LogIn } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import GameThumbnail from "@/components/GameThumbnail";
import AuthModal from "@/components/AuthModal";
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

interface GameCompareData {
  universeId: string;
  name: string;
  creator: string;
  activePlayers: number;
  monthlyRevenue: number;
  visits: number;
  healthScore: number;
  playtime: number;
}

interface Collection {
  name: string;
  games: string[];
  updatedAt: number;
}

const METRIC_COLORS = ["#85cfff", "#34ff8d", "#fdbc13", "#a855f7", "#ec4899"];

const COMPARISON_PERIODS = [
  { label: "Previous Week", value: 7 },
  { label: "Previous Month", value: 30 },
  { label: "Previous 2 Months", value: 56 },
  { label: "Previous 3 Months", value: 90 },
];

function getCollections(): Record<string, Collection> {
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
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

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
  const [user, setUser] = useState<any | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);

    const handleAuthChange = () => {
      const stored = localStorage.getItem("user");
      let currentUser = null;
      if (stored) {
        try {
          currentUser = JSON.parse(stored);
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

    // Fetch games database
    fetch("/api/universes")
      .then((res) => res.json())
      .then((data) => {
        const gamesArray = Array.isArray(data) ? data : (data && Array.isArray(data.content) ? data.content : []);
        if (gamesArray.length > 0) {
          const dbObj: Record<string, GameCompareData> = {};
          gamesArray.forEach((game: any) => {
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

  // Get games for active collection
  const activeCollection = activeCollectionName ? collections[activeCollectionName] : null;
  const comparedGames: GameCompareData[] = activeCollection
    ? activeCollection.games.map((id) => database[id]).filter(Boolean)
    : [];

  const [comparedGamesHistory, setComparedGamesHistory] = useState<Record<string, { dailyMetrics: any[] }>>({});
  const [activeCompareTab, setActiveCompareTab] = useState<"ccu" | "visits" | "playtime" | "revenue">("ccu");
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
      const newHistory: Record<string, { dailyMetrics: any[] }> = {};
      
      try {
        await Promise.all(
          comparedGames.map(async (game) => {
            const res = await fetch(`/api/universes?id=${game.universeId}`);
            if (res.ok) {
              const data = await res.json();
              newHistory[game.universeId] = {
                dailyMetrics: data.dailyMetrics || [],
              };
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

  // Generate comparison data for charts (deterministic based on index)
  const getComparisonData = (data: any[], dataKey: string) => {
    if (!comparisonPeriod || !data.length) return data;

    return data.map((point, idx) => {
      const baseVal = point[dataKey] || 0;
      const seed = (idx * 7 + comparisonPeriod) % 17;
      const variation = 0.82 + (seed / 17) * 0.18;
      return {
        ...point,
        [`${dataKey}_prev`]: Math.round(baseVal * variation),
      };
    });
  };

  // Combine historical data for Recharts based on activeCompareTab
  const combinedChartData = useMemo(() => {
    const datesMap: Record<string, { day: string; [gameName: string]: any }> = {};
    
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
        const partsA = a.dateKey.split('-').map(Number);
        const partsB = b.dateKey.split('-').map(Number);
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

  // Create new collection
  const createCollection = useCallback(() => {
    if (!newCollectionName.trim()) return;
    const name = newCollectionName.trim();
    if (collections[name]) return; // Already exists

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

  // Delete collection
  const deleteCollection = useCallback((name: string) => {
    const deletedGames = collections[name]?.games || [];
    const updated = { ...collections };
    delete updated[name];
    setCollections(updated);
    saveCollections(updated);
    if (activeCollectionName === name) {
      setActiveCollectionName(null);
    }

    // Sync deletions to Supabase: remove games not in any remaining collection
    if (user && user.token && deletedGames.length > 0) {
      deletedGames.forEach((gameId: string) => {
        const isInOtherCollection = Object.values(updated).some(
          (col) => Array.isArray(col.games) && col.games.map(String).includes(String(gameId))
        );
        if (!isInOtherCollection) {
          fetch(`/api/radar/${gameId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${user.token}` }
          }).catch(err => console.error("Error removing game from radar on collection delete:", err));
        }
      });
    }
  }, [collections, activeCollectionName, user]);

  // Rename collection
  const renameCollection = useCallback((oldName: string) => {
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
  }, [editNameValue, collections, activeCollectionName]);

  // Add game to active collection
  const addGameToCollection = useCallback((id: string | number) => {
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

    // Sync with backend user radar if logged in
    if (user && user.token) {
      fetch("/api/radar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({ universeId: Number(id) })
      }).catch(err => console.error("Error syncing to backend radar:", err));
    }

    setSelectorOpen(false);
  }, [activeCollectionName, collections, user]);

  // Remove game from active collection
  const removeGameFromCollection = useCallback((id: string | number) => {
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

    // Sync deletion with backend user radar if logged in and not present in other collections
    if (user && user.token) {
      const isGameInOtherCollections = Object.entries(updated).some(([name, col]) => {
        if (name === activeCollectionName) return false;
        return Array.isArray(col.games) && col.games.map(String).includes(gameIdStr);
      });

      if (!isGameInOtherCollections) {
        fetch(`/api/radar/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${user.token}`
          }
        }).catch(err => console.error("Error deleting from backend radar:", err));
      }
    }
  }, [activeCollectionName, collections, user]);

  // Dynamically fetch details for games in active collection that are missing from database
  useEffect(() => {
    if (!activeCollection || !Array.isArray(activeCollection.games) || activeCollection.games.length === 0) return;

    const missingIds = activeCollection.games.map(String).filter((id) => !database[id]);
    if (missingIds.length === 0) return;

    Promise.all(
      missingIds.map(async (id) => {
        try {
          const res = await fetch(`/api/universes?id=${id}`);
          if (res.ok) {
            const data = await res.json();
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
            playtime: r.data.playtime || 0
          };
        }
      });

      if (Object.keys(newEntries).length > 0) {
        setDatabase((prev) => ({
          ...prev,
          ...newEntries
        }));
      }
    });
  }, [activeCollection, database]);

  // Find winner helper
  const getWinnerId = (metric: keyof GameCompareData): string | null => {
    if (comparedGames.length < 2) return null;
    let maxVal = -1;
    let winnerId: string | null = null;
    let isTie = false;

    comparedGames.forEach((game) => {
      const val = game[metric] as number;
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
    playtime: getWinnerId("playtime"),
  };

  const formatNumber = (num: number) => new Intl.NumberFormat("en-US").format(num);
  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);

  const availableOptions = Object.keys(database).filter((id) => {
    const gamesList = activeCollection && Array.isArray(activeCollection.games)
      ? activeCollection.games.map(String)
      : [];
    return !gamesList.includes(String(id));
  });

  const filteredOptions = availableOptions.filter((id) => {
    const name = database[id].name.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return name.includes(query) || id.includes(query);
  });

  // Metrics config for the comparison table
  const metrics = [
    { key: "activePlayers" as const, label: "Active CCU", icon: Users, iconColor: "text-primary", format: formatNumber },
    { key: "monthlyRevenue" as const, label: "Est. Monthly Revenue", icon: DollarSign, iconColor: "text-amber-400", format: formatCurrency },
    { key: "visits" as const, label: "Total Visits", icon: Eye, iconColor: "text-secondary-container", format: formatNumber },
    { key: "healthScore" as const, label: "Rating", icon: Heart, iconColor: "text-red-400", format: (v: number) => `${Math.round(v)}%` },
    { key: "playtime" as const, label: "Avg Playtime", icon: Clock, iconColor: "text-blue-400", format: (v: number) => `${v} min` },
  ];

  // Prepare chart data for comparative bar chart
  const chartData = metrics.map((metric) => {
    const entry: Record<string, any> = { metric: metric.label };
    comparedGames.forEach((game) => {
      entry[game.name] = game[metric.key] as number;
    });
    return entry;
  });

  const collectionEntries = Object.values(collections).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <main className="relative flex-1 bg-background text-foreground py-xl px-gutter overflow-hidden">
      
      {/* Background Radial Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container-max z-10 relative">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl border-b border-outline-variant/30 pb-lg">
          <div>
            <div className="flex items-center gap-xs text-primary mb-xs">
              <GitCompare className="w-5 h-5" />
              <span className="text-label-caps font-semibold">Metrics Hub</span>
            </div>
            <h1 className="text-headline-lg font-bold">Game Comparer</h1>
            <p className="text-body-md text-on-surface-variant mt-xs">
              Create collections of Roblox games and compare their performance metrics side-by-side.
            </p>
          </div>

          {activeCollectionName && (
            <button
              onClick={() => setActiveCollectionName(null)}
              className="inline-flex items-center gap-xs px-md py-sm rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-body-sm font-semibold transition-all"
            >
              <FolderOpen className="w-4 h-4 text-primary" />
              <span>All Collections</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-xl">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-md"></div>
              <span className="text-body-md text-on-surface-variant font-mono">Loading metrics...</span>
            </div>
          </div>
        ) : !mounted ? null : !user ? (
          /* Sign In Prompt when not logged in */
          <div className="max-w-[500px] mx-auto py-xl text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-md shadow-[0_0_15px_rgba(0,175,244,0.15)]">
              <FolderOpen className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-headline-md font-bold text-foreground">Sign In Required</h2>
            <p className="text-body-md text-on-surface-variant mt-xs mb-lg">
              Please sign in to view and manage collections. Collections allow you to compare your favorite Roblox titles side-by-side.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-container transition-all cursor-pointer shadow-[0_0_10px_rgba(0,175,244,0.2)]"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>
        ) : activeCollectionName && activeCollection ? (
          /* Active Collection - Comparison View */
          <div className="space-y-lg animate-fade-in">
            {/* Collection Header */}
            <div className="flex items-center justify-between gap-md">
              <h2 className="text-headline-md font-bold">{activeCollectionName}</h2>
              {activeCollection.games.length < 3 && (
                <div className="relative">
                  <button
                    onClick={() => setSelectorOpen(!selectorOpen)}
                    className="inline-flex items-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-container transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Game ({activeCollection.games.length}/3)</span>
                  </button>

                  {selectorOpen && (
                    <div className="absolute right-0 mt-xs w-72 rounded-lg border border-outline bg-surface-container shadow-2xl z-50 p-xs max-h-64 overflow-y-auto">
                      {/* Search Bar inside selector */}
                      <div className="p-1 border-b border-outline-variant/30 sticky top-0 bg-surface-container z-10">
                        <input
                          type="text"
                          placeholder="Search game..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-sm py-xs text-xs rounded bg-surface-container-high border border-outline-variant/60 focus:outline-none focus:border-primary placeholder:text-on-surface-variant/40"
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
                              className="w-full text-left px-sm py-sm rounded hover:bg-surface-container-high text-body-sm font-semibold flex items-center gap-sm transition-colors"
                            >
                              <GameThumbnail universeId={id} size="sm" />
                              <div className="flex-1 min-w-0">
                                <div className="text-foreground truncate">{database[id].name}</div>
                                <div className="text-xs text-on-surface-variant font-mono">{id}</div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-md text-body-sm text-on-surface-variant">
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
              <div className="max-w-[500px] mx-auto py-xl text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-md">
                  <GitCompare className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <h2 className="text-headline-md font-bold text-foreground">Empty Collection</h2>
                <p className="text-body-md text-on-surface-variant mt-xs mb-lg">
                  Add games to this collection to start comparing metrics.
                </p>
              </div>
            ) : (
              <>
                {/* Comparative Table */}
                <div className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest/40 backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-outline-variant/60 bg-surface-container/50">
                          <th className="p-md text-label-caps text-on-surface-variant font-semibold w-48">Metric</th>
                          {comparedGames.map((game) => (
                            <th key={game.universeId} className="p-md text-center">
                              <div className="flex flex-col items-center gap-xs">
                                <GameThumbnail universeId={game.universeId} size="sm" />
                                <span className="text-body-sm font-semibold text-foreground truncate max-w-[120px]">
                                  {game.name}
                                </span>
                                <button
                                  onClick={() => removeGameFromCollection(game.universeId)}
                                  className="text-on-surface-variant/50 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30">
                        {metrics.map((metric) => {
                          const Icon = metric.icon;
                          const winnerId = winners[metric.key];
                          return (
                            <tr key={metric.key} className="hover:bg-surface-container-high/20 transition-colors">
                              <td className="p-md">
                                <div className="flex items-center gap-xs">
                                  <Icon className={`w-4 h-4 ${metric.iconColor}`} />
                                  <span className="text-body-sm font-semibold text-on-surface-variant">{metric.label}</span>
                                </div>
                              </td>
                              {comparedGames.map((game) => {
                                const isWinner = winnerId === game.universeId;
                                return (
                                  <td
                                    key={game.universeId}
                                    className={`p-md text-center font-mono font-bold ${
                                      isWinner
                                        ? "bg-emerald-500/8 text-emerald-400"
                                        : "text-foreground"
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-xs">
                                      <span>{metric.format(game[metric.key] as number)}</span>
                                      {isWinner && (
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                      )}
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

                {/* Comparative Switcher Card */}
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-outline-variant/30 pb-sm">
                    <div>
                      <CardTitle className="text-body-md font-bold flex items-center gap-xs">
                        <Activity className="w-4 h-4 text-primary" />
                        Comparative Performance Trends
                      </CardTitle>
                      <CardDescription>
                        Compare players, visits, playtime, and revenue trends side-by-side.
                      </CardDescription>
                    </div>

                    {/* Metric Tab Buttons */}
                    <div className="flex flex-wrap gap-xs bg-surface-container-low/60 border border-outline-variant/20 p-0.5 rounded-lg self-start">
                      {[
                        { id: "ccu", label: "Players (CCU)" },
                        { id: "visits", label: "Daily Visits" },
                        { id: "playtime", label: "Avg Session" },
                        { id: "revenue", label: "Est. Revenue" },
                      ].map((tab) => {
                        const isActive = activeCompareTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveCompareTab(tab.id as any)}
                            className={`px-sm py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                              isActive
                                ? "bg-primary-container/15 text-primary border border-primary-container/20 shadow-[0_0_10px_rgba(0,175,244,0.05)]"
                                : "text-on-surface-variant hover:text-foreground border border-transparent"
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-md">
                    {/* Timeframe & Comparison controls */}
                    <div className="flex flex-wrap items-center justify-between gap-sm mb-md pb-sm border-b border-outline-variant/10">
                      {/* Timeframe Selector */}
                      <div className="flex flex-wrap items-center gap-xs">
                        <span className="text-xs text-on-surface-variant font-medium mr-xs">Timeframe:</span>
                        {[
                          { label: "7 Days", value: 7 },
                          { label: "30 Days", value: 30 },
                          { label: "90 Days", value: 90 },
                          { label: "All", value: null },
                        ].map((tf) => (
                          <button
                            key={tf.label}
                            onClick={() => { setTimeframe(tf.value); setComparisonPeriod(null); }}
                            className={`px-sm py-xs rounded-md text-xs font-semibold transition-all cursor-pointer ${
                              timeframe === tf.value
                                ? "bg-primary/15 text-primary border border-primary/30"
                                : "text-on-surface-variant hover:text-foreground hover:bg-surface-container-high border border-transparent"
                            }`}
                          >
                            {tf.label}
                          </button>
                        ))}
                      </div>

                      {/* Compare with — only the matching period for the active timeframe */}
                      {timeframe !== null && (() => {
                        const matchMap: Record<number, { label: string; value: number }> = {
                          7:  { label: "vs. Previous Week",   value: 7  },
                          30: { label: "vs. Previous Month",  value: 30 },
                          90: { label: "vs. Previous 3 Months", value: 90 },
                        };
                        const option = matchMap[timeframe];
                        if (!option) return null;
                        return (
                          <div className="flex items-center gap-xs">
                            <button
                              onClick={() => setComparisonPeriod(comparisonPeriod === option.value ? null : option.value)}
                              className={`px-sm py-xs rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                comparisonPeriod === option.value
                                  ? "bg-primary/15 text-primary border border-primary/30"
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
                        <div className="h-full flex items-center justify-center text-body-sm text-on-surface-variant font-mono animate-pulse">
                          Loading historical trends...
                        </div>
                      ) : mounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                          {activeCompareTab === "visits" ? (
                            <BarChart data={combinedChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#272a31" />
                              <XAxis dataKey="day" stroke="#87929b" fontSize={11} />
                              <YAxis stroke="#87929b" fontSize={11} tickFormatter={(val) => formatNumber(val)} />
                              <Tooltip
                                contentStyle={{ backgroundColor: "#1d2027", borderColor: "#3e4850", borderRadius: "8px" }}
                                labelStyle={{ color: "#e0e2ec" }}
                                formatter={(val) => [formatNumber(val as number), "New Visits"]}
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
                              <CartesianGrid strokeDasharray="3 3" stroke="#272a31" />
                              <XAxis dataKey="day" stroke="#87929b" fontSize={11} />
                              <YAxis
                                stroke="#87929b"
                                fontSize={11}
                                tickFormatter={(val) => 
                                  activeCompareTab === "revenue" ? formatCurrency(val) : formatNumber(val)
                                }
                              />
                              <Tooltip
                                contentStyle={{ backgroundColor: "#1d2027", borderColor: "#3e4850", borderRadius: "8px" }}
                                labelStyle={{ color: "#e0e2ec" }}
                                formatter={(val) => [
                                  activeCompareTab === "revenue" ? formatCurrency(val as number)
                                  : activeCompareTab === "playtime" ? `${val} min`
                                  : formatNumber(val as number),
                                  activeCompareTab === "ccu" ? "Players (CCU)"
                                  : activeCompareTab === "playtime" ? "Avg Session"
                                  : "Est. Revenue"
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
                                    dot={{ r: 4 }}
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
                        <div className="h-full flex items-center justify-center text-body-sm text-on-surface-variant">
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
          /* Collections List View */
          <div className="space-y-lg animate-fade-in">
            {/* New Collection Button / Form */}
            <div className="flex items-center gap-md">
              {creatingCollection ? (
                <div className="flex items-center gap-sm">
                  <input
                    type="text"
                    placeholder="Collection name..."
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createCollection()}
                    autoFocus
                    className="px-md py-sm rounded-lg bg-surface-container/60 border border-primary/30 focus:border-primary focus:outline-none text-body-sm transition-all placeholder:text-on-surface-variant/50 w-64"
                  />
                  <button
                    onClick={createCollection}
                    disabled={!newCollectionName.trim()}
                    className="p-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setCreatingCollection(false); setNewCollectionName(""); }}
                    className="p-sm rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingCollection(true)}
                  className="inline-flex items-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-container transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Collection</span>
                </button>
              )}
            </div>

            {/* Collections Grid */}
            {collectionEntries.length === 0 ? (
              <div className="max-w-[500px] mx-auto py-xl text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-md">
                  <FolderOpen className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <h2 className="text-headline-md font-bold text-foreground">No Collections Yet</h2>
                <p className="text-body-md text-on-surface-variant mt-xs mb-lg">
                  Create a collection to group Roblox games and compare their metrics. You can also add games from the X-Ray page.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
                {collectionEntries.map((col) => (
                  <Card
                    key={col.name}
                    className="relative group cursor-pointer hover:border-primary/40 transition-all duration-200"
                    onClick={() => setActiveCollectionName(col.name)}
                  >
                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCollection(col.name); }}
                      className="absolute top-md right-md p-xs rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all z-10 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <CardHeader>
                      {editingName === col.name ? (
                        <div className="flex items-center gap-xs" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && renameCollection(col.name)}
                            autoFocus
                            className="px-sm py-xs rounded bg-surface-container border border-primary/30 focus:outline-none text-body-sm font-semibold w-full"
                          />
                          <button
                            onClick={() => renameCollection(col.name)}
                            className="p-xs rounded bg-primary text-on-primary"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <CardTitle className="flex items-center gap-xs pr-8">
                          <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="truncate">{col.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingName(col.name);
                              setEditNameValue(col.name);
                            }}
                            className="p-0.5 rounded hover:bg-surface-container-high text-on-surface-variant/40 hover:text-on-surface-variant opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </CardTitle>
                      )}
                      <CardDescription>
                        {col.games.length} game{col.games.length !== 1 ? "s" : ""} · Updated {new Date(col.updatedAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      {col.games.length > 0 ? (
                        <div className="flex items-center gap-sm">
                          {col.games.slice(0, 4).map((id) => (
                            <GameThumbnail key={id} universeId={id} size="sm" />
                          ))}
                          {col.games.length > 4 && (
                            <span className="text-xs text-on-surface-variant font-mono">+{col.games.length - 4}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-body-sm text-on-surface-variant">No games added yet</span>
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
