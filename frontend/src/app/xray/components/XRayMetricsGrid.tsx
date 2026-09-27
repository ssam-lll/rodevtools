"use client";

import React from "react";
import { Users, DollarSign, Activity } from "lucide-react";
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
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Active Players
          </CardTitle>
          <Users className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-foreground">
            {formatNumber(game.activePlayers)}
          </div>
          <p className="text-xs text-emerald-400 mt-1 font-semibold">Current players online</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Est. Monthly Revenue
          </CardTitle>
          <DollarSign className="w-4 h-4 text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {formatCurrency(game.monthlyRevenue)}
          </div>
          <p className="text-xs text-on-surface-variant mt-1">Estimated gross (USD)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Avg. Session Time
          </CardTitle>
          <Activity className="w-4 h-4 text-secondary-container" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-foreground">
            {game.playtime || 20} min
          </div>
          <p className="text-xs text-on-surface-variant mt-1">Average visit duration</p>
        </CardContent>
      </Card>
    </div>
  );
}
