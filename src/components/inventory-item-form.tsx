"use client";

import { Input, Select } from "@/components/ui/primitives";
import { FormField, PresetChips } from "@/components/forms/form-field";
import type { InventoryItem } from "@/lib/types";
import {
  INVENTORY_CATEGORY_SUGGESTIONS,
  INVENTORY_UNITS,
} from "@/lib/entry-presets";

type Props = {
  id: string;
  form: Omit<InventoryItem, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<InventoryItem, "id">>>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  categoryOptions: string[];
  menuCategories: { name: string }[];
  editId?: string | null;
  addAnother: boolean;
  setAddAnother: (value: boolean) => void;
  onSubmit: (e?: React.FormEvent) => void;
  autoFocusName?: boolean;
};

export function InventoryItemForm({
  id,
  form,
  setForm,
  formErrors,
  setFormErrors,
  categoryOptions,
  menuCategories,
  editId,
  addAnother,
  setAddAnother,
  onSubmit,
  autoFocusName = false,
}: Props) {
  return (
    <form id={id} onSubmit={onSubmit} className="space-y-3">
      <FormField label="Item name" required error={formErrors.name}>
        <Input
          autoFocus={autoFocusName}
          placeholder="e.g. Chicken breast"
          value={form.name}
          onChange={(e) => {
            setForm((f) => ({ ...f, name: e.target.value }));
            setFormErrors((err) => ({ ...err, name: "" }));
          }}
        />
      </FormField>

      <FormField label="Category" required error={formErrors.category}>
        {form.type === "sellable" && menuCategories.length > 0 ? (
          <Select
            value={form.category || menuCategories[0]?.name || ""}
            onChange={(e) => {
              setForm((f) => ({ ...f, category: e.target.value }));
              setFormErrors((err) => ({ ...err, category: "" }));
            }}
            className="w-full"
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        ) : (
          <>
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
          </>
        )}
        {form.type === "sellable" && menuCategories.length === 0 && (
          <p className="text-[11px] text-muted-foreground mt-1">
            <a href="/settings/menu" className="text-[var(--primary)] underline">
              Add menu categories
            </a>{" "}
            for a fixed list on POS.
          </p>
        )}
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

      {form.type === "sellable" && (
        <FormField
          label="Menu image URL"
          error={formErrors.imageUrl}
          hint="Optional. https:// link or path like /menu-images/item.jpg"
        >
          <Input
            value={form.imageUrl ?? ""}
            onChange={(e) => {
              setForm((f) => ({ ...f, imageUrl: e.target.value }));
              setFormErrors((err) => ({ ...err, imageUrl: "" }));
            }}
            placeholder="https://…"
          />
        </FormField>
      )}

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
}
