"use client";

import { useEffect, useRef } from "react";
import { useNotifications } from "@/providers/NotificationProvider";
import { AppNotification } from "@/types/notifications";

export function NotificationHydrator() {
  const hasHydrated = useRef(false);
  const { hydrateNotifications } = useNotifications();

  useEffect(() => {
    // Prevent duplicate hydration in StrictMode
    if (hasHydrated.current) return;

    hasHydrated.current = true;

    const hydrate = async () => {
      try {
        const res = await fetch("/api/notifications?limit=20", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to hydrate notifications");
        }

        const data: {
          success: boolean;
          notifications: AppNotification[];
        } = await res.json();

        if (data.success && Array.isArray(data.notifications)) {
          hydrateNotifications(data.notifications);
        }
      } catch (error) {
        console.error("[NotificationHydrator]", error);
      }
    };

    hydrate();
  }, []);

  return null;
}
