"use client";

import { AnimatePresence, motion } from "@/lib/motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 scrim backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="fixed z-50 flex flex-col w-[calc(100%-1.5rem)] max-w-md max-h-[min(90dvh,100%-2rem)] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-[var(--surface-overlay)] shadow-2xl sm:w-full mx-3 sm:mx-0"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-[var(--nav-hover)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">{children}</div>
            {footer && (
              <div className="px-4 py-3 border-t border-[var(--border)] flex justify-end gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ModalActions({
  onCancel,
  onSubmit,
  submitLabel = "Save",
  disabled,
  formId,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  disabled?: boolean;
  /** When set, submit is type="submit" for that form (Enter key works). */
  formId?: string;
}) {
  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        type={formId ? "submit" : "button"}
        form={formId}
        size="sm"
        onClick={formId ? undefined : onSubmit}
        disabled={disabled}
      >
        {submitLabel}
      </Button>
    </>
  );
}
