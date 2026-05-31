"use client";

import type { ReactNode } from "react";
import { AppBootstrap } from "@/components/app-bootstrap";
import { AuthProvider } from "@/components/auth-provider";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppBootstrap>{children}</AppBootstrap>
      </StoreProvider>
    </AuthProvider>
  );
}
