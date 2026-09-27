"use client";

import React from "react";
import { ArrowLeft, ExternalLink, FolderPlus, Share2, Star, Gamepad2, Shield, Heart } from "lucide-react";
import GameThumbnail from "@/components/GameThumbnail";
import type { XRayGameDetails } from "@/types/universe";

interface XRayOverviewHeaderProps {
  game: XRayGameDetails;
  gameRank: number;
  onBack: () => void;
  onAddToCollection: () => void;
  onShare: () => void;
}

export function XRayOverviewHeader({
  game,
  gameRank,
  onBack,
  onAddToCollection,
  onShare,
}: XRayOverviewHeaderProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-container transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        <div className="flex items-center gap-3 text-sm text-on-surface-variant font-mono">
          {game.rootPlaceId && (
            <div>
              Place ID: <span className="text-foreground font-bold">{game.rootPlaceId}</span>
            </div>
          )}
          <div>
            Universe ID: <span className="text-primary font-bold">{game.universeId}</span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-surface-container/30 border border-outline-variant/60 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <GameThumbnail universeId={game.universeId} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-foreground">{game.name}</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Developed by <span className="text-foreground font-semibold">{game.creator}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <div className="text-right">
            <div className="text-xs text-on-surface-variant uppercase font-mono">Total Visits</div>
            <div className="text-2xl font-bold text-foreground font-mono">{formatNumber(game.visits)}</div>
          </div>
        </div>
      </div>

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
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md border ${
            game.healthScore >= 95
              ? "bg-emerald-500/10 border-emerald-500/20"
              : game.healthScore >= 90
              ? "bg-primary/10 border-primary/20"
              : "bg-amber-500/10 border-amber-500/20"
          }`}
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              game.healthScore >= 95
                ? "text-emerald-400"
                : game.healthScore >= 90
                ? "text-primary"
                : "text-amber-400"
            }`}
          />
          <span
            className={`text-xs font-bold font-mono ${
              game.healthScore >= 95
                ? "text-emerald-400"
                : game.healthScore >= 90
                ? "text-primary"
                : "text-amber-400"
            }`}
          >
            Rating: {Math.round(game.healthScore)}%
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {game.rootPlaceId && (
          <a
            href={`https://www.roblox.com/games/${game.rootPlaceId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Visit on Roblox</span>
          </a>
        )}

        <button
          onClick={onAddToCollection}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs font-semibold transition-all cursor-pointer"
        >
          <FolderPlus className="w-4 h-4 text-primary" />
          <span>Add to Collection</span>
        </button>

        <button
          onClick={onShare}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs font-semibold transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-on-surface-variant" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}
