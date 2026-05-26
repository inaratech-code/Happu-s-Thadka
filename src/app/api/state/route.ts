import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session-server";
import { loadAppStateFromDb, saveAppStateToDb } from "@/lib/db/repository";
import { resolveRestaurantId } from "@/lib/db/resolve-restaurant";
import { isDatabaseConfigured } from "@/lib/env";
import type { AppState } from "@/lib/types";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured on the server" }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const restaurantId = await resolveRestaurantId(session);
    const state = await loadAppStateFromDb(restaurantId);
    return NextResponse.json(state);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load state";
    const status =
      message.includes("Session") || message.includes("Workspace") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured on the server" }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let state: AppState;
  try {
    state = (await request.json()) as AppState;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const restaurantId = await resolveRestaurantId(session);
    await saveAppStateToDb(state, restaurantId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save state";
    const status =
      message.includes("Session") || message.includes("Workspace") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
