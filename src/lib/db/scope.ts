import type { PoolClient } from "@neondatabase/serverless";
import { getPool } from "@/lib/db/client";

const RESTAURANT_SETTING = "app.restaurant_id";

/** Bind Postgres session to one restaurant (required for RLS policies). */
export async function setRestaurantScope(
  client: PoolClient,
  restaurantId: string
): Promise<void> {
  await client.query(`SELECT set_config('${RESTAURANT_SETTING}', $1, true)`, [restaurantId]);
}

/** Run queries on a dedicated connection scoped to one restaurant. */
export async function withRestaurantScope<T>(
  restaurantId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await setRestaurantScope(client, restaurantId);
    return await fn(client);
  } finally {
    client.release();
  }
}
