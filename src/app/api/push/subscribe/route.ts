import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session-server";

/** Accepts a PushSubscription JSON payload (store in DB later if needed). */
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await request.json();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
  }
}
