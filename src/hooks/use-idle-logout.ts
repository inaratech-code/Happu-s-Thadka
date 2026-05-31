"use client";

import { useEffect } from "react";
import {
  clearLastActivity,
  isIdleExpired,
  readLastActivity,
  touchLastActivity,
} from "@/lib/auth-idle";

const CHECK_INTERVAL_MS = 60 * 1000;
const ACTIVITY_THROTTLE_MS = 30 * 1000;

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const;

/** Logs out when the user has been inactive for longer than {@link IDLE_TIMEOUT_MS}. */
export function useIdleLogout(active: boolean, logout: () => void) {
  useEffect(() => {
    if (!active) {
      clearLastActivity();
      return;
    }

    if (isIdleExpired()) {
      logout();
      return;
    }

    if (readLastActivity() === null) {
      touchLastActivity();
    }

    let throttleUntil = 0;

    const onActivity = () => {
      const now = Date.now();
      if (now < throttleUntil) return;
      throttleUntil = now + ACTIVITY_THROTTLE_MS;
      touchLastActivity(now);
    };

    const checkIdle = () => {
      if (isIdleExpired()) logout();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    const interval = window.setInterval(checkIdle, CHECK_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (isIdleExpired()) logout();
      else touchLastActivity();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, logout]);
}
