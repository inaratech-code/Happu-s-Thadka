"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isPushConfigured, subscribeToPushNotifications } from "@/lib/pwa-push";

export function PushNotificationsSection() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const configured = isPushConfigured();

  const enable = async () => {
    setLoading(true);
    setMessage(null);
    const result = await subscribeToPushNotifications();
    setLoading(false);
    if (result.ok) {
      setMessage("Notifications enabled for this device.");
    } else {
      setMessage(result.error);
    }
  };

  return (
    <div className="surface-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold">Push notifications</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Get alerts for kitchen orders and sync status. Requires VAPID keys on the server
        (see <code className="text-[11px]">.env.example</code>).
      </p>
      <Button size="sm" onClick={() => void enable()} disabled={loading || !configured}>
        {loading ? "Enabling…" : "Enable notifications"}
      </Button>
      {!configured ? (
        <p className="text-xs text-amber-400/90">Push not configured — add VAPID keys to enable.</p>
      ) : null}
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
