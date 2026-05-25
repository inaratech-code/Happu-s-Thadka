"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { firstAllowedPath } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, ready, canPath } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
    }
  }, [ready, session, router]);

  if (!ready) {
    return null;
  }

  if (!session) {
    return null;
  }

  if (!canPath(pathname)) {
    return (
      <AccessDenied
        onGoBack={() => router.push(firstAllowedPath(session))}
      />
    );
  }

  return <>{children}</>;
}
