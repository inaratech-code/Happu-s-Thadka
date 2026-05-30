"use client";

import { memo, useCallback } from "react";
import { MenuItemThumb } from "@/components/menu-item-thumb";
import type { MenuItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type Props = {
  item: MenuItem;
  priority?: boolean;
  onAdd: (item: MenuItem) => void;
};

export const PosMenuTile = memo(function PosMenuTile({ item, priority, onAdd }: Props) {
  const handleClick = useCallback(() => onAdd(item), [item, onAdd]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="surface-card-interactive pos-menu-tile text-left p-2 sm:p-3 min-w-0 w-full h-auto block active:scale-[0.98] transition-transform"
    >
      <MenuItemThumb
        name={item.name}
        emoji={item.emoji}
        imageUrl={item.imageUrl}
        categoryImageUrl={item.categoryImageUrl}
        className="mb-1.5 sm:mb-2 w-full"
        priority={priority}
        loading={priority ? "eager" : "lazy"}
      />
      <p className="text-xs sm:text-sm font-medium leading-tight text-foreground line-clamp-2">
        {item.name}
      </p>
      <p className="text-[11px] sm:text-xs text-price tabular-nums mt-0.5 sm:mt-1 font-semibold">
        {formatCurrency(item.price)}
      </p>
    </button>
  );
});
