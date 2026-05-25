"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthSession, StaffMember } from "@/lib/types";
import { clearSession, getSession, setSession } from "@/lib/auth-session";
import { verifyPassword } from "@/lib/password";
import { isRemoteDataSource } from "@/lib/data-source";
import { ALL_PERMISSIONS, canAccessPath, hasPermission, type AppPermission } from "@/lib/permissions";

type AuthContextValue = {
  session: AuthSession | null;
  ready: boolean;
  login: (
    username: string,
    password: string,
    staff: StaffMember[]
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  can: (permission: AppPermission) => boolean;
  canPath: (pathname: string) => boolean;
  isAdmin: boolean;
  usesRemoteAuth: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toSession(member: StaffMember): AuthSession {
  return {
    staffId: member.id,
    username: member.username,
    name: member.name,
    role: member.role,
    permissions: member.role === "admin" ? ALL_PERMISSIONS : member.permissions,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const usesRemoteAuth = isRemoteDataSource();

  useLayoutEffect(() => {
    if (usesRemoteAuth) {
      void fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
        .then(async (res) => {
          if (res.ok) {
            const data = (await res.json()) as { session: AuthSession | null };
            setSessionState(data.session);
          } else {
            setSessionState(null);
          }
        })
        .catch(() => setSessionState(null))
        .finally(() => setReady(true));
      return;
    }

    setSessionState(getSession());
    setReady(true);
  }, [usesRemoteAuth]);

  useEffect(() => {
    const fallback = window.setTimeout(() => setReady(true), 2500);
    return () => window.clearTimeout(fallback);
  }, []);

  const login = useCallback(
    async (username: string, password: string, staff: StaffMember[]) => {
      if (usesRemoteAuth) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          session?: AuthSession;
          error?: string;
        };
        if (!res.ok) {
          return { ok: false as const, error: data.error ?? "Login failed" };
        }
        if (data.session) {
          setSessionState(data.session);
        }
        return { ok: true as const };
      }

      const normalized = username.trim().toLowerCase();
      const member = staff.find(
        (s) => s.active && s.username.trim().toLowerCase() === normalized
      );
      if (!member) {
        return { ok: false as const, error: "Username not found or account is disabled" };
      }
      const valid = await verifyPassword(password, member.passwordHash);
      if (!valid) {
        return { ok: false as const, error: "Incorrect password" };
      }
      const next = toSession(member);
      setSession(next);
      setSessionState(next);
      return { ok: true as const };
    },
    [usesRemoteAuth]
  );

  const logout = useCallback(() => {
    if (usesRemoteAuth) {
      void fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } else {
      clearSession();
    }
    setSessionState(null);
    router.push("/login");
  }, [router, usesRemoteAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      login,
      logout,
      can: (permission) => hasPermission(session, permission),
      canPath: (pathname) => canAccessPath(session, pathname),
      isAdmin: session?.role === "admin",
      usesRemoteAuth,
    }),
    [session, ready, login, logout, usesRemoteAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
