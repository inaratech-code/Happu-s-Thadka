"use client";

import Link from "next/link";
import { motion } from "@/lib/motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";

export function KpiCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconBg,
  iconColor,
  sparkData,
  sparkStroke,
  sparkFill,
  className,
  featured = false,
  index = 0,
  href,
}: {
  label: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  sparkData?: number[];
  sparkStroke?: string;
  sparkFill?: string;
  className?: string;
  featured?: boolean;
  index?: number;
  href?: string;
}) {
  const changeColors = {
    up: "text-emerald-700 bg-emerald-500/15 dark:text-emerald-300 dark:bg-emerald-500/15 ring-1 ring-emerald-500/20",
    down: "text-red-700 bg-red-500/15 dark:text-red-300 dark:bg-red-500/15 ring-1 ring-red-500/20",
    neutral: "text-[var(--dash-text-secondary)] bg-[var(--dash-action-bg)] ring-1 ring-[var(--dash-border)]",
  };

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.05, duration: 0.45 }}
      whileHover={{ y: -4 }}
      className={cn(
        "dash-card dash-kpi rounded-2xl p-4 sm:p-5 block w-full min-w-0",
        href && "hover:border-amber-500/25 transition-colors cursor-pointer",
        featured && "dash-kpi-featured",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 relative z-[1]">
        <div className="min-w-0 flex-1">
          <p className="dash-section-title">{label}</p>
          <p
            className={cn(
              "mt-2 font-bold tracking-tight tabular-nums text-[var(--dash-text)]",
              featured ? "text-2xl sm:text-3xl lg:text-4xl" : "text-xl sm:text-2xl"
            )}
          >
            {value}
          </p>
          {change ? (
            <span
              className={cn(
                "inline-flex max-w-full mt-3 rounded-full px-2.5 py-1 text-xs font-semibold break-words text-left",
                changeColors[changeType]
              )}
            >
              {change}
            </span>
          ) : null}
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-2xl dash-icon-ring",
            featured ? "h-14 w-14" : "h-12 w-12"
          )}
        >
          <div className={cn("flex items-center justify-center rounded-xl", iconBg, featured ? "h-11 w-11" : "h-9 w-9")}>
            <Icon className={cn(featured ? "h-6 w-6" : "h-5 w-5", iconColor)} strokeWidth={2} />
          </div>
        </div>
      </div>
      {sparkData && sparkData.length > 0 ? (
        <div className="mt-5 pt-4 border-t border-[var(--dash-border)] relative z-[1]">
          <Sparkline data={sparkData} stroke={sparkStroke} fill={sparkFill} />
        </div>
      ) : null}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full min-w-0">
        {card}
      </Link>
    );
  }

  return card;
}
