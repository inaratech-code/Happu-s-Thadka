"use client";

import { APP_PERMISSIONS, type AppPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function StaffPermissionPicker({
  value,
  onChange,
  disabled,
}: {
  value: AppPermission[];
  onChange: (next: AppPermission[]) => void;
  disabled?: boolean;
}) {
  const toggle = (id: AppPermission) => {
    if (disabled) return;
    onChange(value.includes(id) ? value.filter((p) => p !== id) : [...value, id]);
  };

  const selectAll = () => onChange(APP_PERMISSIONS.map((p) => p.id).filter((id) => id !== "staff"));
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">App access</p>
        {!disabled && (
          <div className="flex gap-2 text-[11px]">
            <button type="button" className="text-amber-500 hover:underline" onClick={selectAll}>
              Select all
            </button>
            <button type="button" className="text-muted-foreground hover:underline" onClick={clearAll}>
              Clear
            </button>
          </div>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {APP_PERMISSIONS.filter((p) => p.id !== "staff").map((area) => {
          const checked = value.includes(area.id);
          return (
            <label
              key={area.id}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                checked
                  ? "border-amber-500/35 bg-amber-500/[0.06]"
                  : "border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--nav-hover)]",
                disabled && "opacity-60 cursor-not-allowed"
              )}
            >
              <input
                type="checkbox"
                className="mt-0.5 rounded border-[var(--border)]"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(area.id)}
              />
              <span className="min-w-0">
                <span className="text-sm font-medium block">{area.label}</span>
                <span className="text-[11px] text-muted-foreground leading-snug">{area.description}</span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Only the main admin can add staff and change permissions. Staff accounts use only the sections you enable above.
      </p>
    </div>
  );
}
