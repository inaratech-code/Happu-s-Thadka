import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/password";
import { isSupabaseConfigured } from "@/lib/env";
import { loadAppStateFromDb, saveAppStateToDb } from "@/lib/db/repository";
import { buildClearedAppState } from "@/lib/clear-business-data";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured on the server" }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Only an admin can delete all business data" }, { status: 403 });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const password = body.password ?? "";
  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data: member, error: staffErr } = await db
    .from("staff")
    .select("id, password_hash, active")
    .eq("id", session.staffId)
    .eq("restaurant_id", session.restaurantId)
    .maybeSingle();

  if (staffErr) {
    return NextResponse.json({ error: staffErr.message }, { status: 500 });
  }
  if (!member?.active) {
    return NextResponse.json({ error: "Account not found or disabled" }, { status: 401 });
  }

  const valid = await verifyPassword(password, member.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  try {
    const current = await loadAppStateFromDb(session.restaurantId);
    const cleared = buildClearedAppState(current);
    await saveAppStateToDb(cleared, session.restaurantId);
    return NextResponse.json({ ok: true, state: cleared });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to clear data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
