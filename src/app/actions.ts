"use server";

import { getSql } from "@/lib/db/client";
import type { Tenant } from "@/lib/db/tenant";

export async function listTenants(): Promise<Tenant[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, slug, name, restaurant_id
    FROM tenants
    ORDER BY slug
  `;
  return rows as Tenant[];
}

export async function getTenantBySlugAction(slug: string): Promise<Tenant | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const sql = getSql();
  const rows = (await sql`
    SELECT id, slug, name, restaurant_id
    FROM tenants
    WHERE slug = ${normalized}
    LIMIT 1
  `) as Tenant[];
  return rows[0] ?? null;
}
