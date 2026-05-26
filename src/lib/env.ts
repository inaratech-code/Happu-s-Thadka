/** True when Neon Postgres + session secret are configured (server uses DB via API routes). */
export function isDatabaseConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL &&
      process.env.SESSION_SECRET &&
      process.env.SESSION_SECRET.length >= 16
  );
}

/** @deprecated Use isDatabaseConfigured */
export const isNeonConfigured = isDatabaseConfigured;

/** Client: use API routes instead of localStorage when true. */
export function isDatabaseConfiguredClient(): boolean {
  return process.env.NEXT_PUBLIC_USE_SERVER_DB === "true";
}

export const DEFAULT_RESTAURANT_ID = "rest-happus-tadka";

/** Fixed workspace slug for this deployment (login + tenant lookup). */
export function getFixedWorkspaceId(): string {
  return (process.env.NEXT_PUBLIC_WORKSPACE_ID ?? "happus").trim().toLowerCase();
}
