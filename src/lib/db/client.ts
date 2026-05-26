import { neon, Pool } from "@neondatabase/serverless";

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL");
  }
  return url;
}

let pool: Pool | undefined;
let sqlClient: ReturnType<typeof neon> | undefined;

/** Tagged-template SQL (server actions, API routes, simple reads). */
export function getSql() {
  if (!sqlClient) {
    sqlClient = neon(requireDatabaseUrl());
  }
  return sqlClient;
}

/** Pool for transactions (bulk state save). */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: requireDatabaseUrl() });
  }
  return pool;
}
