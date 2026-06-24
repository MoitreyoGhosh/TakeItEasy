"use client";

import { useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/providers/NotificationProvider";
import {
  ManualRequestNotification,
  AppNotification,
} from "@/types/notifications";
import { NotificationCard } from "@/components/notifications/NotificationCard";

type NotificationTab = "unread" | "read" | "archived";

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    approveNotification,
    rejectNotification,
    archiveNotification,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<NotificationTab>("unread");
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (activeTab === "archived") {
        return notification.archived;
      }
      if (activeTab === "read") {
        return notification.read && !notification.archived;
      }
      return !notification.read && !notification.archived;
    });
  }, [notifications, activeTab]);

  // Handle Approve / Reject for Manual Attendance Requests
  const handleApprove = async (notification: ManualRequestNotification) => {
    if (processingIds.includes(notification.id)) {
      return;
    }

    try {
      setProcessingIds((prev) => [...prev, notification.id]);

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
      approveNotification(notification.id);
      markAsRead(notification.id);

      if (notification.databaseId) {
        await fetch(`/api/notifications/${notification.databaseId}/archive`, {
          method: "PATCH",
        });
      }
      archiveNotification(notification.id);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== notification.id));
    }
  };

  const handleReject = async (notification: ManualRequestNotification) => {
    if (processingIds.includes(notification.id)) {
      return;
    }
    try {
      setProcessingIds((prev) => [...prev, notification.id]);
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
      rejectNotification(notification.id);
      markAsRead(notification.id);

      if (notification.databaseId) {
        await fetch(`/api/notifications/${notification.databaseId}/archive`, {
          method: "PATCH",
        });
      }
      archiveNotification(notification.id);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== notification.id));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />

          {unreadCount > 0 && (
            <span
              className="
                absolute -right-1 -top-1
                flex h-5 min-w-5 items-center justify-center
                rounded-full
                bg-primary px-1
                text-[10px] font-bold text-primary-foreground
              "
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[420px] overflow-hidden p-0"
      >
        {/* HEADER */}
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Notifications</h3>

              <p className="text-xs text-muted-foreground">
                {unreadCount} unread
              </p>
            </div>

            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="mr-1 h-4 w-4" />
                Mark all
              </Button>
            )}
          </div>

          {/* TABS */}
          <div className="mt-4 flex gap-2">
            {(["unread", "read", "archived"] as NotificationTab[]).map(
              (tab) => (
                <Button
                  key={tab}
                  size="sm"
                  variant={activeTab === tab ? "default" : "outline"}
                  className="capitalize"
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </Button>
              ),
            )}
          </div>
        </div>

        {/* CONTENT */}
        <ScrollArea className="max-h-[550px]">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification as AppNotification}
                processing={processingIds.includes(notification.id)}
                onRead={markAsRead}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
