import type { NavItem } from "./types";
import type { AuthSession } from "./types";
import { hasPermission, permissionForPath } from "./permissions";

function canSeeHref(session: AuthSession | null, href: string): boolean {
  const permission = permissionForPath(href);
  if (!permission) return true;
  return hasPermission(session, permission);
}

export function filterNavItems(items: NavItem[], session: AuthSession | null): NavItem[] {
  return items
    .map((item) => {
      if (item.children?.length) {
        const children = item.children.filter((child) => canSeeHref(session, child.href));
        if (children.length === 0) return null;
        return { ...item, children };
      }
      if (!canSeeHref(session, item.href)) return null;
      return item;
    })
    .filter((item): item is NavItem => item !== null);
}
