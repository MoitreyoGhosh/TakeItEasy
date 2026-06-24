"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useSession } from "next-auth/react";
import { AppNotification } from "@/types/notifications";

type NotificationContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (n: AppNotification) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => void;
  hydrateNotifications: (notifications: AppNotification[]) => void;
  updateNotification: (
    id: string,
    updater: (notification: AppNotification) => AppNotification,
  ) => void;
  refreshNotifications: () => Promise<void>;
  approveNotification: (id: string) => void;
  rejectNotification: (id: string) => void;
  archiveNotification: (id: string) => void;
  hideNotification: (id: string) => void;
  markPopupSeen: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  addNotification: () => {},
  removeNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: async () => {},
  clearAllNotifications: () => {},
  hydrateNotifications: () => {},
  updateNotification: () => {},
  refreshNotifications: async () => {},
  approveNotification: () => {},
  rejectNotification: () => {},
  archiveNotification: () => {},
  hideNotification: () => {},
  markPopupSeen: () => {},
});

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Ref to prevent multiple hydrations on mount
  const hasHydratedRef = useRef(false);
  // Add a new notification to the list
  const addNotification = useCallback((notification: AppNotification) => {
    setNotifications((prev) => {
      const key = notification.databaseId || notification.id;

      const alreadyExists = prev.some((n) => (n.databaseId || n.id) === key);

      if (alreadyExists) return prev;

      return [
        {
          ...notification,
          read: notification.read ?? false,
          visible: notification.visible ?? true,
          popupSeen: notification.popupSeen ?? false,
        },
        ...prev,
      ];
    });
  }, []);

  // Remove a notification by ID
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Hide a notification (set visible to false)
  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              visible: false,
            }
          : notification,
      ),
    );
  }, []);

  // Hydrate notifications - merge incoming with existing, avoiding duplicates
  const hydrateNotifications = useCallback((incoming: AppNotification[]) => {
    setNotifications((prev) => {
      const map = new Map<string, AppNotification>();

      // First add existing local state
      prev.forEach((notification) => {
        const key = notification.databaseId || notification.id;

        map.set(key, notification);
      });

      // Merge incoming carefully
      incoming.forEach((incomingNotification) => {
        const key = incomingNotification.databaseId || incomingNotification.id;

        const existing = map.get(key);

        // If local notification already resolved,
        // NEVER allow stale server state to overwrite it
        if (
          existing &&
          (existing.archived ||
            existing.status === "approved" ||
            existing.status === "rejected")
        ) {
          return;
        }

        // Ignore archived notifications from server
        if (incomingNotification.archived) {
          return;
        }

        console.log(
          "HYDRATE",
          incomingNotification.id,
          incomingNotification.type,
        );

        map.set(key, {
          ...incomingNotification,

          // Preserve local UI state
          visible: existing?.visible ?? incomingNotification.visible ?? true,

          read: existing?.read ?? incomingNotification.read ?? false,

          archived:
            existing?.archived ?? incomingNotification.archived ?? false,

          status: existing?.status ?? incomingNotification.status,

          popupSeen:
            existing?.popupSeen ?? incomingNotification.popupSeen ?? false,
        });
      });

      return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
    });
  }, []);

  // Refresh notifications from the server
  const refreshNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications?limit=20", {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = await res.json();
      if (!data?.notifications) return;
      hydrateNotifications(data.notifications);
    } catch (error) {
      console.error("[Notification Refresh Error]", error);
    } finally {
      setIsLoading(false);
    }
  }, [hydrateNotifications]);

  // Update a notification by ID using an updater function
  const updateNotification = useCallback(
    (
      id: string,
      updater: (notification: AppNotification) => AppNotification,
    ) => {
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.id !== id) return n;

          return updater(n);
        }),
      );
    },
    [],
  );

  // Approve a notification (manual attendance request)
  const approveNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              status: "approved",
              read: true,
            }
          : n,
      ),
    );
  }, []);

  // Reject a notification (manual attendance request)
  const rejectNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              status: "rejected",
              read: true,
            }
          : n,
      ),
    );
  }, []);

  // Archive a notification
  const archiveNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              archived: true,
            }
          : n,
      ),
    );
  }, []);

  // Mark a single notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              read: true,
            }
          : n,
      ),
    );
  }, []);

  // Mark All Notifications as Read
  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
        })),
      );

      await fetch("/api/notifications", {
        method: "PATCH",
      });
    } catch (error) {
      console.error("[Mark All Notifications Error]", error);
    }
  }, []);

  // Clear all notifications from the UI
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Mark popup as seen (used to prevent showing the same notification popup multiple times)
  const markPopupSeen = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              popupSeen: true,
            }
          : notification,
      ),
    );
  }, []);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read && !n.archived).length;
  }, [notifications]);

  // On mount, hydrate notifications if authenticated
  useEffect(() => {
    if (status !== "authenticated") return;
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    refreshNotifications();
  }, [status, refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        hydrateNotifications,
        updateNotification,
        refreshNotifications,
        approveNotification,
        rejectNotification,
        archiveNotification,
        hideNotification,
        markPopupSeen,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
