"use client";

import { useMemo, useState } from "react";
import { motion } from "@/lib/motion";
import { Download, LineChart, TrendingUp } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { salesTrend } from "@/lib/dashboard-stats";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const RANGES = [
  { id: 7 as const, label: "7D" },
  { id: 30 as const, label: "30D" },
  { id: 90 as const, label: "90D" },
];

export function SalesTrendChart({
  transactions,
  onExport,
}: {
  transactions: Transaction[];
  onExport: () => void;
}) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const data = useMemo(() => salesTrend(transactions, range), [transactions, range]);
  const max = Math.max(...data.map((d) => d.amount), 1);

  const w = 600;
  const h = 200;
  const padX = 8;
  const padY = 12;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = padY + innerH - (d.amount / max) * innerH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? padX} ${h - padY} L ${padX} ${h - padY} Z`;

  const total = data.reduce((s, d) => s + d.amount, 0);
  const hasData = !data.every((d) => d.amount === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.45 }}
      className="dash-card rounded-2xl p-4 sm:p-5 h-full flex flex-col overflow-hidden"
    >
      <div className="dash-chart-header flex flex-col gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-amber-500/25">
            <LineChart className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-[var(--dash-text)]">Sales Overview</h3>
            <p className="text-xs sm:text-sm dash-text-secondary flex flex-wrap items-center gap-1.5 mt-0.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{formatCurrency(total)} in selected period</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full">
          <div className="dash-segment inline-flex flex-1 rounded-xl p-1 sm:flex-initial">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={cn(
                  "flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all",
                  range === r.id
                    ? "dash-segment-active"
                    : "dash-text-secondary hover:text-[var(--dash-text)]"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={onExport} className="shrink-0 h-9 px-2.5 sm:px-3">
            <Download className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-[220px] relative mt-2">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity="0" />
            </linearGradient>
            <filter id="lineGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {[0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1={padX}
              x2={w - padX}
              y1={padY + innerH * (1 - t)}
              y2={padY + innerH * (1 - t)}
              stroke="var(--dash-border)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          ))}
          {hasData && <path d={areaPath} fill="url(#salesFill)" />}
          {hasData && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--chart-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#lineGlow)"
            />
          )}
          {hasData &&
            points.map((p, i) =>
              i % Math.ceil(points.length / 6) === 0 || i === points.length - 1 ? (
                <circle
                  key={p.date}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="var(--chart-primary)"
                  stroke="var(--dash-card)"
                  strokeWidth="2.5"
                />
              ) : null
            )}
        </svg>
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <LineChart className="h-6 w-6 text-primary opacity-60" />
            </div>
            <p className="text-sm font-medium text-[var(--dash-text)]">No sales in this period yet</p>
            <p className="text-xs dash-text-secondary">Use POS or record a sale to see your trend</p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-3 text-[11px] font-medium dash-text-secondary tabular-nums">
        <span>{data[0]?.date.slice(5)}</span>
        <span className="text-primary">{range} day view</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </motion.div>
  );
}
