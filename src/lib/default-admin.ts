import type { StaffMember } from "./types";
import { ALL_PERMISSIONS } from "./permissions";

/** Precomputed SHA-256 of `admin123` + app salt — avoids async crypto hang on first boot */
export const DEFAULT_ADMIN_PASSWORD_HASH =
  "sha256:1b7c28130c4cd4ce18cf41d28fca82a8d98daf7e5b2e8a054a3daab0fa543170";

export const DEFAULT_ADMIN: StaffMember = {
  id: "admin-default",
  name: "Admin",
  username: "admin",
  passwordHash: DEFAULT_ADMIN_PASSWORD_HASH,
  role: "admin",
  permissions: ALL_PERMISSIONS,
  active: true,
  createdAt: "2020-01-01T00:00:00.000Z",
};
