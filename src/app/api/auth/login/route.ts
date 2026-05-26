import { NextResponse } from "next/server";
import { getFixedWorkspaceId, isDatabaseConfigured } from "@/lib/env";
import { signSession, setSessionCookie, sessionToAuth } from "@/lib/auth/session-server";
import { loginWithCredentials } from "@/lib/db/auth";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured on the server" }, { status: 503 });
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

  const result = await loginWithCredentials(getFixedWorkspaceId(), username, password);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const token = await signSession(result.session);
  await setSessionCookie(token);

  return NextResponse.json({
    ok: true,
    session: sessionToAuth(result.session),
  });
}
