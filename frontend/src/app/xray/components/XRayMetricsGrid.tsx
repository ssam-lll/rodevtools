"use client";

import React from "react";
import { Users, DollarSign, Heart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { XRayGameDetails } from "@/types/universe";

interface XRayMetricsGridProps {
  game: XRayGameDetails;
}

export function XRayMetricsGrid({ game }: XRayMetricsGridProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-muted font-mono">
            Active Players
          </CardTitle>
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Users className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
            {formatNumber(game.activePlayers)}
          </div>
          <p className="text-xs text-emerald-400 mt-1 font-semibold">Current players online</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-muted font-mono">
            Est. Monthly Revenue
          </CardTitle>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
            {formatCurrency(game.monthlyRevenue)}
          </div>
          <p className="text-xs text-on-surface-muted mt-1">Estimated gross (USD)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-muted font-mono">
            Approval Rating
          </CardTitle>
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Heart className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
            {Math.round(game.healthScore || 0)}%
          </div>
          <p className="text-xs text-on-surface-muted mt-1">Community upvote ratio</p>
        </CardContent>
      </Card>
    </div>
  );
}
