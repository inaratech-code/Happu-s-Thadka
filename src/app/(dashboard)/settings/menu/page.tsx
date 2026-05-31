"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, Input, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/modal";
import { FormField } from "@/components/forms/form-field";
import { MenuItemThumb } from "@/components/menu-item-thumb";
import { useStore } from "@/lib/store";
import { menuCategoryEmoji } from "@/lib/menu-images";
import { validateInventoryItem, imageUrlFieldError } from "@/lib/validate-entry";
import type { InventoryItem, MenuCategoryDef } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { useAdminPasswordConfirm } from "@/hooks/use-admin-password-confirm";

const emptyMenuItem = (category: string): Omit<InventoryItem, "id"> => ({
  name: "",
  category,
  stockOnHand: 0,
  unit: "pcs",
  avgCost: 0,
  sellingPrice: 0,
  reorderAt: 0,
  type: "sellable",
  imageUrl: undefined,
});

export default function MenuSettingsPage() {
  const {
    state,
    addMenuCategory,
    updateMenuCategory,
    removeMenuCategory,
    addInventory,
    updateInventory,
    deleteInventory,
  } = useStore();
  const { requestConfirm, modal: adminModal } = useAdminPasswordConfirm();

  const categories = state.settings.menuCategories;
  const sellable = state.inventory.filter((i) => i.type === "sellable");

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "">("");
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? categories[0],
    [categories, selectedCategoryId]
  );

  const itemsInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    const key = selectedCategory.name.trim().toLowerCase();
    return sellable.filter((i) => i.category.trim().toLowerCase() === key);
  }, [sellable, selectedCategory]);

  const [catModal, setCatModal] = useState<"add" | { edit: MenuCategoryDef } | null>(null);
  const [catName, setCatName] = useState("");
  const [catImageUrl, setCatImageUrl] = useState("");
  const [catError, setCatError] = useState("");

  const [itemModal, setItemModal] = useState<"add" | { edit: InventoryItem } | null>(null);
  const [itemForm, setItemForm] = useState(emptyMenuItem(""));
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  const openAddCategory = () => {
    setCatName("");
    setCatImageUrl("");
    setCatError("");
    setCatModal("add");
  };

  const openEditCategory = (cat: MenuCategoryDef) => {
    setCatName(cat.name);
    setCatImageUrl(cat.imageUrl ?? "");
    setCatError("");
    setCatModal({ edit: cat });
  };

  const saveCategory = () => {
    const imageUrl = catImageUrl.trim();
    if (imageUrl && imageUrlFieldError(imageUrl)) {
      setCatError(imageUrlFieldError(imageUrl)!);
      return;
    }
    if (catModal === "add") {
      const res = addMenuCategory({ name: catName, imageUrl: imageUrl || undefined });
      if (!res.ok) {
        setCatError(res.error);
        return;
      }
    } else if (catModal && typeof catModal === "object") {
      const res = updateMenuCategory(catModal.edit.id, {
        name: catName,
        imageUrl: imageUrl || undefined,
      });
      if (!res.ok) {
        setCatError(res.error);
        return;
      }
    }
    setCatModal(null);
  };

  const openAddItem = () => {
    const cat = selectedCategory?.name ?? categories[0]?.name ?? "";
    setItemForm(emptyMenuItem(cat));
    setItemErrors({});
    setItemModal("add");
  };

  const openEditItem = (item: InventoryItem) => {
    setItemForm({ ...item });
    setItemErrors({});
    setItemModal({ edit: item });
  };

  const saveItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    const imageErr = imageUrlFieldError(itemForm.imageUrl);
    if (imageErr) {
      setItemErrors({ imageUrl: imageErr });
      return;
    }
    const payload = {
      ...itemForm,
      name: itemForm.name.trim(),
      category: itemForm.category.trim() || selectedCategory?.name || "Other",
      unit: itemForm.unit.trim() || "pcs",
      type: "sellable" as const,
      imageUrl: itemForm.imageUrl?.trim() || undefined,
    };
    const editId = itemModal && typeof itemModal === "object" ? itemModal.edit.id : null;
    const result = validateInventoryItem(payload, state.inventory, editId);
    if (!result.ok) {
      setItemErrors(result.errors);
      return;
    }
    if (editId) {
      updateInventory(editId, payload);
    } else {
      addInventory(payload);
    }
    setItemModal(null);
  };

  return (
    <div className="max-w-[1200px] w-full min-w-0 space-y-4 sm:space-y-5">
      <PageHeader
        title="Menu catalog"
        subtitle="Categories and POS menu items with images"
        actions={
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Settings
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,280px)_1fr] gap-4 lg:gap-5 items-start">
        <div className="surface-card p-3 sm:p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Categories</h3>
            <Button type="button" size="sm" variant="outline" onClick={openAddCategory}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Each category can have an image URL used on the POS when an item has no photo.
          </p>
          <ul className="space-y-1.5 max-h-[min(40vh,16rem)] sm:max-h-[min(60vh,28rem)] overflow-y-auto pr-1 -mr-1">
            {categories.length === 0 ? (
              <li className="text-sm text-muted-foreground py-6 text-center border border-dashed border-[var(--border)] rounded-lg">
                No categories yet
              </li>
            ) : (
              categories.map((cat) => {
                const active = selectedCategory?.id === cat.id;
                const count = sellable.filter(
                  (i) => i.category.trim().toLowerCase() === cat.name.trim().toLowerCase()
                ).length;
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
                        active
                          ? "border-[var(--primary)] bg-[var(--primary)]/10"
                          : "border-[var(--border)] hover:bg-[var(--chip-hover)]"
                      )}
                    >
                      <MenuItemThumb
                        name={cat.name}
                        emoji={menuCategoryEmoji(cat.name)}
                        imageUrl={cat.imageUrl}
                        size="sm"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">{cat.name}</span>
                        <span className="text-[11px] text-muted-foreground">{count} items</span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {selectedCategory && (
            <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => openEditCategory(selectedCategory)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit category
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-red-400"
                onClick={() =>
                  requestConfirm({
                    title: "Delete menu category",
                    message: `Enter admin password to delete category “${selectedCategory.name}”.`,
                    onConfirm: () => {
                      const res = removeMenuCategory(selectedCategory.id);
                      if (!res.ok) window.alert(res.error);
                      else setSelectedCategoryId("");
                    },
                  })
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="surface-card p-3 sm:p-4 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">
                {selectedCategory ? `Items · ${selectedCategory.name}` : "Menu items"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sellable items appear on the POS menu for this category.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!selectedCategory}
              onClick={openAddItem}
            >
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>

          {!selectedCategory ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Add or select a category to manage items.
            </p>
          ) : itemsInCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-[var(--border)] rounded-lg">
              No items in {selectedCategory.name}. Add your first menu item.
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {itemsInCategory.map((item) => {
                const emoji = menuCategoryEmoji(item.category);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3"
                  >
                    <MenuItemThumb
                      name={item.name}
                      emoji={emoji}
                      imageUrl={item.imageUrl}
                      categoryImageUrl={selectedCategory.imageUrl}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.sellingPrice)} · stock {item.stockOnHand} {item.unit}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEditItem(item)}
                        className="p-2 rounded-md hover:bg-[var(--chip-hover)] text-muted-foreground"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          requestConfirm({
                            title: "Delete menu item",
                            message: `Enter admin password to delete “${item.name}”.`,
                            onConfirm: () => deleteInventory(item.id),
                          })
                        }
                        className="p-2 rounded-md hover:bg-red-500/10 text-red-400"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Modal
        open={catModal !== null}
        onClose={() => setCatModal(null)}
        title={catModal === "add" ? "Add category" : "Edit category"}
        footer={
          <ModalActions
            onCancel={() => setCatModal(null)}
            onSubmit={saveCategory}
            submitLabel="Save category"
            disabled={!catName.trim()}
          />
        }
      >
        <div className="space-y-3">
          <FormField label="Category name" required>
            <Input
              value={catName}
              onChange={(e) => {
                setCatName(e.target.value);
                setCatError("");
              }}
              placeholder="e.g. Momos"
            />
          </FormField>
          <FormField
            label="Category image URL"
            hint="Shown on POS when items in this category have no image. Use https://… or /menu-images/…"
            error={catError || undefined}
          >
            <Input
              value={catImageUrl}
              onChange={(e) => {
                setCatImageUrl(e.target.value);
                setCatError("");
              }}
              placeholder="https://example.com/momos.jpg"
            />
          </FormField>
          {catImageUrl.trim() && !imageUrlFieldError(catImageUrl) && (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3">
              <MenuItemThumb
                name={catName || "Preview"}
                emoji={menuCategoryEmoji(catName)}
                imageUrl={catImageUrl.trim()}
                size="sm"
              />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" />
                Preview
              </span>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={itemModal !== null}
        onClose={() => setItemModal(null)}
        title={itemModal === "add" ? "Add menu item" : "Edit menu item"}
        footer={
          <ModalActions
            formId="menu-item-form"
            onCancel={() => setItemModal(null)}
            onSubmit={() => saveItem()}
            submitLabel="Save item"
          />
        }
      >
        <form id="menu-item-form" onSubmit={saveItem} className="space-y-3">
          <FormField label="Category" required error={itemErrors.category}>
            <Select
              value={itemForm.category}
              onChange={(e) => {
                setItemForm((f) => ({ ...f, category: e.target.value }));
                setItemErrors((err) => ({ ...err, category: "" }));
              }}
              className="w-full"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Item name" required error={itemErrors.name}>
            <Input
              value={itemForm.name}
              onChange={(e) => {
                setItemForm((f) => ({ ...f, name: e.target.value }));
                setItemErrors((err) => ({ ...err, name: "" }));
              }}
              placeholder="e.g. Chicken Momo"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Selling price (₹)" required error={itemErrors.sellingPrice}>
              <Input
                type="number"
                min={0}
                step="any"
                value={itemForm.sellingPrice === 0 ? "" : itemForm.sellingPrice}
                onChange={(e) => {
                  setItemForm((f) => ({
                    ...f,
                    sellingPrice: parseFloat(e.target.value) || 0,
                  }));
                  setItemErrors((err) => ({ ...err, sellingPrice: "" }));
                }}
              />
            </FormField>
            <FormField label="Unit" error={itemErrors.unit}>
              <Input
                value={itemForm.unit}
                onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))}
                placeholder="pcs, plate…"
              />
            </FormField>
          </div>
          <FormField
            label="Item image URL"
            error={itemErrors.imageUrl}
            hint="Optional. Overrides category image on POS."
          >
            <Input
              value={itemForm.imageUrl ?? ""}
              onChange={(e) => {
                setItemForm((f) => ({ ...f, imageUrl: e.target.value }));
                setItemErrors((err) => ({ ...err, imageUrl: "" }));
              }}
              placeholder="https://… or /menu-images/item.jpg"
            />
          </FormField>
          <FormField label="Stock on hand" error={itemErrors.stockOnHand}>
            <Input
              type="number"
              min={0}
              step="any"
              value={itemForm.stockOnHand === 0 ? "" : itemForm.stockOnHand}
              onChange={(e) =>
                setItemForm((f) => ({
                  ...f,
                  stockOnHand: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </FormField>
        </form>
      </Modal>
      {adminModal}
    </div>
  );
}
