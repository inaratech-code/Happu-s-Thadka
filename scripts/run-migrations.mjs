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
  "db/migrations/006_kitchen_order_transaction.sql",
  "db/migrations/007_pos_orders.sql",
  "db/migrations/008_pos_orders_rls.sql",
  "db/migrations/009_kitchen_before_payment.sql",
  "db/migrations/010_menu_categories.sql",
  "db/migrations/011_ensure_default_admin.sql",
];

const connectionString = requireDatabaseUrl();
const pool = new Pool({ connectionString });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Postgres deadlock — common when dev server saves while migrations run */
function isDeadlock(err) {
  return err?.code === "40P01";
}

async function queryWithRetry(sql, label, maxAttempts = 6) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await pool.query(sql);
    } catch (err) {
      if (isDeadlock(err) && attempt < maxAttempts) {
        const wait = 300 * attempt + Math.floor(Math.random() * 200);
        console.warn(
          `  deadlock on ${label}, retry ${attempt}/${maxAttempts - 1} in ${wait}ms…`
        );
        console.warn(
          "  Tip: stop the dev server (npm run dev:stop) so nothing else writes to Neon."
        );
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
}

async function ensureMigrationsTable() {
  await queryWithRetry(
    `create table if not exists public.schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )`,
    "schema_migrations"
  );
}

async function appliedFilenames() {
  const res = await pool.query("select filename from public.schema_migrations");
  return new Set(res.rows.map((r) => r.filename));
}

async function markApplied(filename) {
  await pool.query(
    `insert into public.schema_migrations (filename) values ($1)
     on conflict (filename) do nothing`,
    [filename]
  );
}

/** DBs that ran migrations before we tracked them — infer what is already applied */
async function backfillMigrationHistory() {
  const countRes = await pool.query(
    "select count(*)::int as c from public.schema_migrations"
  );
  if (countRes.rows[0].c > 0) return;

  const probe = await pool.query(`
    select
      exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'menu_categories'
      ) as has_menu_categories,
      exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'pos_orders'
      ) as has_pos_orders,
      exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'restaurants'
      ) as has_restaurants
  `);

  const { has_menu_categories, has_pos_orders, has_restaurants } = probe.rows[0];
  if (!has_restaurants) return;

  let already = [];
  if (has_menu_categories) {
    already = [...files];
  } else if (has_pos_orders) {
    already = files.filter((f) => f !== "db/migrations/010_menu_categories.sql");
  } else {
    already = files.filter((f) => f === "db/migrations/001_initial_schema.sql");
  }

  if (already.length === 0) return;

  console.log(
    `Backfilling migration history (${already.length} file(s) marked already applied)…`
  );
  for (const filename of already) {
    await markApplied(filename);
  }
}

try {
  await ensureMigrationsTable();
  await backfillMigrationHistory();

  const done = await appliedFilenames();
  let ran = 0;

  for (const file of files) {
    if (done.has(file)) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }

    const sql = readFileSync(join(root, file), "utf8");
    console.log(`Running ${file}…`);
    await queryWithRetry(sql, file);
    await markApplied(file);
    console.log(`  done`);
    ran++;
  }

  if (ran === 0) {
    console.log("No pending migrations.");
  } else {
    console.log(`Applied ${ran} migration(s).`);
  }
  console.log("Migrations complete.");
} finally {
  await pool.end();
}
