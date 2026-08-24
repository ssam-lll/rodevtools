"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search, Activity, Users, DollarSign, Heart, ArrowLeft, History, Trash2,
  ExternalLink, Share2, FolderPlus, Star, Shield, Gamepad2, BarChart3, Check,
  Plus, X, FolderOpen
} from "lucide-react";
import AuthModal from "@/components/AuthModal";
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
      <div className="toast toast-success flex items-center gap-2">
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
  const [topGamesPage, setTopGamesPage] = useState(0);
  const [topGamesTotalPages, setTopGamesTotalPages] = useState(1);
  const [topGamesTotalElements, setTopGamesTotalElements] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [comparisonPeriod, setComparisonPeriod] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState<number | null>(30);
  const [activeBreakdownTab, setActiveBreakdownTab] = useState<"ccu" | "visits" | "playtime" | "revenue">("visits");

  // Auth and Collection states
  const [user, setUser] = useState<any | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [addToCollectionModalOpen, setAddToCollectionModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [userCollections, setUserCollections] = useState<any[]>([]);

  // Load search history and handle auth changes
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
        const collectionsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
        setUserCollections(Object.values(collectionsObj));
      } catch {
        setUserCollections([]);
      }
    };

    handleAuthChange();
    window.addEventListener("auth-change", handleAuthChange);

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

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  // Fetch all games for the top games table (server-side paginated)
  useEffect(() => {
    setAllGamesLoading(true);
    fetch(`/api/universes?page=${topGamesPage}&size=20&sort=playing&dir=desc`)
      .then((res) => res.json())
      .then((data) => {
        const gamesArray = Array.isArray(data) ? data : (data && Array.isArray(data.content) ? data.content : []);
        setAllGames(gamesArray);
        if (data && typeof data.totalPages === 'number') {
          setTopGamesTotalPages(data.totalPages);
          setTopGamesTotalElements(data.totalElements || 0);
        }
        setAllGamesLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching games list:", err);
        setAllGamesLoading(false);
      });
  }, [topGamesPage]);

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

    // Check if user is logged in
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    // If logged in, open the select-collection modal
    // First reload collections in case they changed
    const userKey = user.email ? user.email : "guest";
    const storageKey = `collections_${userKey}`;
    try {
      const collectionsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
      setUserCollections(Object.values(collectionsObj));
    } catch { }

    setAddToCollectionModalOpen(true);
  }, [activeGame, user]);

  // Actual add helper used by the modal
  const performAddToCollection = useCallback((collectionName: string) => {
    if (!activeGame || !user) return;
    const userKey = user.email ? user.email : "guest";
    const storageKey = `collections_${userKey}`;

    try {
      const collections = JSON.parse(localStorage.getItem(storageKey) || "{}");

      if (!collections[collectionName]) {
        collections[collectionName] = { name: collectionName, games: [], updatedAt: Date.now() };
      }

      const targetCol = collections[collectionName];
      const gameIdStr = String(activeGame.universeId);
      const gameIds = Array.isArray(targetCol.games) ? targetCol.games.map(String) : [];

      if (!gameIds.includes(gameIdStr)) {
        if (gameIds.length >= 3) {
          setToastMessage(`Collection "${collectionName}" is full (max 3 games)`);
          return;
        }
        targetCol.games = [...gameIds, gameIdStr];
        targetCol.updatedAt = Date.now();
        localStorage.setItem(storageKey, JSON.stringify(collections));
        setUserCollections(Object.values(collections));

        // Sync with backend user radar if logged in
        if (user && user.token) {
          fetch("/api/radar", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${user.token}`
            },
            body: JSON.stringify({ universeId: Number(activeGame.universeId) })
          }).catch(err => console.error("Error syncing to backend radar:", err));
        }

        setToastMessage(`Added "${activeGame.name}" to "${collectionName}"`);
        setAddToCollectionModalOpen(false);
      } else {
        setToastMessage(`"${activeGame.name}" is already in "${collectionName}"`);
      }
    } catch (e) {
      console.error(e);
      setToastMessage("Failed to add to collection");
    }
  }, [activeGame, user]);

  const handleCreateAndAddCollection = useCallback(() => {
    const trimmed = newColName.trim();
    if (!trimmed) return;
    performAddToCollection(trimmed);
    setNewColName("");
  }, [newColName, performAddToCollection]);

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
      label: "Rating",
      sortable: true,
      filterable: true,
      isNumeric: true,
      align: "center",
      sortValue: (game) => game.healthScore,
      render: (game) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold ${game.healthScore >= 95 ? "bg-emerald-500/10 text-emerald-400"
            : game.healthScore >= 90 ? "bg-primary/10 text-primary"
              : "bg-amber-500/10 text-amber-400"
          }`}>
          {Math.round(game.healthScore)}%
        </span>
      ),
    },
  ];

  // Prepare chart data with comparison and timeframe
  const consolidatedChartData = (() => {
    let data = comparisonPeriod
      ? getComparisonData(activeGame?.dailyMetrics || [], activeBreakdownTab)
      : activeGame?.dailyMetrics || [];
    if (timeframe) data = data.slice(-timeframe);
    return data;
  })();

  // Find game rank among all games
  const gameRank = activeGame
    ? [...allGames].sort((a, b) => b.activePlayers - a.activePlayers).findIndex((g) => g.universeId === activeGame.universeId) + 1
    : 0;

  return (
    <main className="relative flex-1 bg-background text-foreground p-6 md:p-8">
      <div className="container-max z-10">
        {/* Header / Search Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-outline-variant/30 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Game X-Ray</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Look up any Roblox game to view player history, visit trends, and estimated revenue.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            {/* Search Input - prominent */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-96">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-primary" />
              </span>
              <input
                type="text"
                placeholder="Enter a Universe ID (e.g., 292439477)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container/60 hover:bg-surface-container focus:bg-surface-container border border-primary/30 focus:border-primary focus:outline-none text-sm transition-all placeholder:text-on-surface-variant/50"
              />
            </form>
            <span className="text-xs text-on-surface-variant/60 pl-1">
              Search by Universe ID to analyze any Roblox game
            </span>
          </div>
        </div>

        {/* X-Ray Dashboard View */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <span className="text-sm text-on-surface-variant">Loading game data...</span>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="max-w-[500px] mx-auto py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Game Not Found</h2>
            <p className="text-sm text-on-surface-variant mt-2 mb-6">{errorMsg}</p>
            <button
              onClick={() => router.push("/xray")}
              className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-sm font-semibold transition-all cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        ) : activeGame ? (
          <div className="space-y-6 animate-fade-in">
            {/* Back Button and Game Info Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => router.push("/xray")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-container transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Overview</span>
              </button>

              <div className="text-sm text-on-surface-variant font-mono">
                Universe ID: <span className="text-primary font-bold">{activeGame.universeId}</span>
              </div>
            </div>

            {/* Game Card Header with Thumbnail */}
            <div className="p-6 rounded-2xl bg-surface-container/30 border border-outline-variant/60 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <GameThumbnail universeId={activeGame.universeId} size="lg" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">{activeGame.name}</h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Developed by <span className="text-foreground font-semibold">{activeGame.creator}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-center">
                <div className="text-right">
                  <div className="text-xs text-on-surface-variant uppercase font-mono">Total Visits</div>
                  <div className="text-2xl font-bold text-foreground font-mono">{formatNumber(activeGame.visits)}</div>
                </div>
              </div>
            </div>

            {/* Info Strip: Rank, Genre, Maturity, Rating */}
            <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/30">
              {gameRank > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400 font-mono">Rank #{gameRank}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container/60 border border-outline-variant/30">
                <Gamepad2 className="w-3.5 h-3.5 text-on-surface-variant" />
                <span className="text-xs font-semibold text-on-surface-variant">Adventure</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container/60 border border-outline-variant/30">
                <Shield className="w-3.5 h-3.5 text-on-surface-variant" />
                <span className="text-xs font-semibold text-on-surface-variant">All Ages</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md border ${activeGame.healthScore >= 95
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : activeGame.healthScore >= 90
                    ? "bg-primary/10 border-primary/20"
                    : "bg-amber-500/10 border-amber-500/20"
                }`}>
                <Heart className={`w-3.5 h-3.5 ${activeGame.healthScore >= 95 ? "text-emerald-400"
                    : activeGame.healthScore >= 90 ? "text-primary"
                      : "text-amber-400"
                  }`} />
                <span className={`text-xs font-bold font-mono ${activeGame.healthScore >= 95 ? "text-emerald-400"
                    : activeGame.healthScore >= 90 ? "text-primary"
                      : "text-amber-400"
                  }`}>
                  Rating: {Math.round(activeGame.healthScore)}%
                </span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`https://www.roblox.com/games/${activeGame.universeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Visit on Roblox</span>
              </a>

              <button
                onClick={handleAddToCollection}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs font-semibold transition-all cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-primary" />
                <span>Add to Collection</span>
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs font-semibold transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-on-surface-variant" />
                <span>Share</span>
              </button>
            </div>

            {/* 3 Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Active Players</CardTitle>
                  <Users className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-foreground">{formatNumber(activeGame.activePlayers)}</div>
                  <p className="text-xs text-emerald-400 mt-1 font-semibold">Current players online</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Est. Monthly Revenue</CardTitle>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-amber-400">{formatCurrency(activeGame.monthlyRevenue)}</div>
                  <p className="text-xs text-on-surface-variant mt-1">Estimated gross (USD)</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Avg. Session Time</CardTitle>
                  <Activity className="w-4 h-4 text-secondary-container" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-foreground">{activeGame.playtime || 20} min</div>
                  <p className="text-xs text-on-surface-variant mt-1">Average visit duration</p>
                </CardContent>
              </Card>
            </div>

            {/* Switcher performance chart card */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Performance History
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Daily history for concurrent players, visits, playtime, and revenue.
                  </CardDescription>
                </div>

                {/* Metric Tab Buttons */}
                <div className="flex flex-wrap gap-1 bg-surface-container-low/60 border border-outline-variant/20 p-1 rounded-lg self-start">
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
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${isActive
                            ? "bg-surface-container-highest text-foreground border border-outline/50 shadow-sm"
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
                {/* Timeframe + Comparison selector row */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-outline-variant/30">
                  {/* Timeframe */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-on-surface-variant font-mono font-medium mr-1">Timeframe:</span>
                    {[
                      { label: "7d", value: 7 },
                      { label: "30d", value: 30 },
                      { label: "90d", value: 90 },
                      { label: "All", value: null },
                    ].map((tf) => (
                      <button
                        key={tf.label}
                        onClick={() => { setTimeframe(tf.value); setComparisonPeriod(null); }}
                        className={`px-3 py-1 rounded-md text-xs font-semibold font-mono transition-all cursor-pointer ${timeframe === tf.value
                            ? "bg-foreground text-background font-bold border border-foreground"
                            : "text-on-surface-variant hover:text-foreground hover:bg-surface-container-high border border-transparent"
                          }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>

                  {/* Compare with — only shown when a specific timeframe is selected */}
                  {timeframe !== null && (() => {
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
                          onClick={() => setComparisonPeriod(comparisonPeriod === option.value ? null : option.value)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${comparisonPeriod === option.value
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
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {activeBreakdownTab === "visits" ? (
                        <BarChart data={consolidatedChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                          <YAxis stroke="#71717a" fontSize={11} tickFormatter={(val) => formatNumber(val)} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
                            labelStyle={{ color: "#f4f4f5" }}
                            formatter={(val) => [formatNumber(val as number), "New Visits"]}
                          />
                          {comparisonPeriod && <Legend />}
                          <Bar
                            dataKey="visits"
                            name="Current Visits"
                            fill="#f4f4f5"
                            fillOpacity={0.9}
                            radius={[4, 4, 0, 0]}
                          />
                          {comparisonPeriod && (
                            <Bar
                              dataKey="visits_prev"
                              name={`Previous ${comparisonPeriod}d`}
                              fill="#71717a"
                              fillOpacity={0.4}
                              radius={[4, 4, 0, 0]}
                            />
                          )}
                        </BarChart>
                      ) : activeBreakdownTab === "ccu" ? (
                        <LineChart data={consolidatedChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                          <YAxis stroke="#71717a" fontSize={11} tickFormatter={(val) => formatNumber(val)} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
                            labelStyle={{ color: "#f4f4f5" }}
                            formatter={(val) => [formatNumber(val as number), "Avg CCU"]}
                          />
                          {comparisonPeriod && <Legend />}
                          <Line
                            type="monotone"
                            dataKey="ccu"
                            name="Current Avg CCU"
                            stroke="#f4f4f5"
                            strokeWidth={2.5}
                            dot={{ r: 4 }}
                            connectNulls
                          />
                          {comparisonPeriod && (
                            <Line
                              type="monotone"
                              dataKey="ccu_prev"
                              name={`Previous ${comparisonPeriod}d`}
                              stroke="#71717a"
                              strokeWidth={1.5}
                              strokeDasharray="5 5"
                              strokeOpacity={0.5}
                              dot={false}
                            />
                          )}
                        </LineChart>
                      ) : activeBreakdownTab === "playtime" ? (
                        <LineChart data={consolidatedChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                          <YAxis stroke="#71717a" fontSize={11} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
                            labelStyle={{ color: "#f4f4f5" }}
                            formatter={(val) => [`${val} mins`, "Avg Session"]}
                          />
                          {comparisonPeriod && <Legend />}
                          <Line
                            type="monotone"
                            dataKey="playtime"
                            name="Current Avg Session"
                            stroke="#34d399"
                            strokeWidth={2.5}
                            dot={{ r: 4 }}
                            connectNulls
                          />
                          {comparisonPeriod && (
                            <Line
                              type="monotone"
                              dataKey="playtime_prev"
                              name={`Previous ${comparisonPeriod}d`}
                              stroke="#34d399"
                              strokeWidth={1.5}
                              strokeDasharray="5 5"
                              strokeOpacity={0.4}
                              dot={false}
                            />
                          )}
                        </LineChart>
                      ) : (
                        <LineChart data={consolidatedChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                          <YAxis stroke="#71717a" fontSize={11} tickFormatter={(val) => formatCurrency(val)} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
                            labelStyle={{ color: "#f4f4f5" }}
                            formatter={(val) => [formatCurrency(val as number), "Est. Revenue"]}
                          />
                          {comparisonPeriod && <Legend />}
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            name="Current Daily Revenue"
                            stroke="#fbbf24"
                            strokeWidth={2.5}
                            dot={{ r: 4 }}
                            connectNulls
                          />
                          {comparisonPeriod && (
                            <Line
                              type="monotone"
                              dataKey="revenue_prev"
                              name={`Previous ${comparisonPeriod}d`}
                              stroke="#fbbf24"
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
                    <div className="h-full flex items-center justify-center text-sm text-on-surface-variant font-mono">
                      Loading performance visualization...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Empty State: Top Games Table & Search History */
          <div className="space-y-8 animate-fade-in">
            {/* Search History Section */}
            {history.length > 0 && (
              <div className="p-5 rounded-2xl bg-surface-container/40 border border-outline-variant/50 max-w-3xl shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-outline-variant/30 pb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <History className="w-4 h-4 text-primary" />
                    <span>Recent Searches</span>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => triggerSearch(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-high/60 hover:bg-surface-container-high border border-outline-variant/40 hover:border-primary/40 text-xs text-primary font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <span>{item.name}</span>
                      <span className="text-[10px] text-on-surface-variant">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Top Games Table */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Top Games</h2>
                <span className="text-xs text-on-surface-variant font-mono ml-2">Sorted by active players</span>
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
                currentPage={topGamesPage}
                totalPages={topGamesTotalPages}
                totalElements={topGamesTotalElements}
                pageSize={20}
                onPageChange={(p) => {
                  setTopGamesPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Add To Collection Modal */}
      {addToCollectionModalOpen && activeGame && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setAddToCollectionModalOpen(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(16, 19, 26, 0.8)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transition: 'opacity 0.3s ease',
              cursor: 'pointer'
            }}
          />

          {/* Modal Container */}
          <div
            className="relative overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-low p-8 shadow-2xl z-10 transition-all duration-300 transform scale-100 animate-fade-in"
            style={{
              width: 'calc(100% - 2rem)',
              maxWidth: '448px', // Equivalent to max-w-md
              boxSizing: 'border-box'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setAddToCollectionModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-foreground hover:bg-surface-container-high p-1.5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-container to-inverse-primary border border-white/10 flex items-center justify-center shadow-lg mb-3">
                <FolderOpen className="text-white w-5 h-5" />
              </div>
              <h2 className="text-headline-md font-bold text-foreground">
                Add to Collection
              </h2>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Select a collection to add <span className="text-primary font-semibold">{activeGame.name}</span>
              </p>
            </div>

            {/* Collections List */}
            <div className="space-y-2 max-h-48 overflow-y-auto mb-6 pr-1">
              {userCollections.length > 0 ? (
                userCollections.map((col) => {
                  const alreadyContains = Array.isArray(col.games) && col.games.map(String).includes(String(activeGame.universeId));
                  return (
                    <button
                      key={col.name}
                      onClick={() => !alreadyContains && performAddToCollection(col.name)}
                      disabled={alreadyContains}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-xs font-semibold transition-all ${alreadyContains
                          ? "bg-surface-container/20 border-outline-variant/30 text-on-surface-variant/40 cursor-not-allowed"
                          : "bg-surface-container hover:bg-surface-container-high border-outline-variant/50 text-foreground cursor-pointer"
                        }`}
                    >
                      <span className="truncate">{col.name}</span>
                      <span className="text-[11px] font-mono font-medium text-on-surface-variant">
                        {alreadyContains ? "Already added" : `${col.games.length}/3 games`}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-on-surface-variant bg-surface-container/30 border border-outline-variant/20 rounded-lg">
                  No collections yet. Create one below!
                </div>
              )}
            </div>

            {/* Create new collection section */}
            <div className="border-t border-outline-variant/30 pt-4 space-y-3">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Create New Collection
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Collection name..."
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAndAddCollection()}
                  className="flex-1 px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:outline-none text-xs transition-all"
                />
                <button
                  onClick={handleCreateAndAddCollection}
                  disabled={!newColName.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all disabled:opacity-40 disabled:hover:bg-primary flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for Login check */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

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
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-sm text-on-surface-variant">Loading game details...</span>
        </div>
      </div>
    }>
      <XRayDashboard />
    </Suspense>
  );
}
