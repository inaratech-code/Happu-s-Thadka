"use client";

import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/primitives";
import { Modal, ModalActions } from "@/components/modal";
import { useAuth } from "@/components/auth-provider";
import { useStore } from "@/lib/store";
import { buildClearedAppState } from "@/lib/clear-business-data";
import { verifyPassword } from "@/lib/password";
import { isRemoteDataSource } from "@/lib/data-source";
import { cn } from "@/lib/utils";

export function DeleteBusinessDataSection({ className }: { className?: string }) {
  const { session, isAdmin } = useAuth();
  const { state, persist, refreshData } = useStore();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAdmin) return null;

  const resetModal = () => {
    setPassword("");
    setShowPass(false);
    setError("");
    setLoading(false);
  };

  const close = () => {
    setOpen(false);
    resetModal();
  };

  const handleDelete = async () => {
    if (!session) return;
    setError("");
    setLoading(true);

    const member = state.staff.find((s) => s.id === session.staffId && s.active);
    if (!member) {
      setError("Your staff account was not found. Sign in again.");
      setLoading(false);
      return;
    }

    if (isRemoteDataSource()) {
      try {
        const res = await fetch("/api/state/clear", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          state?: typeof state;
          error?: string;
        };
        if (!res.ok) {
          setError(data.error ?? "Failed to delete data");
          setLoading(false);
          return;
        }
        if (data.state) {
          persist(data.state);
        } else {
          refreshData();
        }
        close();
      } catch {
        setError("Network error. Try again.");
        setLoading(false);
      }
      return;
    }

    const valid = await verifyPassword(password, member.passwordHash);
    if (!valid) {
      setError("Incorrect password");
      setLoading(false);
      return;
    }

    persist(buildClearedAppState(state));
    close();
  };

  return (
    <>
      <div
        className={cn(
          "surface-card border border-red-500/25 p-5 space-y-3 h-full",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-red-300">Delete all business data</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Removes inventory, sales, purchases, expenses, ledger, kitchen orders, stock
              movements, and POS tables. <strong className="text-foreground">Staff accounts are kept.</strong>{" "}
              Only admins can do this; you must enter your own password.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetModal();
              setOpen(true);
            }}
            title="Delete all business data"
            aria-label="Delete all business data"
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={close}
        title="Delete all business data"
        footer={
          <ModalActions
            onCancel={close}
            onSubmit={() => void handleDelete()}
            submitLabel={loading ? "Deleting…" : "Delete everything"}
            disabled={loading || !password}
          />
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            This cannot be undone. Staff logins and permissions will remain. Enter{" "}
            <span className="text-foreground font-medium">{session?.name ?? "your"}</span>
            &apos;s password to confirm.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Inventory, menu, and stock history</li>
            <li>Sales, purchases, expenses, and ledger</li>
            <li>Kitchen orders and configured tables</li>
            <li>Financial accounts reset to defaults (staff unchanged)</li>
          </ul>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Your password</label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password for this account"
                autoComplete="current-password"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && password && !loading) void handleDelete();
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>
      </Modal>
    </>
  );
}
