import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "@neondatabase/serverless";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "db/migrations/001_initial_schema.sql",
  "db/migrations/002_tenants.sql",
  "db/migrations/003_row_level_security.sql",
  "db/migrations/004_drop_legacy_tables.sql",
];

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString });

for (const file of files) {
  const sql = readFileSync(join(root, file), "utf8");
  console.log(`Running ${file}...`);
  await pool.query(sql);
  console.log(`  done`);
}

await pool.end();
console.log("Migrations complete.");
