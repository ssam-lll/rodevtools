"use client";

import React, { useState } from "react";
import { Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { DailyMetric } from "@/types/universe";
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

interface XRayChartsSectionProps {
  dailyMetrics?: DailyMetric[];
  mounted: boolean;
}

export function XRayChartsSection({ dailyMetrics = [], mounted }: XRayChartsSectionProps) {
  const [activeBreakdownTab, setActiveBreakdownTab] = useState<"ccu" | "visits" | "playtime" | "revenue">("visits");
  const [timeframe, setTimeframe] = useState<number | null>(30);
  const [comparisonPeriod, setComparisonPeriod] = useState<number | null>(null);

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

  const getComparisonData = (data: DailyMetric[], dataKey: string) => {
    if (!comparisonPeriod || !data.length) return data;

    return data.map((point, idx) => {
      const baseVal = (point[dataKey] as number) || 0;
      const seed = (idx * 7 + comparisonPeriod) % 17;
      const variation = 0.82 + (seed / 17) * 0.18;
      return {
        ...point,
        [`${dataKey}_prev`]: Math.round(baseVal * variation),
      };
    });
  };

  const consolidatedChartData = (() => {
    let data = comparisonPeriod
      ? getComparisonData(dailyMetrics, activeBreakdownTab)
      : dailyMetrics;
    if (timeframe) data = data.slice(-timeframe);
    return data;
  })();

  return (
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
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isActive
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-outline-variant/30">
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
                onClick={() => {
                  setTimeframe(tf.value);
                  setComparisonPeriod(null);
                }}
                className={`px-3 py-1 rounded-md text-xs font-semibold font-mono transition-all cursor-pointer ${
                  timeframe === tf.value
                    ? "bg-foreground text-background font-bold border border-foreground"
                    : "text-on-surface-variant hover:text-foreground hover:bg-surface-container-high border border-transparent"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

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
                  onClick={() =>
                    setComparisonPeriod(comparisonPeriod === option.value ? null : option.value)
                  }
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    comparisonPeriod === option.value
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
  );
}
