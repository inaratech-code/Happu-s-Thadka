"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variants = {
      primary:
        "bg-gradient-to-b from-amber-500 to-amber-600 text-charcoal-950 font-semibold shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_2px_8px_rgba(245,158,11,0.25)] hover:from-amber-400 hover:to-amber-500 active:scale-[0.98]",
      secondary:
        "bg-[var(--surface)] text-foreground border border-[var(--border)] hover:bg-[var(--nav-hover)] hover:border-amber-500/20 active:scale-[0.98]",
      ghost: "text-muted-foreground hover:text-foreground hover:bg-[var(--nav-hover)]",
      danger: "bg-red-600/90 text-white hover:bg-red-500 active:scale-[0.98]",
      outline:
        "border border-[var(--border)] text-foreground hover:border-amber-500/30 hover:bg-amber-500/[0.05]",
    };
    const sizes = {
      sm: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
      md: "h-9 px-3.5 text-sm gap-2 rounded-lg",
      lg: "h-11 px-5 text-sm gap-2 rounded-lg",
      icon: "h-9 w-9 rounded-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center transition-all focus-ring disabled:opacity-40 disabled:pointer-events-none [touch-action:manipulation]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
