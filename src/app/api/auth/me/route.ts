import { NextResponse } from "next/server";
import { getServerSession, sessionToAuth } from "@/lib/auth/session-server";
import { isDatabaseConfigured } from "@/lib/env";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ session: null }, { status: 200 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ session: null }, { status: 401 });
  }

  return NextResponse.json({ session: sessionToAuth(session) });
}
