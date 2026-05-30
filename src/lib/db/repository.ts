import { needsMenuCatalogPersist } from "@/lib/default-menu";
import { appStateToDbPayload, mapInventory, rowsToAppState, type DbRows } from "@/lib/db/mappers";
import type { AppState } from "@/lib/types";
import { DEFAULT_RESTAURANT_ID } from "@/lib/env";
import { getPool } from "@/lib/db/client";
import { setRestaurantScope, withRestaurantScope } from "@/lib/db/scope";
import type { PoolClient } from "@neondatabase/serverless";

const CHILD_TABLES = [
  "kitchen_orders",
  "stock_movements",
  "ledger_entries",
  "transactions",
  "inventory_items",
  "parties",
  "financial_accounts",
  "staff",
  "restaurant_tables",
] as const;

type StaffRow = DbRows["staff"][number];

export async function loadAppStateFromDb(
  restaurantId: string = DEFAULT_RESTAURANT_ID
): Promise<AppState> {
  return withRestaurantScope(restaurantId, async (client) => {
    const restaurantResult = await client.query<NonNullable<DbRows["restaurant"]>>(
      `select id, name, location, kot_counter, tx_counter from restaurants where id = $1`,
      [restaurantId]
    );

    const restaurant = restaurantResult.rows[0] ?? null;
    if (!restaurant) {
      throw new Error("Restaurant not found. Run db/migrations on Neon first.");
    }

    const tablesRes = await client.query<{ id: string; name: string }>(
      "select id, name from restaurant_tables where restaurant_id = $1",
      [restaurantId]
    );
    const staffRes = await client.query<StaffRow>(
      "select * from staff where restaurant_id = $1",
      [restaurantId]
    );
    const invRes = await client.query(
      "select * from inventory_items where restaurant_id = $1",
      [restaurantId]
    );
    const txRes = await client.query(
      "select * from transactions where restaurant_id = $1",
      [restaurantId]
    );
    const facRes = await client.query(
      "select * from financial_accounts where restaurant_id = $1",
      [restaurantId]
    );
    const partyRes = await client.query(
      "select * from parties where restaurant_id = $1",
      [restaurantId]
    );
    const ledRes = await client.query(
      "select * from ledger_entries where restaurant_id = $1",
      [restaurantId]
    );
    const movRes = await client.query(
      "select * from stock_movements where restaurant_id = $1",
      [restaurantId]
    );
    const kotRes = await client.query(
      "select * from kitchen_orders where restaurant_id = $1",
      [restaurantId]
    );

    const inventoryRows = invRes.rows as Record<string, unknown>[];
    const rawInventory = inventoryRows.map(mapInventory);

    const rows: DbRows = {
      restaurant,
      tables: tablesRes.rows,
      staff: staffRes.rows,
      inventory: inventoryRows,
      transactions: txRes.rows as Record<string, unknown>[],
      financial_accounts: facRes.rows as Record<string, unknown>[],
      parties: partyRes.rows as Record<string, unknown>[],
      ledger_entries: ledRes.rows as Record<string, unknown>[],
      stock_movements: movRes.rows as Record<string, unknown>[],
      kitchen_orders: kotRes.rows as Record<string, unknown>[],
    };

    const state = rowsToAppState(rows);

    if (needsMenuCatalogPersist(rawInventory)) {
      await saveAppStateToDb(state, restaurantId);
    }

    return state;
  });
}

