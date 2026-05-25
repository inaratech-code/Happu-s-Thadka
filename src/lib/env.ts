/** True when Supabase + session secret are configured (server uses DB; client uses API routes). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SESSION_SECRET &&
      process.env.SESSION_SECRET.length >= 16
  );
}

export function isSupabaseConfiguredClient(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export const DEFAULT_RESTAURANT_ID = "rest-happus-tadka";
