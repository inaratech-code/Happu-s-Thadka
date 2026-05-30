"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeToPushNotifications } from "@/lib/pwa-push";

export function PushNotificationsSection() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const enable = async () => {
    setLoading(true);
    setMessage(null);
    const result = await subscribeToPushNotifications();
    setLoading(false);
    if (result.ok) {
      setMessage("You will get alerts for new kitchen orders.");
    } else {
      setMessage(result.error);
    }
  };

  return (
    <div className="surface-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold">Alerts</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Get a ping when a new kitchen order comes in.
      </p>
      <Button size="sm" onClick={() => void enable()} disabled={loading}>
        {loading ? "One moment…" : "Turn on alerts"}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
