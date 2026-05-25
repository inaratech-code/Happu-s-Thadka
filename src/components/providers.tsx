"use client";

import type { ReactNode } from "react";
import { AppBootstrap } from "@/components/app-bootstrap";
import { AuthProvider } from "@/components/auth-provider";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <AuthProvider>
        <AppBootstrap>{children}</AppBootstrap>
      </AuthProvider>
    </StoreProvider>
  );
}
