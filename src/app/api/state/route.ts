import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session-server";
import { loadAppStateFromDb, saveAppStateToDb } from "@/lib/db/repository";
import { isSupabaseConfigured } from "@/lib/env";
import type { AppState } from "@/lib/types";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured on the server" }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const state = await loadAppStateFromDb(session.restaurantId);
    return NextResponse.json(state);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load state";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured on the server" }, { status: 503 });
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
    await saveAppStateToDb(state, session.restaurantId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save state";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
