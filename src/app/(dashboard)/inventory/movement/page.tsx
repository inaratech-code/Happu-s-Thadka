"use client";

import { PageHeader, Badge } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
export default function StockMovementPage() {
  const { state } = useStore();

  return (
    <div className="max-w-[1000px] space-y-5">
      <PageHeader
        title="Stock Movement"
        subtitle="History from adjustments and sales"
      />

      <div className="surface-card overflow-hidden">
        {state.stockMovements.length === 0 ? (
          <p className="text-sm text-muted-foreground p-8 text-center">
            No stock movements yet. Adjust or sell inventory to log activity.
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
              {state.stockMovements.map((m) => (
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
