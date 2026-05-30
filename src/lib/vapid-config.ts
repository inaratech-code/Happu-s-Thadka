/** Server-side VAPID env (also used by /api/push/config). */

export function getVapidPublicKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  return key || undefined;
}

export function isVapidConfiguredOnServer(): boolean {
  return Boolean(getVapidPublicKey());
}
