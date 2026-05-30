import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "@neondatabase/serverless";
import { requireDatabaseUrl } from "./load-env.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "db/migrations/001_initial_schema.sql",
  "db/migrations/002_tenants.sql",
  "db/migrations/003_row_level_security.sql",
  "db/migrations/004_drop_legacy_tables.sql",
  "db/migrations/005_inventory_image_url.sql",
];

const connectionString = requireDatabaseUrl();

const pool = new Pool({ connectionString });

for (const file of files) {
  const sql = readFileSync(join(root, file), "utf8");
  console.log(`Running ${file}...`);
  await pool.query(sql);
  console.log(`  done`);
}

await pool.end();
console.log("Migrations complete.");
