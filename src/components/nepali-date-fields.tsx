"use client";

import { useMemo, useState } from "react";
import NepaliDate from "nepali-date-converter";
import { Input, Select } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const BS_MONTHS = [
  "Baisakh",
  "Jestha",
  "Ashad",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
] as const;

type CalendarMode = "AD" | "BS";

function isoFromDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function adFromBs(year: number, monthIndex: number, day: number) {
  const nd = new NepaliDate(year, monthIndex, day);
  return isoFromDate(nd.toJsDate());
}

type Props = {
  value: string;
  onChange: (iso: string) => void;
  className?: string;
};

export function NepaliDateFields({ value, onChange, className }: Props) {
  const parsed = useMemo(() => {
    const base = value ? new Date(`${value}T12:00:00`) : new Date();
    const nd = NepaliDate.fromAD(base);
    return {
      ad: isoFromDate(base),
      bsYear: nd.getYear(),
      bsMonth: nd.getMonth(),
      bsDay: nd.getDate(),
      bsLabel: nd.format("DD MMMM YYYY"),
      adLabel: base.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
  }, [value]);

  const [mode, setMode] = useState<CalendarMode>("BS");

  const setFromAd = (iso: string) => {
    if (!iso) return;
    onChange(iso);
  };

  const setFromBs = (year: number, monthIndex: number, day: number) => {
    if (!year || !day) return;
    onChange(adFromBs(year, monthIndex, day));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 w-fit">
        {(["AD", "BS"] as const).map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setMode(label)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
              mode === label
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "AD" ? (
        <Input
          type="date"
          value={parsed.ad}
          onChange={(e) => setFromAd(e.target.value)}
        />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={2000}
            max={2100}
            value={parsed.bsYear}
            onChange={(e) =>
              setFromBs(Number(e.target.value), parsed.bsMonth, parsed.bsDay)
            }
            aria-label="BS year"
          />
          <Select
            value={String(parsed.bsMonth)}
            onChange={(e) =>
              setFromBs(parsed.bsYear, Number(e.target.value), parsed.bsDay)
            }
            className="w-full"
            aria-label="BS month"
          >
            {BS_MONTHS.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={32}
            value={parsed.bsDay}
            onChange={(e) =>
              setFromBs(parsed.bsYear, parsed.bsMonth, Number(e.target.value))
            }
            aria-label="BS day"
          />
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        AD {parsed.adLabel} · BS {parsed.bsDay} {BS_MONTHS[parsed.bsMonth]} {parsed.bsYear}
      </p>
    </div>
  );
}
