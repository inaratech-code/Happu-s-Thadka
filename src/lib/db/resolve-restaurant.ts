import type { SessionPayload } from "@/lib/auth/session-server";
import { getFixedWorkspaceId } from "@/lib/env";
import { getTenantBySlug } from "@/lib/db/tenant";

/** Validates session against fixed workspace tenant, returns restaurant id. */
export async function resolveRestaurantId(session: SessionPayload): Promise<string> {
  const tenant = await getTenantBySlug(getFixedWorkspaceId());
  if (!tenant) {
    throw new Error("Workspace is not configured in the database");
  }
  if (tenant.restaurant_id !== session.restaurantId) {
    throw new Error("Session does not match this workspace");
  }
  return session.restaurantId;
}
