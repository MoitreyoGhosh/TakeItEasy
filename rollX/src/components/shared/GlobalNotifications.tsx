"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Check,
  Clock3,
  LoaderCircle,
  PlayCircle,
  Square,
  X,
} from "lucide-react";
import { useNotifications } from "@/providers/NotificationProvider";
import {
  AppNotification,
  ManualRequestNotification,
  SessionEndedNotification,
  SessionStartedNotification,
} from "@/types/notifications";
import Link from "next/link";

const getPopupDuration = (notification: AppNotification) => {
  switch (notification.type) {
    case "manual_request":
      return 15000;
    case "session_started":
      return 8000;
    case "session_ended":
      return 6000;
    case "announcement":
      return 10000;
    default:
      return 8000;
  }
};

const isPopupVisible = (notification: AppNotification) => {
  return (
    notification.visible !== false &&
    !notification.archived &&
    !notification.popupSeen &&
    !notification.read &&
    notification.type !== "session_ended" &&
    notification.status !== "approved" &&
    notification.status !== "rejected"
  );
};

const getDatabaseId = (notification: ManualRequestNotification) => {
  return notification.databaseId;
};

const getUiId = (notification: ManualRequestNotification) => {
  return notification.id;
};

export const GlobalNotifications = () => {
  const {
    notifications,
    markAsRead,
    archiveNotification,
    approveNotification,
    rejectNotification,
    hideNotification,
    markPopupSeen,
  } = useNotifications();

  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const visibleNotifications = useMemo(() => {
    return notifications.filter(isPopupVisible).slice(0, 3);
  }, [notifications]);

  // Auto dismiss popup notifications
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    visibleNotifications.forEach((notification) => {
      const duration = getPopupDuration(notification);

      // Persistent popup
      if (!duration) {
        return;
      }

      const timer = setTimeout(async () => {
        markPopupSeen(notification.id);

        if (notification.type !== "manual_request" && notification.databaseId) {
          try {
            await fetch(`/api/notifications/${notification.databaseId}/read`, {
              method: "PATCH",
            });

            markAsRead(notification.id);
          } catch (error) {
            console.error("Failed to mark notification as read:", error);
          }
        }

        hideNotification(notification.id);
      }, duration);
      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [visibleNotifications, hideNotification, markAsRead, markPopupSeen]);

  // Approve Request
  const handleApprove = async (notification: ManualRequestNotification) => {
    const uiId = getUiId(notification);

    if (processingIds.includes(uiId)) {
      return;
    }

    try {
      setProcessingIds((prev) => [...prev, uiId]);

      const res = await fetch(
        `/api/sessions/${notification.data.sessionId}/manual-add`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            studentId: notification.data.studentId,
          }),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to approve");
      }

      approveNotification(uiId);

      markAsRead(uiId);

      const databaseId = getDatabaseId(notification);

      if (databaseId) {
        await fetch(`/api/notifications/${databaseId}/archive`, {
          method: "PATCH",
        });
      }

      archiveNotification(uiId);

      toast.success("Attendance approved");

      setTimeout(() => {
        hideNotification(uiId);
      }, 1200);
    } catch (err) {
      console.error(err);

      toast.error("Failed to approve request");
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== uiId));
    }
  };

  // Reject Request
  const handleReject = async (notification: ManualRequestNotification) => {
    const uiId = getUiId(notification);

    if (processingIds.includes(uiId)) {
      return;
    }

    try {
      setProcessingIds((prev) => [...prev, uiId]);

      const res = await fetch(
        `/api/sessions/${notification.data.sessionId}/manual-reject`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            studentId: notification.data.studentId,
          }),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to reject");
      }

      rejectNotification(uiId);

      markAsRead(uiId);

      const databaseId = getDatabaseId(notification);

      if (databaseId) {
        await fetch(`/api/notifications/${databaseId}/archive`, {
          method: "PATCH",
        });
      }

      archiveNotification(uiId);

      toast.info("Attendance request rejected");

      setTimeout(() => {
        hideNotification(uiId);
      }, 1200);
    } catch (err) {
      console.error(err);

      toast.error("Failed to reject request");
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== uiId));
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 flex w-[360px] flex-col gap-3">
      {visibleNotifications.map((notification) => {
        // -------------------------
        // MANUAL REQUEST
        // -------------------------
        if (notification.type === "manual_request") {
          const n = notification;

          const isProcessing = processingIds.includes(n.id);

          return (
            <Card
              key={n.id}
              className="
                overflow-hidden
                border-border/60
                bg-background/95
                backdrop-blur-md
                shadow-2xl
                animate-in
                slide-in-from-right-5
                fade-in
                duration-300
              "
            >
              {/* Header */}
              <div className="flex items-start justify-between px-4 pt-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />

                    <p className="text-sm font-semibold">{n.data.name}</p>
                  </div>

                  {n.data.rollNo && (
                    <p className="text-xs text-muted-foreground">
                      {n.data.rollNo}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  Just now
                </div>
              </div>

              {/* Body */}
              {n.data.reason && (
                <div className="px-4 pt-3">
                  <div className="rounded-md border bg-muted/30 px-3 py-2">
                    <p className="text-sm italic text-muted-foreground">
                      "{n.data.reason}"
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 px-4 py-4">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={isProcessing}
                  onClick={() => handleApprove(n)}
                >
                  {isProcessing ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  disabled={isProcessing}
                  onClick={() => handleReject(n)}
                >
                  {isProcessing ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="mr-1 h-4 w-4" />
                      Reject
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        }

        // -------------------------
        // SESSION STARTED
        // -------------------------
        if (notification.type === "session_started") {
          const n = notification as SessionStartedNotification;

          return (
            <Card
              key={n.id}
              className="
                overflow-hidden
                border-border/60
                bg-background/95
                backdrop-blur-md
                shadow-2xl
                animate-in
                slide-in-from-right-5
                fade-in
                duration-300
              "
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-5 w-5 text-green-500" />

                  <div className="flex-1">
                    <p className="text-sm font-semibold">Session Started</p>

                    <p className="text-xs text-muted-foreground">
                      {n.data.groupName || "Your class"} is now live.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        }

        // -------------------------
        // SESSION ENDED
        // -------------------------
        if (notification.type === "session_ended") {
          const n = notification as SessionEndedNotification;

          return (
            <Card
              key={n.id}
              className="
                overflow-hidden
                border-border/60
                bg-background/95
                backdrop-blur-md
                shadow-2xl
                animate-in
                slide-in-from-right-5
                fade-in
                duration-300
              "
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Square className="h-5 w-5 text-red-500" />

                  <div className="flex-1">
                    <p className="text-sm font-semibold">Session Ended</p>

                    <p className="text-xs text-muted-foreground">
                      {n.data.groupName || "Your class"} has ended.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        }

        return null;
      })}
    </div>
  );
};
