import { NextResponse } from "next/server";
import { getVapidPublicKey, isVapidConfiguredOnServer } from "@/lib/vapid-config";

/** Runtime push config so the client does not depend on build-time NEXT_PUBLIC inlining. */
export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({
    configured: isVapidConfiguredOnServer(),
    publicKey: publicKey ?? null,
  });
}
