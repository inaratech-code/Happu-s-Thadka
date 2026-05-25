"use client";

import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "sellable" | "consumable";
  className?: string;
}) {
  const variants = {
    default: "bg-[var(--nav-hover)] text-muted-foreground border-[var(--border)]",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    sellable: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    consumable: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  className,
}: {
  label: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}) {
  const changeColors = {
    up: "text-emerald-400",
    down: "text-red-400",
    neutral: "text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("surface-card p-4 relative overflow-hidden", className)}
    >
      <div className="absolute inset-0 shimmer opacity-50" />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {icon ? <div className="text-amber-500/60">{icon}</div> : null}
        </div>
        <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        {change ? (
          <p className={cn("mt-1 text-xs", changeColors[changeType])}>{change}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-5">
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
      </motion.div>
      {actions ? (
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex w-full flex-col gap-2 mt-3 sm:mt-0 sm:w-auto sm:flex-row sm:items-center [&_button]:w-full sm:[&_button]:w-auto"
        >
          {actions}
        </motion.div>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus-ring focus:border-amber-500/30 transition-colors",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-foreground focus-ring focus:border-amber-500/30 transition-colors appearance-none",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
