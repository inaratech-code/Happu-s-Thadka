"use client";

import { useMemo, useState } from "react";
import { motion } from "@/lib/motion";
import { Plus, Pencil, ShoppingCart, SlidersHorizontal, Trash2 } from "lucide-react";
import { PageHeader, Badge, Input, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/modal";
import { FormField, QuickChips, PresetChips } from "@/components/forms/form-field";
import { useStore } from "@/lib/store";
import { isLowStock } from "@/lib/store-utils";
import type { InventoryItem } from "@/lib/types";
import {
  INVENTORY_CATEGORY_SUGGESTIONS,
  INVENTORY_UNITS,
  STOCK_ADJUST_PRESETS,
} from "@/lib/entry-presets";
import { validateInventoryItem, validateStockAdjust, validateStockSell } from "@/lib/validate-entry";
import { formatCurrency, cn } from "@/lib/utils";

const emptyItem = (): Omit<InventoryItem, "id"> => ({
  name: "",
  category: "",
  stockOnHand: 0,
  unit: "pcs",
  avgCost: 0,
  sellingPrice: 0,
  reorderAt: 5,
  type: "sellable",
});

export default function InventoryPage() {
  const {
    state,
    addInventory,
    updateInventory,
    deleteInventory,
    adjustStock,
    addTransaction,
  } = useStore();

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [sellId, setSellId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyItem());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [addAnother, setAddAnother] = useState(false);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustErrors, setAdjustErrors] = useState<Record<string, string>>({});
  const [sellQty, setSellQty] = useState("1");
  const [sellErrors, setSellErrors] = useState<Record<string, string>>({});

  const items = state.inventory;
  const lowCount = items.filter(isLowStock).length;
  const stockValue = items.reduce((s, i) => s + i.stockOnHand * i.avgCost, 0);

  const categoryOptions = useMemo(() => {
    const fromItems = items.map((i) => i.category.trim()).filter(Boolean);
    return [...new Set([...INVENTORY_CATEGORY_SUGGESTIONS, ...fromItems])].sort();
  }, [items]);

  const adjustItem = adjustId ? items.find((i) => i.id === adjustId) : null;
  const sellItem = sellId ? items.find((i) => i.id === sellId) : null;

  const openAdd = () => {
    setForm(emptyItem());
    setFormErrors({});
    setAddAnother(false);
    setAddOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setForm({ ...item });
    setFormErrors({});
    setEditId(item.id);
  };

  const closeItemModal = () => {
    setAddOpen(false);
    setEditId(null);
    setFormErrors({});
  };

  const saveItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    const payload = {
      ...form,
      name: form.name.trim(),
      category: form.category.trim() || "Other",
      unit: form.unit.trim() || "pcs",
    };

    const result = validateInventoryItem(payload, items, editId);
    if (!result.ok) {
      setFormErrors(result.errors);
      return;
    }

    if (editId) {
      updateInventory(editId, payload);
      closeItemModal();
    } else {
      addInventory(payload);
      if (addAnother) {
        setForm(emptyItem());
        setFormErrors({});
      } else {
        setAddOpen(false);
        setForm(emptyItem());
      }
    }
  };

  const submitAdjust = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!adjustItem) return;
    const result = validateStockAdjust({
      qty: adjustQty,
      currentStock: adjustItem.stockOnHand,
      note: adjustNote,
    });
    if (!result.ok) {
      setAdjustErrors(result.errors);
      return;
    }
    adjustStock(adjustId!, result.delta, adjustNote.trim());
    setAdjustId(null);
    setAdjustQty("");
    setAdjustNote("");
    setAdjustErrors({});
  };

  const submitSell = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!sellItem) return;
    const result = validateStockSell({ qty: sellQty, maxQty: sellItem.stockOnHand });
    if (!result.ok) {
      setSellErrors(result.errors);
      return;
    }
    const amount = result.qty * sellItem.sellingPrice;
    addTransaction({
      type: "sale",
      description: `Sold ${result.qty} ${sellItem.unit} — ${sellItem.name}`,
      amount,
    });
    adjustStock(sellId!, -result.qty, `Sale: ${result.qty} ${sellItem.unit}`, "sale");
    setSellId(null);
    setSellQty("1");
    setSellErrors({});
  };

  const openAdjust = (id: string) => {
    setAdjustId(id);
    setAdjustQty("");
    setAdjustNote("");
    setAdjustErrors({});
  };

  const ItemForm = ({ id }: { id: string }) => (
    <form id={id} onSubmit={saveItem} className="space-y-3">
      <FormField label="Item name" required error={formErrors.name}>
        <Input
          autoFocus
          placeholder="e.g. Chicken breast"
          value={form.name}
          onChange={(e) => {
            setForm((f) => ({ ...f, name: e.target.value }));
            setFormErrors((err) => ({ ...err, name: "" }));
          }}
        />
      </FormField>

      <FormField label="Category" required error={formErrors.category}>
        <Input
          list={`${id}-categories`}
          placeholder="Pick or type category"
          value={form.category}
          onChange={(e) => {
            setForm((f) => ({ ...f, category: e.target.value }));
            setFormErrors((err) => ({ ...err, category: "" }));
          }}
        />
        <datalist id={`${id}-categories`}>
          {categoryOptions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <PresetChips
          className="mt-2"
          presets={INVENTORY_CATEGORY_SUGGESTIONS}
          onPick={(category) => {
            setForm((f) => ({ ...f, category }));
            setFormErrors((err) => ({ ...err, category: "" }));
          }}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          label="Stock on hand"
          required
          error={formErrors.stockOnHand}
          hint="Starting quantity you have now"
        >
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={form.stockOnHand === 0 ? "" : form.stockOnHand}
            onChange={(e) => {
              const stockOnHand = parseFloat(e.target.value) || 0;
              setForm((f) => ({ ...f, stockOnHand }));
              setFormErrors((err) => ({ ...err, stockOnHand: "" }));
            }}
          />
        </FormField>

        <FormField label="Unit" required error={formErrors.unit}>
          <Select
            value={form.unit}
            onChange={(e) => {
              setForm((f) => ({ ...f, unit: e.target.value }));
              setFormErrors((err) => ({ ...err, unit: "" }));
            }}
            className="w-full"
          >
            {INVENTORY_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Item type" hint="Sellable = menu/POS · Consumable = kitchen supplies only">
        <Select
          value={form.type}
          onChange={(e) => {
            const type = e.target.value as InventoryItem["type"];
            setForm((f) => ({
              ...f,
              type,
              sellingPrice: type === "consumable" ? 0 : f.sellingPrice,
            }));
          }}
          className="w-full"
        >
          <option value="sellable">Sellable (menu / POS)</option>
          <option value="consumable">Consumable (internal use)</option>
        </Select>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Avg cost (₹)" error={formErrors.pricing}>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="Purchase cost per unit"
            value={form.avgCost === 0 ? "" : form.avgCost}
            onChange={(e) =>
              setForm((f) => ({ ...f, avgCost: parseFloat(e.target.value) || 0 }))
            }
          />
        </FormField>

        {form.type === "sellable" ? (
          <FormField label="Selling price (₹)" required error={formErrors.sellingPrice}>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="Menu price"
              value={form.sellingPrice === 0 ? "" : form.sellingPrice}
              onChange={(e) => {
                setForm((f) => ({ ...f, sellingPrice: parseFloat(e.target.value) || 0 }));
                setFormErrors((err) => ({ ...err, sellingPrice: "" }));
              }}
            />
          </FormField>
        ) : (
          <div className="flex items-end pb-1">
            <p className="text-[11px] text-muted-foreground">No selling price for consumables</p>
          </div>
        )}
      </div>

      <FormField
        label="Reorder alert at"
        error={formErrors.reorderAt}
        hint="Warn when stock falls to this level or below"
      >
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={form.reorderAt === 0 ? "" : form.reorderAt}
          onChange={(e) => {
            setForm((f) => ({ ...f, reorderAt: parseFloat(e.target.value) || 0 }));
            setFormErrors((err) => ({ ...err, reorderAt: "" }));
          }}
        />
      </FormField>

      {!editId && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={addAnother}
            onChange={(e) => setAddAnother(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          Save and add another item
        </label>
      )}
    </form>
  );

  const stats = [
    { label: "Total Items", value: String(items.length) },
    { label: "Low Stock", value: String(lowCount), alert: lowCount > 0 },
    { label: "Stock Value", value: formatCurrency(stockValue) },
  ] as const;

  return (
    <div className="max-w-[1400px] w-full min-w-0 space-y-5">
      <PageHeader
        title="Inventory"
        subtitle="Track stock, costs, and low-stock alerts"
        actions={
          <Button size="sm" className="w-full sm:w-auto" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "rounded-lg border px-3 py-2.5 sm:px-4 min-w-0",
              index === 2 && "col-span-2 sm:col-span-1",
              "alert" in stat && stat.alert
                ? "border-amber-500/25 bg-amber-500/[0.04]"
                : "border-[var(--border)] bg-[var(--surface-raised)]"
            )}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground break-words">
              {stat.label}
            </p>
            <p
              className={cn(
                "text-base sm:text-lg font-semibold tabular-nums mt-0.5 break-words",
                "alert" in stat && stat.alert && "text-amber-400"
              )}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="surface-card p-8 sm:p-12 text-center">
          <p className="text-muted-foreground text-sm">No inventory items yet.</p>
          <Button className="mt-4" size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add your first item
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((item, i) => {
            const stockValueItem = item.stockOnHand * item.avgCost;
            const low = isLowStock(item);
            const inStock = item.stockOnHand > item.reorderAt;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  "surface-card p-4 relative overflow-hidden",
                  low && "border-amber-500/25"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold leading-tight">{item.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.category}</p>
                  </div>
                  <Badge variant={item.type === "sellable" ? "sellable" : "consumable"}>
                    {item.type === "sellable" ? "Sellable" : "Consumable"}
                  </Badge>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Stock on hand</p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-semibold tabular-nums">{item.stockOnHand}</span>
                    <span className="text-sm text-muted-foreground">{item.unit}</span>
                    <Badge variant={inStock ? "success" : "warning"} className="ml-auto">
                      {inStock ? "In stock" : "Low"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[var(--border)]">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg cost</p>
                    <p className="text-sm tabular-nums mt-0.5">{formatCurrency(item.avgCost)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Selling price</p>
                    <p className="text-sm tabular-nums mt-0.5">
                      {item.sellingPrice ? formatCurrency(item.sellingPrice) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Reorder at</p>
                    <p className="text-sm tabular-nums mt-0.5">
                      {item.reorderAt} {item.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Stock value</p>
                    <p className="text-sm tabular-nums mt-0.5 font-medium text-amber-400/90">
                      {formatCurrency(stockValueItem)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-[var(--border)]">
                  <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                  {item.type === "sellable" && item.sellingPrice > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSellId(item.id);
                        setSellQty("1");
                        setSellErrors({});
                      }}
                    >
                      <ShoppingCart className="h-3 w-3" />
                      Sell
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openAdjust(item.id)}>
                    <SlidersHorizontal className="h-3 w-3" />
                    Adjust
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 ml-auto"
                    onClick={() => {
                      if (confirm(`Delete "${item.name}"?`)) deleteInventory(item.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={closeItemModal}
        title="Add inventory item"
        footer={
          <ModalActions
            formId="inventory-add-form"
            onCancel={closeItemModal}
            onSubmit={() => saveItem()}
            submitLabel="Save item"
          />
        }
      >
        <ItemForm id="inventory-add-form" />
      </Modal>

      <Modal
        open={!!editId}
        onClose={closeItemModal}
        title="Edit item"
        footer={
          <ModalActions
            formId="inventory-edit-form"
            onCancel={closeItemModal}
            onSubmit={() => saveItem()}
            submitLabel="Save changes"
          />
        }
      >
        <ItemForm id="inventory-edit-form" />
      </Modal>

      <Modal
        open={!!adjustId}
        onClose={() => setAdjustId(null)}
        title={adjustItem ? `Adjust stock — ${adjustItem.name}` : "Adjust stock"}
        footer={
          <ModalActions
            formId="inventory-adjust-form"
            onCancel={() => setAdjustId(null)}
            onSubmit={() => submitAdjust()}
            submitLabel="Apply"
          />
        }
      >
        {adjustItem && (
          <form id="inventory-adjust-form" onSubmit={submitAdjust} className="space-y-4">
            <p className="text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2">
              Current stock:{" "}
              <span className="font-semibold tabular-nums">
                {adjustItem.stockOnHand} {adjustItem.unit}
              </span>
            </p>

            <FormField
              label="Change quantity"
              required
              error={adjustErrors.qty}
              hint="Positive adds stock, negative removes (e.g. −2)"
            >
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                autoFocus
                placeholder="e.g. 10 or -3"
                value={adjustQty}
                onChange={(e) => {
                  setAdjustQty(e.target.value);
                  setAdjustErrors((err) => ({ ...err, qty: "" }));
                }}
              />
              <QuickChips
                className="mt-2"
                values={STOCK_ADJUST_PRESETS}
                onPick={(delta) => {
                  setAdjustQty(String(delta));
                  setAdjustErrors((err) => ({ ...err, qty: "" }));
                }}
              />
            </FormField>

            <FormField label="Reason" required error={adjustErrors.note}>
              <Input
                placeholder="Purchase, waste, count correction…"
                value={adjustNote}
                onChange={(e) => {
                  setAdjustNote(e.target.value);
                  setAdjustErrors((err) => ({ ...err, note: "" }));
                }}
              />
            </FormField>
          </form>
        )}
      </Modal>

      <Modal
        open={!!sellId}
        onClose={() => setSellId(null)}
        title={sellItem ? `Sell — ${sellItem.name}` : "Record sale"}
        footer={
          <ModalActions
            formId="inventory-sell-form"
            onCancel={() => setSellId(null)}
            onSubmit={() => submitSell()}
            submitLabel="Record sale"
          />
        }
      >
        {sellItem && (
          <form id="inventory-sell-form" onSubmit={submitSell} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Available: {sellItem.stockOnHand} {sellItem.unit} · Price{" "}
              {formatCurrency(sellItem.sellingPrice)} each
            </p>

            <FormField label="Quantity" required error={sellErrors.qty}>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={sellItem.stockOnHand}
                step="any"
                autoFocus
                value={sellQty}
                onChange={(e) => {
                  setSellQty(e.target.value);
                  setSellErrors((err) => ({ ...err, qty: "" }));
                }}
              />
              <QuickChips
                className="mt-2"
                values={[1, 2, 5, 10].filter((n) => n <= sellItem.stockOnHand)}
                format={(n) => `${n}`}
                onPick={(n) => {
                  setSellQty(String(n));
                  setSellErrors((err) => ({ ...err, qty: "" }));
                }}
              />
            </FormField>

            {sellQty && !sellErrors.qty && (
              <p className="text-xs text-amber-400/90 tabular-nums">
                Total:{" "}
                {formatCurrency(
                  (parseFloat(sellQty) || 0) * sellItem.sellingPrice
                )}
              </p>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}
