"use client";

import { Suspense } from "react";
import { PaymentsView } from "@/components/accounts/payments-view";

function PaymentsPageContent() {
  return <PaymentsView />;
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <PaymentsPageContent />
    </Suspense>
  );
}
