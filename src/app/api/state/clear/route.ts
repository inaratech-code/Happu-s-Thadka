import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session-server";
import { verifyPassword } from "@/lib/password";
import { isDatabaseConfigured } from "@/lib/env";
import {
  findStaffForPasswordCheck,
  loadAppStateFromDb,
  saveAppStateToDb,
} from "@/lib/db/repository";
import { resolveRestaurantId } from "@/lib/db/resolve-restaurant";
import { buildClearedAppState } from "@/lib/clear-business-data";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured on the server" }, { status: 503 });
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

  const restaurantId = await resolveRestaurantId(session);

  const member = await findStaffForPasswordCheck(session.staffId, restaurantId);

  if (!member?.active) {
    return NextResponse.json({ error: "Account not found or disabled" }, { status: 401 });
  }

  const valid = await verifyPassword(password, member.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  try {
    const current = await loadAppStateFromDb(restaurantId);
    const cleared = buildClearedAppState(current);
    await saveAppStateToDb(cleared, restaurantId);
    return NextResponse.json({ ok: true, state: cleared });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to clear data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
