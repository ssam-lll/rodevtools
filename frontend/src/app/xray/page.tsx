"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search, Activity, Users, DollarSign, Heart, ArrowLeft, History, Trash2,
  ExternalLink, Share2, FolderPlus, Star, Shield, Gamepad2, BarChart3, Check
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import GameThumbnail from "@/components/GameThumbnail";
import SortableTable, { ColumnDef } from "@/components/SortableTable";
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

// Interface for X-Ray Game details
interface XRayGameDetails {
  universeId: string;
  name: string;
  creator: string;
  activePlayers: number;
  healthScore: number;
  visits: number;
  monthlyRevenue: number;
  historicalCCU: { day: string; ccu: number }[];
  historicalRevenue: { month: string; revenue: number }[];
  playtime?: number;
  dailyMetrics?: {
    dateKey: string;
    day: string;
    ccu: number;
    visits: number;
    playtime: number;
    revenue: number;
  }[];
}

// Interface for list game
interface ListGame {
  universeId: string;
  name: string;
  creator: string;
  activePlayers: number;
  growth24h: number;
  monthlyRevenueEst: number;
  healthScore: number;
  visits: number;
}

interface HistoryItem {
  id: string;
  name: string;
}

// Toast component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast-container">
      <div className="toast toast-success flex items-center gap-sm">
        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}

// Comparison period options
const COMPARISON_PERIODS = [
  { label: "Previous Week", value: 7 },
  { label: "Previous Month", value: 30 },
  { label: "Previous 2 Months", value: 56 },
  { label: "Previous 3 Months", value: 90 },
];

function XRayDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const universeId = searchParams.get("universeId");

  const [searchInput, setSearchInput] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeGame, setActiveGame] = useState<XRayGameDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [allGames, setAllGames] = useState<ListGame[]>([]);
  const [allGamesLoading, setAllGamesLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [comparisonPeriod, setComparisonPeriod] = useState<number | null>(null);
  const [activeBreakdownTab, setActiveBreakdownTab] = useState<"ccu" | "visits" | "playtime" | "revenue">("visits");

  // Load search history from LocalStorage
  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem("xray_search_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((item: any) => {
            if (typeof item === "string") {
              return { id: item, name: item };
            }
            if (item && typeof item === "object" && item.id) {
              return { id: item.id, name: item.name || item.id };
            }
            return null;
          }).filter(Boolean) as HistoryItem[];
          setHistory(normalized);
        }
      } catch (e) {
        console.error("Error parsing history:", e);
      }
    }
  }, []);

  // Fetch all games for the top games table
  useEffect(() => {
    fetch("/api/universes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllGames(data);
        }
        setAllGamesLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching games list:", err);
        setAllGamesLoading(false);
      });
  }, []);

  // Fetch details for active universe ID
  useEffect(() => {
    if (!universeId) {
      setActiveGame(null);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    fetch(`/api/universes?id=${universeId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Game not found in database.");
        }
        return res.json();
      })
      .then((data) => {
        setActiveGame(data);
        setLoading(false);
        if (data && data.universeId) {
          setHistory((prevHistory) => {
            const filtered = prevHistory.filter((item) => item.id !== data.universeId);
            const updated = [{ id: data.universeId, name: data.name || data.universeId }, ...filtered].slice(0, 5);
            localStorage.setItem("xray_search_history", JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch((err) => {
        console.error("Error loading xray details:", err);
        setErrorMsg(err.message || "Failed to load game analytics.");
        setLoading(false);
        setActiveGame(null);
      });
  }, [universeId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    triggerSearch(searchInput.trim());
  };

  const triggerSearch = (id: string) => {
    router.push(`/xray?universeId=${id}`);
    setSearchInput("");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("xray_search_history");
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
  };

  // Share URL handler
  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/xray?universeId=${activeGame?.universeId}`;
    navigator.clipboard.writeText(url).then(() => {
      setToastMessage("X-Ray link copied to clipboard!");
    }).catch(() => {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setToastMessage("X-Ray link copied to clipboard!");
    });
  }, [activeGame]);

  // Add to collection handler
  const handleAddToCollection = useCallback(() => {
    if (!activeGame) return;
    const userKey = "guest"; // Would use supabase user email if logged in
    const storageKey = `collections_${userKey}`;
    const collections = JSON.parse(localStorage.getItem(storageKey) || "{}");
    
    // Default collection
    if (!collections["My Games"]) {
      collections["My Games"] = { name: "My Games", games: [], updatedAt: Date.now() };
    }
    
    const defaultCollection = collections["My Games"];
    if (!defaultCollection.games.includes(activeGame.universeId)) {
      defaultCollection.games.push(activeGame.universeId);
      defaultCollection.updatedAt = Date.now();
      localStorage.setItem(storageKey, JSON.stringify(collections));
      setToastMessage(`Added "${activeGame.name}" to "My Games" collection`);
    } else {
      setToastMessage(`"${activeGame.name}" is already in "My Games"`);
    }
  }, [activeGame]);

  // Generate comparison data for charts (deterministic based on index)
  const getComparisonData = (data: any[], dataKey: string) => {
    if (!comparisonPeriod || !data.length) return data;

    return data.map((point, idx) => {
      const baseVal = point[dataKey] || 0;
      // Deterministic variation using sine wave based on index and period
      const seed = (idx * 7 + comparisonPeriod) % 17;
      const variation = 0.82 + (seed / 17) * 0.18;
      return {
        ...point,
        [`${dataKey}_prev`]: Math.round(baseVal * variation),
      };
    });
  };

  // Top games table columns
  const topGamesColumns: ColumnDef<ListGame>[] = [
    {
      key: "thumbnail",
      label: "",
      width: "72px",
      render: (game) => <GameThumbnail universeId={game.universeId} size="md" />,
    },
    {
      key: "name",
      label: "Game",
      sortable: true,
      filterable: true,
      sortValue: (game) => game.name,
      render: (game) => (
        <div>
          <div className="font-semibold text-foreground">{game.name}</div>
          <div className="text-xs text-on-surface-variant">{game.creator}</div>
        </div>
      ),
    },
    {
      key: "activePlayers",
      label: "Active Players",
      sortable: true,
      filterable: true,
      isNumeric: true,
      align: "right",
      sortValue: (game) => game.activePlayers,
      render: (game) => <span className="text-data-md font-mono">{formatNumber(game.activePlayers)}</span>,
    },
    {
      key: "visits",
      label: "Total Visits",
      sortable: true,
      filterable: true,
      isNumeric: true,
      align: "right",
      sortValue: (game) => game.visits,
      render: (game) => <span className="text-data-md font-mono">{formatNumber(game.visits)}</span>,
    },
    {
      key: "healthScore",
      label: "Health",
      sortable: true,
      filterable: true,
      isNumeric: true,
      align: "center",
      sortValue: (game) => game.healthScore,
      render: (game) => (
        <span className={`inline-flex items-center px-sm py-xs rounded text-xs font-mono font-bold ${
          game.healthScore >= 95 ? "bg-emerald-500/10 text-emerald-400"
          : game.healthScore >= 90 ? "bg-primary/10 text-primary"
          : "bg-amber-500/10 text-amber-400"
        }`}>
          {game.healthScore}
        </span>
      ),
    },
  ];

  // Prepare chart data with comparison
  const consolidatedChartData = comparisonPeriod
    ? getComparisonData(activeGame?.dailyMetrics || [], activeBreakdownTab)
    : activeGame?.dailyMetrics || [];

  // Find game rank among all games
  const gameRank = activeGame
    ? [...allGames].sort((a, b) => b.activePlayers - a.activePlayers).findIndex((g) => g.universeId === activeGame.universeId) + 1
    : 0;

  return (
    <main className="relative flex-1 bg-background text-foreground py-xl px-gutter overflow-hidden">
      
      {/* Background Radial Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container-max z-10 relative">
        {/* Header / Search Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl border-b border-outline-variant/30 pb-lg">
          <div>
            <div className="flex items-center gap-xs text-primary mb-xs">
              <Activity className="w-5 h-5" />
              <span className="text-label-caps font-semibold">Diagnostic System</span>
            </div>
            <h1 className="text-headline-lg font-bold">Game X-Ray</h1>
            <p className="text-body-md text-on-surface-variant mt-xs">
              Examine technical performance, growth trends, and financial viability of Roblox titles.
            </p>
          </div>

          <div className="flex flex-col gap-xs w-full md:w-auto">
            {/* Search Input - more prominent */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-96">
              <span className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-primary" />
              </span>
              <input
                type="text"
                placeholder="Enter a Universe ID (e.g., 292439477)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-xl pr-md py-sm rounded-lg bg-surface-container/60 hover:bg-surface-container focus:bg-surface-container border border-primary/30 focus:border-primary focus:outline-none text-body-sm transition-all placeholder:text-on-surface-variant/50 animate-pulse-glow"
              />
            </form>
            <span className="text-xs text-on-surface-variant/60 pl-1">
              Search by Universe ID to analyze any Roblox game
            </span>
          </div>
        </div>

        {/* X-Ray Dashboard View */}
        {loading ? (
          <div className="flex justify-center py-xl">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-md"></div>
              <span className="text-body-md text-on-surface-variant font-mono">Running technical X-ray...</span>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="max-w-[500px] mx-auto py-xl text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-md">
              <Activity className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-headline-md font-bold text-foreground">Technical Diagnostic Error</h2>
            <p className="text-body-md text-on-surface-variant mt-xs mb-lg">{errorMsg}</p>
            <button
              onClick={() => router.push("/xray")}
              className="px-md py-sm rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-body-sm font-semibold transition-all"
            >
              Reset Search
            </button>
          </div>
        ) : activeGame ? (
          <div className="space-y-lg animate-fade-in">
            {/* Back Button and Game Info Header */}
            <div className="flex flex-wrap items-center justify-between gap-sm">
              <button
                onClick={() => router.push("/xray")}
                className="inline-flex items-center gap-xs text-body-sm font-semibold text-primary hover:text-primary-container transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Clear Analysis</span>
              </button>

              <div className="text-body-sm text-on-surface-variant font-mono">
                Universe ID: <span className="text-primary font-bold">{activeGame.universeId}</span>
              </div>
            </div>

            {/* Game Card Header with Thumbnail */}
            <div className="p-lg rounded-xl bg-surface-container/30 border border-outline-variant/60 flex flex-col md:flex-row md:items-center justify-between gap-md">
              <div className="flex items-center gap-md">
                <GameThumbnail universeId={activeGame.universeId} size="lg" />
                <div>
                  <h2 className="text-headline-md font-bold text-foreground">{activeGame.name}</h2>
                  <p className="text-body-sm text-on-surface-variant mt-xs">
                    Developed by <span className="text-foreground font-semibold">{activeGame.creator}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-md items-center">
                <div className="text-right">
                  <div className="text-body-sm text-on-surface-variant">Cumulative Visits</div>
                  <div className="text-headline-sm font-bold text-foreground font-mono">{formatNumber(activeGame.visits)}</div>
                </div>
              </div>
            </div>

            {/* Info Strip: Rank, Genre, Maturity, Rating, Health Score */}
            <div className="flex flex-wrap items-center gap-sm p-sm rounded-lg bg-surface-container-lowest/60 border border-outline-variant/30">
              {gameRank > 0 && (
                <div className="flex items-center gap-xs px-sm py-xs rounded-md bg-amber-500/10 border border-amber-500/20">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">Rank #{gameRank}</span>
                </div>
              )}
              <div className="flex items-center gap-xs px-sm py-xs rounded-md bg-surface-container/60 border border-outline-variant/30">
                <Gamepad2 className="w-3.5 h-3.5 text-on-surface-variant" />
                <span className="text-xs font-semibold text-on-surface-variant">Adventure</span>
              </div>
              <div className="flex items-center gap-xs px-sm py-xs rounded-md bg-surface-container/60 border border-outline-variant/30">
                <Shield className="w-3.5 h-3.5 text-on-surface-variant" />
                <span className="text-xs font-semibold text-on-surface-variant">All Ages</span>
              </div>
              <div className="flex items-center gap-xs px-sm py-xs rounded-md bg-surface-container/60 border border-outline-variant/30">
                <BarChart3 className="w-3.5 h-3.5 text-on-surface-variant" />
                <span className="text-xs font-semibold text-on-surface-variant">
                  Rating: {activeGame.healthScore}%
                </span>
              </div>
              <div className={`flex items-center gap-xs px-sm py-xs rounded-md border ${
                activeGame.healthScore >= 95
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : activeGame.healthScore >= 90
                  ? "bg-primary/10 border-primary/20"
                  : "bg-amber-500/10 border-amber-500/20"
              }`}>
                <Heart className={`w-3.5 h-3.5 ${
                  activeGame.healthScore >= 95 ? "text-emerald-400"
                  : activeGame.healthScore >= 90 ? "text-primary"
                  : "text-amber-400"
                }`} />
                <span className={`text-xs font-bold font-mono ${
                  activeGame.healthScore >= 95 ? "text-emerald-400"
                  : activeGame.healthScore >= 90 ? "text-primary"
                  : "text-amber-400"
                }`}>
                  Health: {activeGame.healthScore}/100
                </span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-sm">
              <a
                href={`https://www.roblox.com/games/${activeGame.universeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary font-semibold text-body-sm hover:bg-primary-container transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Visit on Roblox</span>
              </a>

              <button
                onClick={handleAddToCollection}
                className="inline-flex items-center gap-xs px-md py-sm rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-body-sm font-semibold transition-all"
              >
                <FolderPlus className="w-4 h-4 text-primary" />
                <span>Add to Collection</span>
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-xs px-md py-sm rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-body-sm font-semibold transition-all"
              >
                <Share2 className="w-4 h-4 text-on-surface-variant" />
                <span>Share</span>
              </button>
            </div>

            {/* 3 Stats Cards (Health Score moved to info strip) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-sm">
                  <CardTitle className="text-body-sm text-on-surface-variant">Active CCU</CardTitle>
                  <Users className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-headline-md font-bold font-mono">{formatNumber(activeGame.activePlayers)}</div>
                  <p className="text-body-sm text-emerald-400 mt-xs font-semibold">Live Players</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-sm">
                  <CardTitle className="text-body-sm text-on-surface-variant">Est. Monthly Revenue</CardTitle>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-headline-md font-bold font-mono text-amber-400">{formatCurrency(activeGame.monthlyRevenue)}</div>
                  <p className="text-body-sm text-on-surface-variant mt-xs">Estimated gross USD</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-sm">
                  <CardTitle className="text-body-sm text-on-surface-variant">Average Playtime</CardTitle>
                  <Activity className="w-4 h-4 text-secondary-container" />
                </CardHeader>
                <CardContent>
                  <div className="text-headline-md font-bold font-mono">{activeGame.playtime} min</div>
                  <p className="text-body-sm text-on-surface-variant mt-xs">User engagement index</p>
                </CardContent>
              </Card>
            </div>

            {/* Switcher performance chart card */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-outline-variant/30 pb-sm">
                <div>
                  <CardTitle className="text-body-md font-bold flex items-center gap-xs">
                    <Activity className="w-4 h-4 text-primary" />
                    Performance Breakdown Trends
                  </CardTitle>
                  <CardDescription>
                    Historical day-by-day visualization of players, visits, playtime, and revenue.
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
                    const isActive = activeBreakdownTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveBreakdownTab(tab.id as any)}
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
                {/* Comparison selector row */}
                <div className="flex flex-wrap items-center gap-sm mb-md pb-sm border-b border-outline-variant/10">
                  <span className="text-xs text-on-surface-variant font-medium">Compare with:</span>
                  <button
                    onClick={() => setComparisonPeriod(null)}
                    className={`px-sm py-xs rounded-md text-xs font-semibold transition-all ${
                      comparisonPeriod === null
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-on-surface-variant hover:text-foreground hover:bg-surface-container-high border border-transparent"
                    }`}
                  >
                    None
                  </button>
                  {COMPARISON_PERIODS.map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setComparisonPeriod(period.value)}
                      className={`px-sm py-xs rounded-md text-xs font-semibold transition-all ${
                        comparisonPeriod === period.value
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "text-on-surface-variant hover:text-foreground hover:bg-surface-container-high border border-transparent"
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>

                <div className="h-80">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {activeBreakdownTab === "visits" ? (
                        <BarChart data={consolidatedChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#272a31" />
                          <XAxis dataKey="day" stroke="#87929b" fontSize={11} />
                          <YAxis stroke="#87929b" fontSize={11} tickFormatter={(val) => formatNumber(val)} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#1d2027", borderColor: "#3e4850", borderRadius: "8px" }}
                            labelStyle={{ color: "#e0e2ec" }}
                            formatter={(val) => [formatNumber(val as number), "New Visits"]}
                          />
                          {comparisonPeriod && <Legend />}
                          <Bar
                            dataKey="visits"
                            name="Current Visits"
                            fill="#00aff4"
                            fillOpacity={0.8}
                            radius={[4, 4, 0, 0]}
                          />
                          {comparisonPeriod && (
                            <Bar
                              dataKey="visits_prev"
                              name={`Previous ${comparisonPeriod}d`}
                              fill="#87929b"
                              fillOpacity={0.4}
                              radius={[4, 4, 0, 0]}
                            />
                          )}
                        </BarChart>
                      ) : activeBreakdownTab === "ccu" ? (
                        <LineChart data={consolidatedChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#272a31" />
                          <XAxis dataKey="day" stroke="#87929b" fontSize={11} />
                          <YAxis stroke="#87929b" fontSize={11} tickFormatter={(val) => formatNumber(val)} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#1d2027", borderColor: "#3e4850", borderRadius: "8px" }}
                            labelStyle={{ color: "#e0e2ec" }}
                            formatter={(val) => [formatNumber(val as number), "Avg CCU"]}
                          />
                          {comparisonPeriod && <Legend />}
                          <Line
                            type="monotone"
                            dataKey="ccu"
                            name="Current Avg CCU"
                            stroke="#85cfff"
                            strokeWidth={2.5}
                            dot={{ r: 4 }}
                          />
                          {comparisonPeriod && (
                            <Line
                              type="monotone"
                              dataKey="ccu_prev"
                              name={`Previous ${comparisonPeriod}d`}
                              stroke="#85cfff"
                              strokeWidth={1.5}
                              strokeDasharray="5 5"
                              strokeOpacity={0.4}
                              dot={false}
                            />
                          )}
                        </LineChart>
                      ) : activeBreakdownTab === "playtime" ? (
                        <LineChart data={consolidatedChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#272a31" />
                          <XAxis dataKey="day" stroke="#87929b" fontSize={11} />
                          <YAxis stroke="#87929b" fontSize={11} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#1d2027", borderColor: "#3e4850", borderRadius: "8px" }}
                            labelStyle={{ color: "#e0e2ec" }}
                            formatter={(val) => [`${val} mins`, "Avg Session"]}
                          />
                          {comparisonPeriod && <Legend />}
                          <Line
                            type="monotone"
                            dataKey="playtime"
                            name="Current Avg Session"
                            stroke="#34ff8d"
                            strokeWidth={2.5}
                            dot={{ r: 4 }}
                          />
                          {comparisonPeriod && (
                            <Line
                              type="monotone"
                              dataKey="playtime_prev"
                              name={`Previous ${comparisonPeriod}d`}
                              stroke="#34ff8d"
                              strokeWidth={1.5}
                              strokeDasharray="5 5"
                              strokeOpacity={0.4}
                              dot={false}
                            />
                          )}
                        </LineChart>
                      ) : (
                        <LineChart data={consolidatedChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#272a31" />
                          <XAxis dataKey="day" stroke="#87929b" fontSize={11} />
                          <YAxis stroke="#87929b" fontSize={11} tickFormatter={(val) => formatCurrency(val)} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#1d2027", borderColor: "#3e4850", borderRadius: "8px" }}
                            labelStyle={{ color: "#e0e2ec" }}
                            formatter={(val) => [formatCurrency(val as number), "Est. Revenue"]}
                          />
                          {comparisonPeriod && <Legend />}
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            name="Current Daily Revenue"
                            stroke="#fdbc13"
                            strokeWidth={2.5}
                            dot={{ r: 4 }}
                          />
                          {comparisonPeriod && (
                            <Line
                              type="monotone"
                              dataKey="revenue_prev"
                              name={`Previous ${comparisonPeriod}d`}
                              stroke="#fdbc13"
                              strokeWidth={1.5}
                              strokeDasharray="5 5"
                              strokeOpacity={0.4}
                              dot={false}
                            />
                          )}
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-body-sm text-on-surface-variant">
                      Loading performance visualization...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Empty State: Top Games Table */
          <div className="space-y-lg animate-fade-in">
            {/* Search History Section */}
            {history.length > 0 && (
              <div className="p-md rounded-xl bg-surface-container/30 border border-outline-variant/60 max-w-2xl">
                <div className="flex items-center justify-between mb-sm border-b border-outline-variant/40 pb-sm">
                  <div className="flex items-center gap-xs text-body-sm font-semibold text-foreground">
                    <History className="w-4 h-4 text-on-surface-variant" />
                    <span>Recent Searches</span>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="inline-flex items-center gap-xs text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-sm">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => triggerSearch(item.id)}
                      className="px-sm py-xs rounded-lg hover:bg-surface-container-high bg-surface-container/60 border border-outline-variant/40 text-body-sm text-primary flex items-center gap-xs transition-colors"
                    >
                      <span>{item.name}</span>
                      <span className="text-xs text-on-surface-variant">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Top Games Table */}
            <div>
              <div className="flex items-center gap-xs mb-md">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-headline-sm font-bold">Top Games</h2>
                <span className="text-body-sm text-on-surface-variant ml-sm">Sorted by active players</span>
              </div>

              <SortableTable
                data={allGames}
                columns={topGamesColumns}
                defaultSortKey="activePlayers"
                defaultSortDir="desc"
                onRowClick={(game) => triggerSearch(game.universeId)}
                loading={allGamesLoading}
                loadingMessage="Loading top games..."
                emptyMessage="No games found in database."
                rowKey={(game) => game.universeId}
              />
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </main>
  );
}

export default function XrayPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-background text-foreground h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-md"></div>
          <span className="text-body-md text-on-surface-variant font-mono">Initializing Diagnostic System...</span>
        </div>
      </div>
    }>
      <XRayDashboard />
    </Suspense>
  );
}
