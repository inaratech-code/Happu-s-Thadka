/**
 * Push all POS menu catalog rows into Neon inventory_items.
 * Reads DATABASE_URL from .env.development automatically.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "@neondatabase/serverless";
import { requireDatabaseUrl } from "./load-env.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "src", "lib", "default-menu.ts");
const restaurantId = process.env.RESTAURANT_ID ?? "rest-happus-tadka";

function parseCatalog(content) {
  const items = [];
  for (const block of content.match(/\{[\s\S]*?\}/g) ?? []) {
    if (!block.includes("sellingPrice")) continue;
    const id = block.match(/id:\s*"([^"]+)"/)?.[1];
    const name = block.match(/name:\s*"([^"]+)"/)?.[1];
    const category = block.match(/category:\s*"([^"]+)"/)?.[1];
    const sellingPrice = block.match(/sellingPrice:\s*(\d+)/)?.[1];
    const unit = block.match(/unit:\s*"([^"]+)"/)?.[1];
    if (id && name && category && sellingPrice) {
      items.push({
        id: `menu-${id}`,
        name,
        category,
        sellingPrice: Number(sellingPrice),
        unit: unit ?? "pcs",
      });
    }
  }
  return items;
}

const connectionString = requireDatabaseUrl();

const catalog = parseCatalog(readFileSync(catalogPath, "utf8"));
if (catalog.length === 0) {
  console.error("No catalog items parsed from default-menu.ts");
  process.exit(1);
}

const pool = new Pool({ connectionString });

console.log(`Seeding ${catalog.length} menu items for restaurant ${restaurantId}…`);

for (const row of catalog) {
  await pool.query(
    `insert into inventory_items (
      id, restaurant_id, name, category, stock_on_hand, unit, avg_cost, selling_price, reorder_at, item_type, image_url
    ) values ($1, $2, $3, $4, 0, $5, 0, $6, 0, 'sellable', null)
    on conflict (id) do update set
      name = excluded.name,
      category = excluded.category,
      selling_price = excluded.selling_price,
      unit = excluded.unit,
      item_type = excluded.item_type,
      image_url = null`,
    [row.id, restaurantId, row.name, row.category, row.unit, row.sellingPrice]
  );
  console.log(`  ${row.name}`);
}

await pool.end();
console.log("Menu catalog seeded to Neon.");
