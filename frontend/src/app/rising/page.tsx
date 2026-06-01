"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Search, ArrowUpRight } from "lucide-react";
import GameThumbnail from "@/components/GameThumbnail";
import SortableTable, { ColumnDef } from "@/components/SortableTable";

interface RisingStarGame {
  universeId: string;
  name: string;
  creator: string;
  activePlayers: number;
  growth24h: number;
  monthlyRevenueEst: number;
  healthScore: number;
}

interface PaginatedResponse {
  content: RisingStarGame[];
  totalPages: number;
  totalElements: number;
  number: number; // current page (0-indexed)
  size: number;
}

export default function RisingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [games, setGames] = useState<RisingStarGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);
  const [sortKey, setSortKey] = useState("playing");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchGames = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage.toString(),
      size: pageSize.toString(),
      sort: sortKey,
      dir: sortDir,
    });

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }

    fetch(`/api/universes/rising?${params}`)
      .then((res) => res.json())
      .then((data: PaginatedResponse) => {
        if (data.content && Array.isArray(data.content)) {
          setGames(data.content);
          setTotalPages(data.totalPages);
          setTotalElements(data.totalElements);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading games:", err);
        setLoading(false);
      });
  }, [currentPage, pageSize, sortKey, sortDir, debouncedSearch]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat("en-US").format(val);
  };

  // Dynamic statistics — from current page data
  const topGaining = games.length > 0 
    ? [...games].sort((a, b) => b.growth24h - a.growth24h)[0]
    : null;

  // Table column definitions
  const columns: ColumnDef<RisingStarGame>[] = [
    {
      key: "thumbnail",
      label: "",
      width: "72px",
      render: (game) => (
        <GameThumbnail universeId={game.universeId} size="md" />
      ),
    },
    {
      key: "name",
      label: "Game Title",
      sortable: true,
      filterable: true,
      sortValue: (game) => game.name,
      render: (game) => (
        <div>
          <div className="font-semibold text-foreground hover:text-primary transition-colors">
            {game.name}
          </div>
          <div className="text-xs text-on-surface-variant mt-0.5">{game.creator}</div>
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
      render: (game) => (
        <span className="text-data-md font-mono">{formatNumber(game.activePlayers)}</span>
      ),
    },
    {
      key: "growth24h",
      label: "24h Growth",
      sortable: true,
      filterable: true,
      isNumeric: true,
      align: "right",
      sortValue: (game) => game.growth24h,
      render: (game) => (
        <span className={`font-mono font-semibold ${game.growth24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {game.growth24h >= 0 ? `+${game.growth24h}` : game.growth24h}%
        </span>
      ),
    },
    {
      key: "monthlyRevenueEst",
      label: "Est. Monthly Rev",
      sortable: true,
      filterable: true,
      isNumeric: true,
      align: "right",
      sortValue: (game) => game.monthlyRevenueEst,
      render: (game) => (
        <span className="text-data-md font-mono text-amber-400">
          {formatCurrency(game.monthlyRevenueEst)}
        </span>
      ),
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
        <span className={`inline-flex items-center px-sm py-xs rounded text-xs font-mono font-bold ${
          game.healthScore >= 95
            ? "bg-emerald-500/10 text-emerald-400"
            : game.healthScore >= 90
            ? "bg-primary/10 text-primary"
            : "bg-amber-500/10 text-amber-400"
        }`}>
          {Math.round(game.healthScore)}%
        </span>
      ),
    },

  ];

  const handleRowClick = (game: RisingStarGame) => {
    router.push(`/xray?universeId=${game.universeId}`);
  };

  return (
    <main className="relative flex-1 bg-background text-foreground py-xl px-gutter overflow-hidden">
      
      {/* Background Radial Glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container-max z-10 relative">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl">
          <div>
            <div className="flex items-center gap-xs text-primary mb-xs">
              <TrendingUp className="w-5 h-5" />
              <span className="text-label-caps font-semibold">Technical Trends</span>
            </div>
            <h1 className="text-headline-lg font-bold">Rising Stars</h1>
            <p className="text-body-md text-on-surface-variant mt-xs">
              Roblox games experiencing accelerated growth in player base and engagement.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-on-surface-variant" />
            </span>
            <input
              type="text"
              placeholder="Search by game name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-xl pr-md py-sm rounded-lg bg-surface-container/60 hover:bg-surface-container focus:bg-surface-container border border-outline-variant focus:border-primary focus:outline-none text-body-sm transition-all placeholder:text-on-surface-variant/60"
            />
          </div>
        </div>

        {/* Quick Stats - Top Gaining Game (horizontal card) */}
        <div className="mb-lg">
          <button
            onClick={() => topGaining && router.push(`/xray?universeId=${topGaining.universeId}`)}
            className={`inline-flex items-center gap-md p-md pr-lg rounded-xl bg-surface-container/40 border border-outline-variant/60 text-left transition-all duration-200 ${
              topGaining ? "hover:border-primary/40 hover:bg-surface-container/60 cursor-pointer group" : ""
            }`}
          >
            <div className="p-xs rounded bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors flex-shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            {topGaining && <GameThumbnail universeId={topGaining.universeId} size="md" />}
            <div className="flex items-center gap-lg min-w-0">
              <div className="min-w-0">
                <span className="text-xs text-on-surface-variant block mb-0.5">Top Gaining Game</span>
                <div className="text-headline-sm font-bold truncate group-hover:text-primary transition-colors">
                  {topGaining ? topGaining.name : "None"}
                </div>
              </div>
              <div className={`text-body-sm font-semibold font-mono flex-shrink-0 ${topGaining && topGaining.growth24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {topGaining ? (topGaining.growth24h >= 0 ? `+${topGaining.growth24h}%` : `${topGaining.growth24h}%`) : "0%"}
              </div>
              <span className="text-xs text-on-surface-variant/50 group-hover:text-primary/60 transition-colors flex-shrink-0 hidden sm:block">View X-Ray →</span>
            </div>
          </button>
        </div>

        {/* Interactive Data Table with Sorting + Pagination */}
        <SortableTable
          data={games}
          columns={columns}
          defaultSortKey="growth24h"
          defaultSortDir="desc"
          onRowClick={handleRowClick}
          loading={loading}
          loadingMessage="Loading rising stars..."
          emptyMessage={searchTerm ? `No rising stars found matching "${searchTerm}"` : "No games found."}
          rowKey={(game) => game.universeId}
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </div>
    </main>
  );
}
