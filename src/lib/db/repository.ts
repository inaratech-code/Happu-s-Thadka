import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { appStateToDbPayload, rowsToAppState, type DbRows } from "@/lib/db/mappers";
import type { AppState } from "@/lib/types";
import { DEFAULT_RESTAURANT_ID } from "@/lib/env";

const TABLES = [
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

export async function loadAppStateFromDb(restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<AppState> {
  const db = getSupabaseAdmin();

  const { data: restaurant, error: rErr } = await db
    .from("restaurants")
    .select("id, name, location, kot_counter, tx_counter")
    .eq("id", restaurantId)
    .maybeSingle();

  if (rErr) throw rErr;
  if (!restaurant) throw new Error("Restaurant not found. Run Supabase migrations first.");

  const [
    tablesRes,
    staffRes,
    invRes,
    txRes,
    facRes,
    partyRes,
    ledRes,
    movRes,
    kotRes,
  ] = await Promise.all([
    db.from("restaurant_tables").select("id, name").eq("restaurant_id", restaurantId),
    db.from("staff").select("*").eq("restaurant_id", restaurantId),
    db.from("inventory_items").select("*").eq("restaurant_id", restaurantId),
    db.from("transactions").select("*").eq("restaurant_id", restaurantId),
    db.from("financial_accounts").select("*").eq("restaurant_id", restaurantId),
    db.from("parties").select("*").eq("restaurant_id", restaurantId),
    db.from("ledger_entries").select("*").eq("restaurant_id", restaurantId),
    db.from("stock_movements").select("*").eq("restaurant_id", restaurantId),
    db.from("kitchen_orders").select("*").eq("restaurant_id", restaurantId),
  ]);

  const errors = [
    tablesRes.error,
    staffRes.error,
    invRes.error,
    txRes.error,
    facRes.error,
    partyRes.error,
    ledRes.error,
    movRes.error,
    kotRes.error,
  ].filter(Boolean);

  if (errors.length) throw errors[0];

  const rows: DbRows = {
    restaurant,
    tables: tablesRes.data ?? [],
    staff: staffRes.data ?? [],
    inventory: invRes.data ?? [],
    transactions: txRes.data ?? [],
    financial_accounts: facRes.data ?? [],
    parties: partyRes.data ?? [],
    ledger_entries: ledRes.data ?? [],
    stock_movements: movRes.data ?? [],
    kitchen_orders: kotRes.data ?? [],
  };

  return rowsToAppState(rows);
}

export async function saveAppStateToDb(
  state: AppState,
  restaurantId: string = DEFAULT_RESTAURANT_ID
): Promise<void> {
  const db = getSupabaseAdmin();
  const payload = appStateToDbPayload(state, restaurantId);

  const { error: upErr } = await db.from("restaurants").upsert({
    ...payload.restaurant,
    updated_at: new Date().toISOString(),
  });
  if (upErr) throw upErr;

  for (const table of TABLES) {
    const { error: delErr } = await db.from(table).delete().eq("restaurant_id", restaurantId);
    if (delErr) throw delErr;
  }

  const inserts: PromiseLike<{ error: unknown }>[] = [];

  if (payload.tables.length) {
    inserts.push(db.from("restaurant_tables").insert(payload.tables));
  }
  if (payload.staff.length) {
    inserts.push(db.from("staff").insert(payload.staff));
  }
  if (payload.inventory.length) {
    inserts.push(db.from("inventory_items").insert(payload.inventory));
  }
  if (payload.transactions.length) {
    inserts.push(db.from("transactions").insert(payload.transactions));
  }
  if (payload.financial_accounts.length) {
    inserts.push(db.from("financial_accounts").insert(payload.financial_accounts));
  }
  if (payload.parties.length) {
    inserts.push(db.from("parties").insert(payload.parties));
  }
  if (payload.ledger_entries.length) {
    inserts.push(db.from("ledger_entries").insert(payload.ledger_entries));
  }
  if (payload.stock_movements.length) {
    inserts.push(db.from("stock_movements").insert(payload.stock_movements));
  }
  if (payload.kitchen_orders.length) {
    inserts.push(db.from("kitchen_orders").insert(payload.kitchen_orders));
  }

  const results = await Promise.all(inserts);
  const insertErr = results.find((r) => r.error)?.error;
  if (insertErr) throw insertErr;
}
