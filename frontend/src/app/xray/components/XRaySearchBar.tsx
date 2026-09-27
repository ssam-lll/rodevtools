"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import GameThumbnail from "@/components/GameThumbnail";
import { universeService } from "@/services/universeService";
import type { ListGame } from "@/types/universe";

interface XRaySearchBarProps {
  onSearch: (universeId: string | number) => void;
  onToastMessage?: (msg: string) => void;
}

export function XRaySearchBar({ onSearch, onToastMessage }: XRaySearchBarProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<ListGame[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchSuggestions([]);
      setIsSearchingSuggestions(false);
      return;
    }

    if (/^\d+$/.test(trimmed) || trimmed.includes("roblox.com")) {
      setSearchSuggestions([]);
      setIsSearchingSuggestions(false);
      return;
    }

    setIsSearchingSuggestions(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      universeService
        .searchUniverses(trimmed, 6, controller.signal)
        .then((games) => {
          setSearchSuggestions(games);
          setIsSearchingSuggestions(false);
          setShowSuggestions(true);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") {
            setSearchSuggestions([]);
            setIsSearchingSuggestions(false);
          }
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchInput]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const extractPlaceIdFromUrl = (url: string): string | null => {
    const match = url.match(/(?:games[/=]|placeId=)(\d+)/);
    return match ? match[1] : null;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;

    setShowSuggestions(false);

    const extractedPlaceId = extractPlaceIdFromUrl(trimmed);
    if (extractedPlaceId) {
      triggerSearch(extractedPlaceId);
      return;
    }

    if (trimmed.includes("roblox.com") || /^https?:\/\//i.test(trimmed)) {
      onToastMessage?.("Please enter a valid Roblox game URL (e.g. roblox.com/games/...)");
      return;
    }

    if (searchSuggestions.length > 0) {
      const exactMatch = searchSuggestions.find(
        (g) => g.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (exactMatch) {
        triggerSearch(exactMatch.universeId);
        return;
      }
      if (!/^\d+$/.test(trimmed)) {
        triggerSearch(searchSuggestions[0].universeId);
        return;
      }
    }

    triggerSearch(trimmed);
  };

  const triggerSearch = (id: string | number) => {
    onSearch(id);
    setSearchInput("");
    setShowSuggestions(false);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div ref={searchContainerRef} className="relative flex flex-col gap-1.5 w-full md:w-96">
      <form onSubmit={handleSearchSubmit} className="relative flex-1">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-primary" />
        </span>
        <input
          type="text"
          placeholder="Search game name, Place ID, URL..."
          value={searchInput}
          onFocus={() => {
            if (searchSuggestions.length > 0) setShowSuggestions(true);
          }}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-surface-container/60 hover:bg-surface-container focus:bg-surface-container border border-primary/30 focus:border-primary focus:outline-none text-sm transition-all placeholder:text-on-surface-variant/50"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setSearchSuggestions([]);
              setShowSuggestions(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>
      <span className="text-[11px] text-on-surface-variant/60 pl-1 truncate">
        Search by name, Universe ID, Place ID, or paste Roblox link
      </span>

      {showSuggestions && (searchSuggestions.length > 0 || isSearchingSuggestions) && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl bg-surface-container-highest border border-outline-variant/60 shadow-xl overflow-hidden animate-fade-in">
          {isSearchingSuggestions && searchSuggestions.length === 0 ? (
            <div className="p-3 text-xs text-on-surface-variant text-center">Searching games...</div>
          ) : (
            <div className="divide-y divide-outline-variant/20 max-h-72 overflow-y-auto">
              {searchSuggestions.map((game) => (
                <button
                  key={game.universeId}
                  type="button"
                  onClick={() => triggerSearch(game.universeId)}
                  className="w-full text-left px-3 py-2.5 hover:bg-surface-container flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <GameThumbnail universeId={String(game.universeId)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground group-hover:text-primary truncate transition-colors">
                      {game.name}
                    </div>
                    <div className="text-[11px] text-on-surface-variant truncate">
                      {game.creator}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-mono font-medium text-primary">
                      {formatNumber(game.activePlayers)} CCU
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
