"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Package, Plus, Search, ShoppingCart } from "lucide-react";
import { PageHeader, Badge, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function StockMovementPage() {
  const { state } = useStore();
  const [search, setSearch] = useState("");

  const movements = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.stockMovements;
    return state.stockMovements.filter((m) => {
      const haystack = [m.itemName, m.note, m.type, m.date].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [state.stockMovements, search]);

  return (
    <div className="max-w-[1000px] space-y-5">
      <PageHeader
        title="Stock Movement"
        subtitle="History from adjustments, sales, and purchases"
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link href="/inventory" className="w-full sm:w-auto">
              <Button size="sm" variant="outline" className="w-full">
                <Package className="h-4 w-4" />
                Manage inventory
              </Button>
            </Link>
            <Link href="/transactions/purchases" className="w-full sm:w-auto">
              <Button size="sm" className="w-full">
                <Plus className="h-4 w-4" />
                Record purchase
              </Button>
            </Link>
            <Link href="/transactions/sales" className="w-full sm:w-auto">
              <Button size="sm" variant="outline" className="w-full">
                <ShoppingCart className="h-4 w-4" />
                Record sale
              </Button>
            </Link>
          </div>
        }
      />

      {state.stockMovements.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movements by item, note, or date…"
            className="pl-9"
          />
        </div>
      )}

      <div className="surface-card overflow-hidden">
        {state.stockMovements.length === 0 ? (
          <div className="p-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              No stock movements yet. Adjust inventory, record a sale, or add a purchase.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/inventory">
                <Button size="sm" variant="outline">
                  <Package className="h-4 w-4" />
                  Go to inventory
                </Button>
              </Link>
              <Link href="/transactions/purchases">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Record purchase
                </Button>
              </Link>
            </div>
          </div>
        ) : movements.length === 0 ? (
          <p className="text-sm text-muted-foreground p-8 text-center">
            No movements match “{search}”.
          </p>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="text-muted-foreground">{m.date}</td>
                  <td className="font-medium">{m.itemName}</td>
                  <td>
                    <Badge
                      variant={
                        m.type === "sale"
                          ? "success"
                          : m.type === "out"
                            ? "danger"
                            : m.type === "in"
                              ? "info"
                              : "default"
                      }
                    >
                      {m.type}
                    </Badge>
                  </td>
                  <td className="tabular-nums">{m.qty}</td>
                  <td className="text-muted-foreground text-sm">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
