"use client";

import { memo } from "react";
import { PosMenuTile } from "@/components/pos/pos-menu-tile";
import type { MenuItem } from "@/lib/types";

type Props = {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
};

export const PosMenuGrid = memo(function PosMenuGrid({ items, onAdd }: Props) {
  return (
    <div className="pos-menu-grid min-w-0 max-w-full">
      {items.map((item, index) => (
        <PosMenuTile
          key={item.id}
          item={item}
          priority={index < 6}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
});
