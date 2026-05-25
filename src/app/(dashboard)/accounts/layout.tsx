"use client";

import { AccountsSubnav } from "@/components/accounts/accounts-subnav";

export default function AccountsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1100px] w-full min-w-0 space-y-5">
      <AccountsSubnav />
      {children}
    </div>
  );
}
