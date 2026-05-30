"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "@/lib/motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { openOrderForTable } from "@/lib/pos-orders";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called with table name after order is created */
  onCreated: (table: string) => void;
  defaultTable?: string;
};

export function CreateOrderDialog({ open, onClose, onCreated, defaultTable }: Props) {
  const { state, createPosOrder } = useStore();
  const tables = state.settings.tables;
  const [selected, setSelected] = useState("");
  const [customTable, setCustomTable] = useState("Walk-in");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (tables.length > 0) {
      const initial =
        defaultTable && tables.some((t) => t.name === defaultTable)
          ? defaultTable
          : tables[0]?.name ?? "";
      setSelected(initial);
    } else {
      setCustomTable(defaultTable?.trim() || "Walk-in");
    }
  }, [open, tables, defaultTable]);

  const tableName = tables.length > 0 ? selected : customTable.trim();

  const handleCreate = () => {
    if (!tableName) {
      setError("Choose or enter a table name.");
      return;
    }
    if (openOrderForTable(state.posOrders, tableName)) {
      setError(`Table "${tableName}" already has an open order. Continue it from Orders or POS.`);
      return;
    }
    createPosOrder(tableName);
    onCreated(tableName);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] scrim backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed z-[60] left-1/2 top-1/2 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--surface-overlay)] shadow-[var(--shadow-float)] overflow-hidden"
            role="dialog"
            aria-labelledby="create-order-title"
          >
            <div className="px-5 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface-raised)]">
              <h2 id="create-order-title" className="text-lg font-semibold text-foreground">
                Create order
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pick a table to start a new open order
              </p>
            </div>

            <div className="p-5 space-y-4">
              {tables.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Table</label>
                  <div className="grid grid-cols-3 gap-2">
                    {tables.map((t) => {
                      const hasOpen = Boolean(openOrderForTable(state.posOrders, t.name));
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={hasOpen}
                          onClick={() => {
                            setSelected(t.name);
                            setError("");
                          }}
                          className={cn(
                            "h-10 rounded-lg text-sm font-medium border transition-colors",
                            selected === t.name
                              ? "chip-btn-active border-[var(--chip-active-border)]"
                              : "border-[var(--border)] text-muted-foreground hover:bg-[var(--chip-hover)]",
                            hasOpen && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor="create-order-table"
                  >
                    Table / customer
                  </label>
                  <input
                    id="create-order-table"
                    value={customTable}
                    onChange={(e) => {
                      setCustomTable(e.target.value);
                      setError("");
                    }}
                    className="field-input w-full"
                    placeholder="e.g. Walk-in, Table 5"
                  />
                </div>
              )}

              {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
            </div>

            <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-raised)] flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" className="flex-1" onClick={handleCreate}>
                <Plus className="h-4 w-4" />
                Create order
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
