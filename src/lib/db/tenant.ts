import { getSql } from "@/lib/db/client";

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  restaurant_id: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let tenantCache: { slug: string; tenant: Tenant; expiresAt: number } | null = null;

/** Global tenant lookup (RLS allows SELECT on tenants). Cached for fixed workspace. */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const now = Date.now();
  if (tenantCache && tenantCache.slug === normalized && tenantCache.expiresAt > now) {
    return tenantCache.tenant;
  }

  const sql = getSql();
  const rows = (await sql`
    SELECT id, slug, name, restaurant_id
    FROM tenants
    WHERE slug = ${normalized}
    LIMIT 1
  `) as Tenant[];

  const tenant = rows[0] ?? null;
  if (tenant) {
    tenantCache = { slug: normalized, tenant, expiresAt: now + CACHE_TTL_MS };
  }
  return tenant;
}

export async function requireTenantBySlug(slug: string): Promise<Tenant> {
  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    throw new Error(`Workspace not found: ${slug.trim()}`);
  }
  return tenant;
}
