"use client";

import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function LiveStatusDot({
  online,
  className,
  size = "sm",
}: {
  online: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "h-2.5 w-2.5" : "h-2 w-2";

  return (
    <span className={cn("relative flex shrink-0", dim, className)} title={online ? "Online" : "Offline"}>
      {online ? (
        <>
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/50"
            animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.55)]" />
        </>
      ) : (
        <span className="relative inline-flex h-full w-full rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
      )}
    </span>
  );
}
