"use client";

import { useEffect, useState } from "react";

/** True after the first client paint — use for clocks / timeAgo to avoid hydration mismatch. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
