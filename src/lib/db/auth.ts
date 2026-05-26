import { verifyPassword } from "@/lib/password";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import type { AppPermission } from "@/lib/permissions";
import type { SessionPayload } from "@/lib/auth/session-server";
import { getTenantBySlug, type Tenant } from "@/lib/db/tenant";
import { withRestaurantScope } from "@/lib/db/scope";
import type { StaffAuthRow } from "@/lib/db/repository";

export type LoginResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; status: number; error: string };

export async function loginWithCredentials(
  workspace: string,
  username: string,
  password: string
): Promise<LoginResult> {
  const tenant = await getTenantBySlug(workspace);
  if (!tenant) {
    return { ok: false, status: 404, error: "Workspace not found" };
  }

  const member = await lookupStaff(tenant, username);
  if (!member) {
    return {
      ok: false,
      status: 401,
      error: "Username not found or account is disabled for this workspace",
    };
  }

  const valid = await verifyPassword(password, member.password_hash);
  if (!valid) {
    return { ok: false, status: 401, error: "Incorrect password" };
  }

  const role = member.role as "admin" | "staff";
  const permissions =
    role === "admin" ? ALL_PERMISSIONS : ((member.permissions ?? []) as AppPermission[]);

  return {
    ok: true,
    session: {
      staffId: member.id,
      restaurantId: member.restaurant_id,
      tenantSlug: tenant.slug,
      restaurantName: tenant.name,
      username: member.username,
      name: member.name,
      role,
      permissions,
    },
  };
}

async function lookupStaff(tenant: Tenant, username: string): Promise<StaffAuthRow | null> {
  return withRestaurantScope(tenant.restaurant_id, async (client) => {
    const result = await client.query<StaffAuthRow>(
      `select id, restaurant_id, name, username, password_hash, role, permissions, active
       from staff
       where username = $1 and active = true and restaurant_id = $2
       limit 1`,
      [username, tenant.restaurant_id]
    );
    return result.rows[0] ?? null;
  });
}
