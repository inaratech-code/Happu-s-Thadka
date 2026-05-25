import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session-server";
import { loadAppStateFromDb } from "@/lib/db/repository";
import { isSupabaseConfigured } from "@/lib/env";
import { todaySales } from "@/lib/store-utils";

/** PWA widget data (application/json) */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      title: "Happus Tadka",
      subtitle: "Today's sales",
      value: "—",
      hint: "Connect Supabase for live totals",
    });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const state = await loadAppStateFromDb(session.restaurantId);
    const total = todaySales(state.transactions);
    return NextResponse.json({
      title: "Happus Tadka",
      subtitle: "Today's sales",
      value: total,
      currency: "NPR",
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load widget data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
