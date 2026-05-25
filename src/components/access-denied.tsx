"use client";

import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied({ onGoBack }: { onGoBack: () => void }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
        <ShieldOff className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold">No access to this page</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        Your account does not have permission for this section. Ask the admin to update your access in Staff settings.
      </p>
      <Button className="mt-6" size="sm" onClick={onGoBack}>
        Go to allowed page
      </Button>
    </div>
  );
}
