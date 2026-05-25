import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/password";
import { isSupabaseConfigured } from "@/lib/env";
import { signSession, setSessionCookie, sessionToAuth } from "@/lib/auth/session-server";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import type { AppPermission } from "@/lib/permissions";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured on the server" }, { status: 503 });
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username = body.username?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data: member, error } = await db
    .from("staff")
    .select("id, restaurant_id, name, username, password_hash, role, permissions, active")
    .eq("username", username)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!member) {
    return NextResponse.json({ error: "Username not found or account is disabled" }, { status: 401 });
  }

  const valid = await verifyPassword(password, member.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const role = member.role as "admin" | "staff";
  const permissions =
    role === "admin" ? ALL_PERMISSIONS : ((member.permissions ?? []) as AppPermission[]);

  const token = await signSession({
    staffId: member.id,
    restaurantId: member.restaurant_id,
    username: member.username,
    name: member.name,
    role,
    permissions,
  });

  await setSessionCookie(token);

  return NextResponse.json({
    ok: true,
    session: sessionToAuth({
      staffId: member.id,
      restaurantId: member.restaurant_id,
      username: member.username,
      name: member.name,
      role,
      permissions,
    }),
  });
}
