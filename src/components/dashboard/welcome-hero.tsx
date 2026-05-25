"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion } from "@/lib/motion";
import { Calendar, ChefHat, MapPin, Wifi, WifiOff, type LucideIcon } from "lucide-react";
import { getGreeting } from "@/lib/dashboard-stats";
import { getTodayDates } from "@/lib/nepali-date";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

function StatPill({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: ReactNode;
  iconClass?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "dash-stat-pill h-full rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5",
        className
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider dash-text-secondary mb-2">
        {label}
      </p>
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-muted)]">
          <Icon className={cn("h-[18px] w-[18px]", iconClass)} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-sm sm:text-base font-bold text-[var(--dash-text)] leading-snug break-words">
            {value}
          </p>
          {sub ? (
            <p className="text-[11px] sm:text-xs dash-text-secondary leading-snug mt-0.5 break-words">
              {sub}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function WelcomeHero({
  name,
  location,
  activeKitchen,
  online,
}: {
  name: string;
  location: string;
  activeKitchen: number;
  online: boolean;
}) {
  const mounted = useMounted();
  const greeting = mounted ? getGreeting() : { text: "Welcome", icon: "👋" };
  const today = mounted ? getTodayDates() : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="dash-hero rounded-2xl overflow-hidden"
    >
      <div
        className="dash-hero-orb w-40 h-40 -top-16 -right-10 opacity-50"
        style={{ background: "rgba(245, 158, 11, 0.2)" }}
      />

      <div className="relative p-3.5 sm:p-4 lg:p-5">
        <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-start xl:gap-5">
          {/* Left: greeting */}
          <div className="flex-1 min-w-0 xl:min-w-[240px]">
            <span className="dash-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {greeting.text} {greeting.icon}
            </span>

            <div className="mt-2 flex items-start gap-3">
              <div className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden ring-1 ring-amber-500/30 shadow-md shadow-amber-500/15">
                <Image src="/logo.png" alt="Happus Tadka" fill className="object-cover" sizes="44px" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-[var(--dash-text)] break-words">
                  Namaste 👋 <span className="break-words">{name}</span>
                </h1>
                <p className="text-xs dash-text-secondary mt-0.5 inline-flex items-start gap-1 max-w-full">
                  <MapPin className="h-3 w-3 shrink-0 text-primary mt-0.5" />
                  <span className="break-words leading-snug">{location}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Status cards — mobile: Today full width; Kitchen + Sync side by side */}
          <div className="grid grid-cols-2 gap-2.5 w-full sm:grid-cols-3 sm:gap-3 xl:w-auto xl:min-w-[min(100%,36rem)] xl:shrink-0 xl:border-l xl:border-[var(--dash-border)]/80 xl:pl-5">
            <StatPill
              className="col-span-2 sm:col-span-1"
              icon={Calendar}
              label="Today"
              value={today?.englishTitle ?? "Today"}
              sub={
                today ? (
                  <span className="block space-y-0.5">
                    <span className="block">{today.englishFull}</span>
                    <span className="block text-primary font-medium">{today.nepaliBS}</span>
                  </span>
                ) : undefined
              }
              iconClass="text-primary"
            />
            <StatPill
              icon={ChefHat}
              label="Kitchen"
              value={activeKitchen === 0 ? "All clear ✓" : `${activeKitchen} active`}
              iconClass="text-orange-500"
            />
            <StatPill
              icon={online ? Wifi : WifiOff}
              label="Sync"
              value={online ? "Online" : "Offline"}
              sub="On device"
              iconClass={online ? "text-emerald-600" : "text-amber-600"}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
