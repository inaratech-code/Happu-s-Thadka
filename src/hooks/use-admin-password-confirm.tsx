"use client";

import { useCallback, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/primitives";
import { Modal, ModalActions } from "@/components/modal";
import { useAuth } from "@/components/auth-provider";
import { useStore } from "@/lib/store";
import { verifyPassword } from "@/lib/password";

type PendingAction = {
  title: string;
  message: string;
  onConfirm: () => void;
};

export function useAdminPasswordConfirm() {
  const { session, isAdmin } = useAuth();
  const { state } = useStore();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setPassword("");
    setShowPass(false);
    setError("");
    setLoading(false);
  }, []);

  const close = useCallback(() => {
    setPending(null);
    reset();
  }, [reset]);

  const requestConfirm = useCallback(
    (action: PendingAction) => {
      if (!isAdmin) {
        window.alert("Only an admin can delete records. Ask an admin to sign in.");
        return;
      }
      reset();
      setPending(action);
    },
    [isAdmin, reset]
  );

  const handleConfirm = useCallback(async () => {
    if (!pending || !session) return;
    setError("");
    setLoading(true);

    const member = state.staff.find((s) => s.id === session.staffId && s.active);
    if (!member || member.role !== "admin") {
      setError("Only an admin account can confirm deletions.");
      setLoading(false);
      return;
    }

    const valid = await verifyPassword(password, member.passwordHash);
    if (!valid) {
      setError("Incorrect admin password");
      setLoading(false);
      return;
    }

    pending.onConfirm();
    close();
  }, [close, password, pending, session, state.staff]);

  const modal = (
    <Modal
      open={pending !== null}
      onClose={close}
      title={pending?.title ?? "Confirm deletion"}
      footer={
        <ModalActions
          onCancel={close}
          onSubmit={() => void handleConfirm()}
          submitLabel={loading ? "Verifying…" : "Delete"}
          disabled={loading || !password.trim()}
        />
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {pending?.message ??
            "This action cannot be undone. Enter your admin password to continue."}
        </p>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Admin password</label>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoComplete="current-password"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && password.trim() && !loading) void handleConfirm();
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
  );

  return { requestConfirm, modal };
}
