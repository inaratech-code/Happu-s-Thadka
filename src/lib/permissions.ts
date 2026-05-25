export const APP_PERMISSIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Home overview and quick stats",
  },
  {
    id: "pos",
    label: "Point of Sale",
    description: "Cashier, tables, and orders",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    description: "Kitchen display and order status",
  },
  {
    id: "reports",
    label: "Reports",
    description: "Sales and business reports",
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Stock items and movements",
  },
  {
    id: "transactions",
    label: "Transactions",
    description: "Sales, purchases, and expenses",
  },
  {
    id: "accounts",
    label: "Accounts",
    description: "Day book, payments, ledger & accounts",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Restaurant profile and tables",
  },
  {
    id: "staff",
    label: "Staff management",
    description: "Add staff and assign access (admin usually only)",
  },
] as const;

export type AppPermission = (typeof APP_PERMISSIONS)[number]["id"];

export const ALL_PERMISSIONS: AppPermission[] = APP_PERMISSIONS.map((p) => p.id);

/** Longest-prefix match for route → required permission */
export function permissionForPath(pathname: string): AppPermission | null {
  const rules: [string, AppPermission][] = [
    ["/settings/staff", "staff"],
    ["/settings", "settings"],
    ["/inventory", "inventory"],
    ["/transactions", "transactions"],
    ["/accounts", "accounts"],
    ["/reports", "reports"],
    ["/kitchen", "kitchen"],
    ["/pos", "pos"],
    ["/", "dashboard"],
  ];

  for (const [prefix, permission] of rules) {
    if (prefix === "/") {
      if (pathname === "/") return permission;
      continue;
    }
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return permission;
    }
  }
  return null;
}

export function hasPermission(
  session: { role: string; permissions: AppPermission[] } | null,
  permission: AppPermission
): boolean {
  if (!session) return false;
  if (session.role === "admin") return true;
  return session.permissions.includes(permission);
}

export function canAccessPath(
  session: { role: string; permissions: AppPermission[] } | null,
  pathname: string
): boolean {
  const required = permissionForPath(pathname);
  if (!required) return true;
  return hasPermission(session, required);
}

export function canManageStaff(session: { role: string } | null): boolean {
  return session?.role === "admin";
}

export function firstAllowedPath(session: { role: string; permissions: AppPermission[] } | null): string {
  if (!session) return "/login";
  if (session.role === "admin") return "/";
  for (const p of APP_PERMISSIONS) {
    if (session.permissions.includes(p.id)) {
      const path = defaultPathForPermission(p.id);
      if (path) return path;
    }
  }
  return "/login";
}

function defaultPathForPermission(permission: AppPermission): string | null {
  const map: Record<AppPermission, string> = {
    dashboard: "/",
    pos: "/pos",
    kitchen: "/kitchen",
    reports: "/reports",
    inventory: "/inventory",
    transactions: "/transactions",
    accounts: "/accounts",
    settings: "/settings",
    staff: "/settings/staff",
  };
  return map[permission] ?? null;
}
