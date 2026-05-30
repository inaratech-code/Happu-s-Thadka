import type { NavItem } from "./types";

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Operations",
    href: "/",
    icon: "Zap",
    children: [
      { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
      {
        label: "Point of Sale",
        href: "/pos",
        icon: "Monitor",
        children: [
          { label: "Menu", href: "/pos", icon: "Monitor" },
          { label: "Orders", href: "/pos/orders", icon: "ClipboardList" },
        ],
      },
      { label: "Kitchen", href: "/kitchen", icon: "ChefHat" },
    ],
  },
  { label: "Reports", href: "/reports", icon: "BarChart3" },
  {
    label: "Inventory",
    href: "/inventory",
    icon: "Package",
    children: [
      { label: "Items", href: "/inventory", icon: "Package" },
      { label: "Stock Movement", href: "/inventory/movement", icon: "ArrowUpDown" },
    ],
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: "Receipt",
    children: [
      { label: "Overview", href: "/transactions", icon: "LayoutGrid" },
      { label: "Sales", href: "/transactions/sales", icon: "ShoppingCart" },
      { label: "Purchases", href: "/transactions/purchases", icon: "Truck" },
      { label: "Expenses", href: "/transactions/expenses", icon: "Wallet" },
    ],
  },
  {
    label: "Accounts",
    href: "/accounts",
    icon: "BookOpen",
    children: [
      { label: "Overview", href: "/accounts", icon: "LayoutGrid" },
      { label: "Day book", href: "/accounts/day-book", icon: "CalendarDays" },
      { label: "Payments", href: "/accounts/payments", icon: "CreditCard" },
      { label: "Financial accounts", href: "/accounts/financial", icon: "Landmark" },
      { label: "Ledger & parties", href: "/accounts/ledger", icon: "BookOpen" },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "Settings",
    children: [
      { label: "Staff", href: "/settings/staff", icon: "Users" },
      { label: "Menu catalog", href: "/settings/menu", icon: "UtensilsCrossed" },
      { label: "Settings", href: "/settings", icon: "Settings" },
    ],
  },
];
