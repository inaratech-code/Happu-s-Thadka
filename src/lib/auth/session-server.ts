import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AuthSession, StaffRole } from "@/lib/types";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import type { AppPermission } from "@/lib/permissions";

export const SESSION_COOKIE = "happus_session";

export type SessionPayload = {
  staffId: string;
  restaurantId: string;
  username: string;
  name: string;
  role: StaffRole;
  permissions: AppPermission[];
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (min 16 characters) when using Supabase");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const staffId = payload.staffId as string;
    const restaurantId = payload.restaurantId as string;
    if (!staffId || !restaurantId) return null;
    const role = payload.role as StaffRole;
    return {
      staffId,
      restaurantId,
      username: payload.username as string,
      name: payload.name as string,
      role,
      permissions:
        role === "admin"
          ? ALL_PERMISSIONS
          : (payload.permissions as AppPermission[]) ?? [],
    };
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionToAuth(session: SessionPayload): AuthSession {
  return {
    staffId: session.staffId,
    username: session.username,
    name: session.name,
    role: session.role,
    permissions: session.permissions,
  };
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