export async function saveAppStateToDb(
  state: AppState,
  restaurantId: string = DEFAULT_RESTAURANT_ID
): Promise<void> {
  const payload = appStateToDbPayload(state, restaurantId);
  const client = await getPool().connect();

  try {
    await client.query("begin");
    await setRestaurantScope(client, restaurantId);

    await client.query(
      `insert into restaurants (id, name, location, kot_counter, tx_counter, updated_at)
       values ($1, $2, $3, $4, $5, now())
       on conflict (id) do update set
         name = excluded.name,
         location = excluded.location,
         kot_counter = excluded.kot_counter,
         tx_counter = excluded.tx_counter,
         updated_at = now()`,
      [
        payload.restaurant.id,
        payload.restaurant.name,
        payload.restaurant.location,
        payload.restaurant.kot_counter,
        payload.restaurant.tx_counter,
      ]
    );

    for (const table of CHILD_TABLES) {
      await client.query(`delete from ${table} where restaurant_id = $1`, [restaurantId]);
    }

    await insertChildRows(client, payload);

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function insertChildRows(
  client: PoolClient,
  payload: ReturnType<typeof appStateToDbPayload>
) {
  for (const row of payload.tables) {
    await client.query(
      "insert into restaurant_tables (id, restaurant_id, name) values ($1, $2, $3)",
      [row.id, row.restaurant_id, row.name]
    );
  }

  for (const row of payload.staff) {
    await client.query(
      `insert into staff (id, restaurant_id, name, username, password_hash, role, permissions, active, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        row.id,
        row.restaurant_id,
        row.name,
        row.username,
        row.password_hash,
        row.role,
        row.permissions,
        row.active,
        row.created_at,
      ]
    );
  }

  for (const row of payload.inventory) {
    await client.query(
      `insert into inventory_items (
        id, restaurant_id, name, category, stock_on_hand, unit, avg_cost, selling_price, reorder_at, item_type, image_url
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        row.id,
        row.restaurant_id,
        row.name,
        row.category,
        row.stock_on_hand,
        row.unit,
        row.avg_cost,
        row.selling_price,
        row.reorder_at,
        row.item_type,
        row.image_url,
      ]
    );
  }

  for (const row of payload.transactions) {
    await client.query(
      `insert into transactions (id, restaurant_id, tx_type, description, amount, tx_date, category)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        row.id,
        row.restaurant_id,
        row.tx_type,
        row.description,
        row.amount,
        row.tx_date,
        row.category,
      ]
    );
  }

  for (const row of payload.financial_accounts) {
    await client.query(
      `insert into financial_accounts (id, restaurant_id, name, account_type, opening_balance, active)
       values ($1, $2, $3, $4, $5, $6)`,
      [row.id, row.restaurant_id, row.name, row.account_type, row.opening_balance, row.active]
    );
  }

  for (const row of payload.parties) {
    await client.query(
      `insert into parties (id, restaurant_id, name, party_type, phone, note, active)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [row.id, row.restaurant_id, row.name, row.party_type, row.phone, row.note, row.active]
    );
  }

  for (const row of payload.ledger_entries) {
    await client.query(
      `insert into ledger_entries (
        id, restaurant_id, entry_date, description, debit, credit, account_id, party, payment_method, kind
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        row.id,
        row.restaurant_id,
        row.entry_date,
        row.description,
        row.debit,
        row.credit,
        row.account_id,
        row.party,
        row.payment_method,
        row.kind,
      ]
    );
  }

  for (const row of payload.stock_movements) {
    await client.query(
      `insert into stock_movements (
        id, restaurant_id, item_id, item_name, movement_type, qty, note, movement_date
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        row.id,
        row.restaurant_id,
        row.item_id,
        row.item_name,
        row.movement_type,
        row.qty,
        row.note,
        row.movement_date,
      ]
    );
  }

  for (const row of payload.kitchen_orders) {
    await client.query(
      `insert into kitchen_orders (id, restaurant_id, table_name, items, status, priority, created_at)
       values ($1, $2, $3, $4::jsonb, $5, $6, $7)`,
      [
        row.id,
        row.restaurant_id,
        row.table_name,
        JSON.stringify(row.items),
        row.status,
        row.priority,
        row.created_at,
      ]
    );
  }
}

export type StaffAuthRow = {
  id: string;
  restaurant_id: string;
  name: string;
  username: string;
  password_hash: string;
  role: string;
  permissions: string[];
  active: boolean;
};

export async function findActiveStaffByUsername(
  username: string,
  restaurantId: string
): Promise<StaffAuthRow | null> {
  return withRestaurantScope(restaurantId, async (client) => {
    const result = await client.query<StaffAuthRow>(
      `select id, restaurant_id, name, username, password_hash, role, permissions, active
       from staff
       where username = $1 and active = true and restaurant_id = $2
       limit 1`,
      [username, restaurantId]
    );
    return result.rows[0] ?? null;
  });
}

export async function findStaffForPasswordCheck(
  staffId: string,
  restaurantId: string
): Promise<{ id: string; password_hash: string; active: boolean } | null> {
  return withRestaurantScope(restaurantId, async (client) => {
    const result = await client.query<{ id: string; password_hash: string; active: boolean }>(
      `select id, password_hash, active
       from staff
       where id = $1 and restaurant_id = $2
       limit 1`,
      [staffId, restaurantId]
    );
    return result.rows[0] ?? null;
  });
}
