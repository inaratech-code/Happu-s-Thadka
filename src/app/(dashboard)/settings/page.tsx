"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ThemeSegmented } from "@/components/theme-toggle";
import { DeleteBusinessDataSection } from "@/components/settings/delete-business-data";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const { state, updateSettings, addTable, removeTable } = useStore();
  const [tableName, setTableName] = useState("");
  const [name, setName] = useState(state.settings.restaurantName);
  const [location, setLocation] = useState(state.settings.location);

  const saveProfile = () => {
    updateSettings({
      restaurantName: name.trim() || "Happus Tadka",
      location: location.trim(),
    });
  };

  return (
    <div className="max-w-[1200px] w-full min-w-0 space-y-5">
      <PageHeader title="Settings" subtitle="Restaurant configuration" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          <div className="surface-card p-5 space-y-4 h-full">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Appearance</label>
              <ThemeSegmented />
              <p className="text-xs text-muted-foreground mt-2">Light or dark mode across the app.</p>
            </div>
          </div>

          <div className="surface-card p-5 space-y-4 flex-1">
            <h3 className="text-sm font-semibold">Restaurant profile</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Restaurant name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <Button size="sm" onClick={saveProfile}>
              Save profile
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-5 min-w-0">
          <div className="surface-card p-5 space-y-4 flex-1 min-h-[280px] flex flex-col">
            <h3 className="text-sm font-semibold">Tables (for POS)</h3>
            <p className="text-xs text-muted-foreground">
              Add tables here to pick them at checkout. If none, you can type a table name at POS.
            </p>
            <div className="flex gap-2">
              <Input
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g. T-01"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tableName.trim()) {
                    addTable(tableName);
                    setTableName("");
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  addTable(tableName);
                  setTableName("");
                }}
                disabled={!tableName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="space-y-2 flex-1 overflow-y-auto max-h-[240px] pr-1">
              {state.settings.tables.length === 0 ? (
                <li className="text-sm text-muted-foreground py-6 text-center border border-dashed border-[var(--border)] rounded-lg">
                  No tables configured
                </li>
              ) : (
                state.settings.tables.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2"
                  >
                    <span className="text-sm font-medium">{t.name}</span>
                    <button
                      type="button"
                      onClick={() => removeTable(t.id)}
                      className="p-1 text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <DeleteBusinessDataSection className="h-full" />
        </div>
      </div>
    </div>
  );
}
