"use client";

import { cn } from "@/lib/utils";

export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-xs font-medium text-foreground">
        {label}
        {required ? <span className="text-amber-500 ml-0.5">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-red-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function QuickChips({
  values,
  onPick,
  format = (n) => (n > 0 ? `+${n}` : String(n)),
  className,
}: {
  values: readonly number[];
  onPick: (value: number) => void;
  format?: (value: number) => string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPick(value)}
          className="rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-2.5 py-1 text-xs font-medium tabular-nums text-foreground hover:bg-[var(--control-hover)] active:scale-95 transition-colors"
        >
          {format(value)}
        </button>
      ))}
    </div>
  );
}

export function PresetChips({
  presets,
  onPick,
  className,
}: {
  presets: readonly string[];
  onPick: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onPick(preset)}
          className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-amber-500/30 transition-colors"
        >
          {preset}
        </button>
      ))}
    </div>
  );
}
