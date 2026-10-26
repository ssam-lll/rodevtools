"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Activity,
  DollarSign,
  GitCompare,
  ArrowRight,
  ArrowUpRight,
  Users,
  Calculator,
  Sparkles,
  Database,
  Eye,
} from "lucide-react";
import GameThumbnail from "@/components/GameThumbnail";
import { XRaySearchBar } from "@/app/xray/components/XRaySearchBar";
import { universeService } from "@/services/universeService";
import type { RisingStarGame, MarketSummary } from "@/types/universe";

const DEVEX_RATE = 0.0035;
const TAX_RATE = 0.3;

export default function Home() {
  const router = useRouter();
  const [risingGames, setRisingGames] = useState<RisingStarGame[]>([]);
  const [loadingRising, setLoadingRising] = useState(true);
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [quickRobux, setQuickRobux] = useState<string>("100000");

  useEffect(() => {
    const controller = new AbortController();
    universeService
      .getRisingGames(
        { page: 0, size: 4, sort: "growth24h", dir: "desc" },
        controller.signal
      )
      .then((res) => {
        if (res?.content && Array.isArray(res.content)) {
          setRisingGames(res.content.slice(0, 4));
        }
        setLoadingRising(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setLoadingRising(false);
        }
      });

    universeService
      .getMarketSummary(controller.signal)
      .then((summary) => {
        setMarketSummary(summary);
        setLoadingSummary(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setLoadingSummary(false);
        }
      });

    return () => controller.abort();
  }, []);

  const formatNumber = (val: number) => new Intl.NumberFormat("en-US").format(val);
  const formatCompactNumber = (val: number) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(val);
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(val);
  const formatCompactCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(val);

  const formatInputNumber = (val: string) => {
    if (!val) return "";
    const clean = val.replace(/[^\d]/g, "");
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const robuxVal = parseFloat(quickRobux) || 0;
  const grossUsd = robuxVal * DEVEX_RATE;
  const taxUsd = grossUsd * TAX_RATE;
  const paypalFee = grossUsd > 0 ? Math.min(grossUsd * 0.02, 20) : 0;
  const netUsd = Math.max(0, grossUsd - taxUsd - paypalFee);

  const tools = [
    {
      title: "Rising Stars",
      badge: "24h Growth",
      description: "Find Roblox games with the biggest 24-hour jump in concurrent players.",
      href: "/rising",
      icon: TrendingUp,
      accent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Game X-Ray",
      badge: "Game Stats",
      description: "Check daily CCU, visits, approval ratings, and revenue estimates.",
      href: "/xray",
      icon: Activity,
      accent: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    },
    {
      title: "Game Comparer",
      badge: "Up to 3 Games",
      description: "Compare up to 3 games side by side and save custom collections.",
      href: "/compare",
      icon: GitCompare,
      accent: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    },
    {
      title: "DevEx & Tax",
      badge: "$0.0035 / R$",
      description: "Calculate DevEx payouts, PayPal/Tipalti fees, and the 30% marketplace tax.",
      href: "/devex",
      icon: DollarSign,
      accent: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  ];

  return (
    <main className="relative flex-1 bg-background text-foreground p-6 md:p-10 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[780px] h-[340px] rounded-full bg-gradient-to-b from-sky-500/[0.07] via-emerald-500/[0.03] to-transparent blur-3xl"
      />

      <div className="container-max relative z-10 space-y-8">
        <section className="pt-2 pb-4 border-b border-white/[0.06] flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-white/[0.08] text-xs font-mono text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DevEx rate $0.0035 / R$</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Roblox Game Analytics &amp; DevEx Calculator
            </h1>

            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Track concurrent player counts, compare games side by side, and calculate net USD payouts after fees.
            </p>
          </div>

          <div className="w-full lg:w-96 shrink-0">
            <XRaySearchBar
              onSearch={(id) => router.push(`/xray?universeId=${encodeURIComponent(String(id))}`)}
            />
          </div>
        </section>

        <section aria-label="Market overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl surface-card flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-on-surface-muted font-semibold">
                Tracked Games
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-foreground mt-1">
                {loadingSummary ? "..." : formatNumber(marketSummary?.totalTrackedGames ?? 0)}
              </div>
              <div className="text-xs text-on-surface-muted mt-0.5">
                In database
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl surface-card flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-on-surface-muted font-semibold">
                Players Online
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-foreground mt-1">
                {loadingSummary ? "..." : formatNumber(marketSummary?.totalActivePlayers ?? 0)}
              </div>
              <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                Current CCU
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl surface-card flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-on-surface-muted font-semibold">
                Total Visits
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-foreground mt-1">
                {loadingSummary ? "..." : formatCompactNumber(marketSummary?.totalVisits ?? 0)}
              </div>
              <div className="text-xs text-on-surface-muted mt-0.5">
                Avg rating {loadingSummary ? "..." : `${Math.round(marketSummary?.averageRating ?? 0)}%`}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl surface-card flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-on-surface-muted font-semibold">
                Est. Monthly Revenue
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-foreground mt-1">
                {loadingSummary
                  ? "..."
                  : formatCompactCurrency(marketSummary?.estimatedMarketMonthlyRevenueUsd ?? 0)}
              </div>
              <div className="text-xs text-amber-400 font-semibold mt-0.5">
                Across tracked games
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl surface-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground leading-none">
                      Breakout Games (24h Growth)
                    </h2>
                    <p className="text-xs text-on-surface-muted mt-1">
                      Fastest-growing Roblox experiences right now
                    </p>
                  </div>
                </div>

                <Link
                  href="/rising"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-foreground transition-colors"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loadingRising ? (
                <div className="space-y-2.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-xl bg-surface-container-high/50 border border-white/[0.04] animate-pulse"
                    />
                  ))}
                </div>
              ) : risingGames.length > 0 ? (
                <div className="divide-y divide-white/[0.05] -mx-2">
                  {risingGames.map((game, idx) => (
                    <button
                      key={game.universeId}
                      type="button"
                      onClick={() => router.push(`/xray?universeId=${game.universeId}`)}
                      className="w-full flex items-center justify-between gap-4 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 text-xs font-mono tabular-nums text-on-surface-muted font-semibold">
                          #{idx + 1}
                        </span>
                        <GameThumbnail universeId={game.universeId} size="sm" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground group-hover:text-white truncate transition-colors">
                            {game.name}
                          </div>
                          <div className="text-xs text-on-surface-muted truncate">
                            {game.creator}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs font-mono tabular-nums text-foreground font-semibold flex items-center justify-end gap-1">
                            <Users className="w-3 h-3 text-sky-400" />
                            <span>{formatNumber(game.activePlayers)}</span>
                          </div>
                          <div className="text-[11px] text-on-surface-muted font-mono">
                            Active CCU
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums font-bold ${
                            game.growth24h >= 0
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          {game.growth24h >= 0 ? `+${game.growth24h}%` : `${game.growth24h}%`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-on-surface-muted border border-dashed border-white/[0.08] rounded-xl">
                  Start backend service or open Rising Stars to inspect live game telemetry.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-on-surface-muted">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Click any game to launch full X-Ray telemetry
              </span>
              <span className="font-mono tabular-nums">Updated 24h window</span>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl surface-card p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground leading-none">
                      Instant DevEx Estimator
                    </h2>
                    <p className="text-xs text-on-surface-muted mt-1">
                      Preview Gross &amp; Net Take-Home USD
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono tabular-nums px-2 py-0.5 rounded bg-surface-container-high border border-white/[0.06] text-on-surface-variant">
                  $0.0035/R$
                </span>
              </div>

              <div>
                <label
                  htmlFor="home-quick-robux"
                  className="text-xs font-semibold uppercase tracking-wider text-on-surface-muted block mb-1.5 font-mono"
                >
                  Robux Balance
                </label>
                <div className="relative">
                  <input
                    id="home-quick-robux"
                    type="text"
                    value={formatInputNumber(quickRobux)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (raw === "" || !isNaN(Number(raw))) {
                        setQuickRobux(raw);
                      }
                    }}
                    placeholder="100,000"
                    className="w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-surface-container-high border border-white/[0.1] focus:border-primary/60 focus:outline-none text-base font-mono tabular-nums font-bold text-foreground transition-all"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-mono font-bold text-on-surface-muted pointer-events-none">
                    R$
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: "30K Min", value: 30000 },
                    { label: "100K", value: 100000 },
                    { label: "500K", value: 500000 },
                    { label: "1M", value: 1000000 },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setQuickRobux(String(preset.value))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums transition-all cursor-pointer border ${
                        robuxVal === preset.value
                          ? "bg-foreground text-background font-bold border-foreground"
                          : "bg-surface-container-high/60 hover:bg-surface-container-highest border-white/[0.06] text-on-surface-variant hover:text-foreground"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-surface-container-low/80 border border-white/[0.06]">
                  <span className="text-xs text-on-surface-muted block">Gross Payout</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-foreground mt-0.5 block">
                    {formatCurrency(grossUsd)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20">
                  <span className="text-xs text-emerald-400/90 block">Est. Net Take-Home</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-0.5 block">
                    {formatCurrency(netUsd)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-on-surface-muted">
                After 30% est. tax &amp; PayPal fee
              </span>
              <Link
                href="/devex"
                className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-emerald-400 transition-colors"
              >
                <span>Full Calculator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-on-surface-muted font-semibold">
              Workspace Modules
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group relative flex flex-col justify-between p-5 rounded-2xl surface-card hover:border-white/[0.18] hover:bg-surface-container-high/60 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${tool.accent} transition-transform group-hover:scale-105`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono tabular-nums px-2 py-0.5 rounded-md bg-surface-container-high border border-white/[0.06] text-on-surface-muted">
                        {tool.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground mb-1.5 group-hover:text-white transition-colors">
                      {tool.title}
                    </h3>

                    <p className="text-body-md text-on-surface-variant leading-relaxed mb-5">
                      {tool.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant group-hover:text-foreground pt-3 border-t border-white/[0.06] mt-auto transition-colors">
                    <span>Launch module</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
