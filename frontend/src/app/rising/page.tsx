"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight, Users, DollarSign } from "lucide-react";
import GameThumbnail from "@/components/GameThumbnail";
import SortableTable, { ColumnDef } from "@/components/SortableTable";
import type { RisingStarGame } from "@/types/universe";
import { universeService } from "@/services/universeService";

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
  const [sortKey, setSortKey] = useState("growth24h");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchGames = useCallback(() => {
    setLoading(true);
    const apiSort = sortKey === "activePlayers" ? "playing" : sortKey;

    universeService.getRisingGames({
      page: currentPage,
      size: pageSize,
      sort: apiSort,
      dir: sortDir,
      search: debouncedSearch,
    })
      .then((data) => {
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

  const topGaining = games.length > 0
    ? [...games].sort((a, b) => b.growth24h - a.growth24h)[0]
    : null;

  const columns: ColumnDef<RisingStarGame>[] = [
    {
      key: "rank",
      label: "#",
      width: "52px",
      align: "center",
      render: (_, index) => (
        <span className="text-xs font-mono tabular-nums text-on-surface-muted font-semibold">
          {currentPage * pageSize + index + 1}
        </span>
      ),
    },
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
        <span className="text-data-md font-mono tabular-nums">{formatNumber(game.activePlayers)}</span>
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
        <span className={`font-mono tabular-nums font-semibold ${game.growth24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
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
        <span className="text-data-md font-mono tabular-nums text-foreground font-semibold">
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
        <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-mono tabular-nums font-bold ${game.healthScore >= 95
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
    <main className="relative flex-1 bg-background text-foreground p-6 md:p-8">
      <div className="container-max z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/[0.06] pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Rising Stars</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Roblox games with the highest player growth over the last 24 hours.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-on-surface-variant" />
            </span>
            <input
              type="text"
              placeholder="Search by game name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-high border border-white/[0.1] focus:border-zinc-500 focus:outline-none text-sm transition-all placeholder:text-on-surface-muted"
            />
          </div>
        </div>

        {topGaining && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.push(`/xray?universeId=${topGaining.universeId}`)}
              className="w-full sm:w-auto inline-flex flex-wrap items-center justify-between gap-6 p-4 pr-6 rounded-2xl surface-card hover:border-white/[0.18] hover:bg-surface-container-high/50 text-left transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <GameThumbnail universeId={topGaining.universeId} size="md" />
                <div className="min-w-0">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold block mb-0.5">
                    #1 Top Breakout (24h)
                  </span>
                  <div className="text-base font-bold text-foreground truncate group-hover:text-white transition-colors">
                    {topGaining.name}
                  </div>
                  <div className="text-xs text-on-surface-muted truncate">
                    by {topGaining.creator}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0 border-t sm:border-t-0 sm:border-l border-white/[0.06] pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-between sm:justify-end">
                <div>
                  <span className="text-[11px] text-on-surface-muted font-mono block">24h Velocity</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">
                    +{topGaining.growth24h}%
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-on-surface-muted font-mono flex items-center gap-1">
                    <Users className="w-3 h-3 text-sky-400" /> CCU
                  </span>
                  <span className="text-sm font-bold font-mono tabular-nums text-foreground">
                    {formatNumber(topGaining.activePlayers)}
                  </span>
                </div>
                <div className="hidden md:block">
                  <span className="text-[11px] text-on-surface-muted font-mono flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-amber-400" /> Est. Rev
                  </span>
                  <span className="text-sm font-bold font-mono tabular-nums text-foreground">
                    {formatCurrency(topGaining.monthlyRevenueEst)}
                  </span>
                </div>
                <span className="text-xs text-on-surface-muted group-hover:text-foreground transition-colors hidden sm:block">
                  View details →
                </span>
              </div>
            </button>
          </div>
        )}

        <SortableTable
          data={games}
          columns={columns}
          defaultSortKey="growth24h"
          defaultSortDir="desc"
          onSortChange={(key, dir) => {
            setSortKey(key);
            setSortDir(dir);
            setCurrentPage(0);
          }}
          onRowClick={handleRowClick}
          loading={loading}
          loadingMessage="Loading games..."
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
