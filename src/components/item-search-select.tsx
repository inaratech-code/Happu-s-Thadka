"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export type ItemSearchOption = {
  id: string;
  name: string;
  category?: string;
  unit?: string;
  meta?: string;
};

type Props = {
  items: ItemSearchOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
};

export function ItemSearchSelect({
  items,
  value,
  onChange,
  placeholder = "Search items…",
  emptyLabel = "No items match your search",
  className,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = items.find((item) => item.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = [item.name, item.category, item.unit, item.meta]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={open ? query : selected?.name ?? query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value.trim()) onChange("");
          }}
          onFocus={() => {
            setOpen(true);
            setQuery(selected?.name ?? "");
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">{emptyLabel}</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(item.id);
                  setQuery(item.name);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-[var(--nav-hover)]",
                  value === item.id && "bg-amber-500/10"
                )}
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {[item.category, item.unit, item.meta].filter(Boolean).join(" · ")}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
