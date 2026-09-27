"use client";

import React, { useState, useEffect } from "react";
import { History, Trash2, BarChart3, Search, X } from "lucide-react";
import GameThumbnail from "@/components/GameThumbnail";
import SortableTable, { ColumnDef } from "@/components/SortableTable";
import { universeService } from "@/services/universeService";
import type { ListGame, HistoryItem } from "@/types/universe";

interface XRayTopGamesTableProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onSelectGame: (universeId: string | number) => void;
}

export function XRayTopGamesTable({
  history,
  onClearHistory,
  onSelectGame,
}: XRayTopGamesTableProps) {
  const [topGamesSearch, setTopGamesSearch] = useState("");
  const [debouncedTopGamesSearch, setDebouncedTopGamesSearch] = useState("");
  const [allGames, setAllGames] = useState<ListGame[]>([]);
  const [allGamesLoading, setAllGamesLoading] = useState(true);
  const [topGamesPage, setTopGamesPage] = useState(0);
  const [topGamesTotalPages, setTopGamesTotalPages] = useState(1);
  const [topGamesTotalElements, setTopGamesTotalElements] = useState(0);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTopGamesSearch(topGamesSearch);
      setTopGamesPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [topGamesSearch]);

  useEffect(() => {
    const controller = new AbortController();
    setAllGamesLoading(true);

    universeService
      .getTopGames(
        {
          page: topGamesPage,
          size: 20,
          sort: "playing",
          dir: "desc",
          search: debouncedTopGamesSearch,
        },
        controller.signal
      )
      .then((data) => {
        setAllGames(data.content);
        setTopGamesTotalPages(data.totalPages);
        setTopGamesTotalElements(data.totalElements);
        setAllGamesLoading(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Error fetching games list:", err);
          setAllGamesLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [topGamesPage, debouncedTopGamesSearch]);

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
      render: (game) => (
        <span className="text-data-md font-mono">{formatNumber(game.activePlayers)}</span>
      ),
    },
    {
      key: "visits",
      label: "Total Visits",
      sortable: true,
      filterable: true,
      isNumeric: true,
      align: "right",
      sortValue: (game) => game.visits,
      render: (game) => (
        <span className="text-data-md font-mono">{formatNumber(game.visits)}</span>
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
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold ${
            game.healthScore >= 95
              ? "bg-emerald-500/10 text-emerald-400"
              : game.healthScore >= 90
              ? "bg-primary/10 text-primary"
              : "bg-amber-500/10 text-amber-400"
          }`}
        >
          {Math.round(game.healthScore)}%
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {history.length > 0 && (
        <div className="p-5 rounded-2xl bg-surface-container/40 border border-outline-variant/50 max-w-3xl shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <History className="w-4 h-4 text-primary" />
              <span>Recent Searches</span>
            </div>
            <button
              onClick={onClearHistory}
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
                onClick={() => onSelectGame(item.id)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-high/60 hover:bg-surface-container-high border border-outline-variant/40 hover:border-primary/40 text-xs text-primary font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <span>{item.name}</span>
                <span className="text-[10px] text-on-surface-variant">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Top Games</h2>
            <span className="text-xs text-on-surface-variant font-mono ml-2">
              Sorted by active players
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter top games by name..."
              value={topGamesSearch}
              onChange={(e) => setTopGamesSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-surface-container-high/70 border border-outline-variant/40 focus:border-primary focus:outline-none text-xs text-foreground placeholder:text-on-surface-variant/40 transition-colors"
            />
            {topGamesSearch && (
              <button
                type="button"
                onClick={() => setTopGamesSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <SortableTable
          data={allGames}
          columns={topGamesColumns}
          defaultSortKey="activePlayers"
          defaultSortDir="desc"
          onRowClick={(game) => onSelectGame(game.universeId)}
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
  );
}
