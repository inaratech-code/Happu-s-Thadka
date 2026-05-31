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
import { getFixedWorkspaceId } from "@/lib/env";
import { ALL_PERMISSIONS, canAccessPath, hasPermission, type AppPermission } from "@/lib/permissions";
import {
  clearLastActivity,
  isIdleExpired,
  touchLastActivity,
} from "@/lib/auth-idle";
import { useIdleLogout } from "@/hooks/use-idle-logout";

type AuthContextValue = {
  session: AuthSession | null;
  ready: boolean;
  login: (
    workspace: string,
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

const SESSION_CACHE_KEY = "happus-auth-session";

function readCachedSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function writeCachedSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (session) {
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(SESSION_CACHE_KEY);
  }
}

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
      const cached = readCachedSession();
      if (cached && isIdleExpired()) {
        writeCachedSession(null);
        clearLastActivity();
        void fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        setSessionState(null);
        setReady(true);
        return;
      }
      if (cached) {
        setSessionState(cached);
      }

      void fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
        .then(async (res) => {
          if (res.ok) {
            const data = (await res.json()) as { session: AuthSession | null };
            if (data.session && isIdleExpired()) {
              writeCachedSession(null);
              clearLastActivity();
              void fetch("/api/auth/logout", { method: "POST", credentials: "include" });
              setSessionState(null);
              return;
            }
            if (data.session) touchLastActivity();
            setSessionState(data.session);
            writeCachedSession(data.session);
          } else {
            setSessionState(null);
            writeCachedSession(null);
          }
        })
        .catch(() => {
          if (!cached) {
            setSessionState(null);
            writeCachedSession(null);
          }
        })
        .finally(() => setReady(true));
      return;
    }

    const local = getSession();
    if (local && isIdleExpired()) {
      clearSession();
      clearLastActivity();
      setSessionState(null);
    } else {
      if (local) touchLastActivity();
      setSessionState(local);
    }
    setReady(true);
  }, [usesRemoteAuth]);

  useEffect(() => {
    const fallback = window.setTimeout(() => setReady(true), 2500);
    return () => window.clearTimeout(fallback);
  }, []);

  const login = useCallback(
    async (workspace: string, username: string, password: string, staff: StaffMember[]) => {
      if (usesRemoteAuth) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace: getFixedWorkspaceId(),
            username,
            password,
          }),
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
          writeCachedSession(data.session);
          setSessionState(data.session);
          touchLastActivity();
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
      touchLastActivity();
      return { ok: true as const };
    },
    [usesRemoteAuth]
  );

  const logout = useCallback(() => {
    clearLastActivity();
    if (usesRemoteAuth) {
      writeCachedSession(null);
      void fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } else {
      clearSession();
    }
    setSessionState(null);
    router.push("/login");
  }, [router, usesRemoteAuth]);

  useIdleLogout(Boolean(session), logout);

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
