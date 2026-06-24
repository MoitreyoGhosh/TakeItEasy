"use client";

import Link from "next/link";
import {
  Bell,
  Check,
  Clock3,
  LoaderCircle,
  PlayCircle,
  Square,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AppNotification,
  ManualRequestNotification,
} from "@/types/notifications";

interface NotificationCardProps {
  notification: AppNotification;
  processing?: boolean;
  onApprove?: (notification: ManualRequestNotification) => void;
  onReject?: (notification: ManualRequestNotification) => void;
  onRead?: (id: string) => void;
}

// Utility to format timestamp into "time ago" format
const formatTimeAgo = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export function NotificationCard({
  notification,
  processing = false,
  onApprove,
  onReject,
  onRead,
}: NotificationCardProps) {
  const unread = !notification.read;

  return (
    <div
      className={`
        border-b last:border-b-0
        px-4 py-4
        transition-colors
        hover:bg-muted/40
        ${unread ? "bg-primary/5" : ""}
      `}
      onClick={() => onRead?.(notification.id)}
    >
      <div className="flex items-start gap-3">
        {/* ICON */}
        <div className="mt-1">
          {notification.type === "manual_request" && (
            <Bell className="h-5 w-5 text-primary" />
          )}
          {notification.type === "session_started" && (
            <PlayCircle className="h-5 w-5 text-green-500" />
          )}
          {notification.type === "session_ended" && (
            <Square className="h-5 w-5 text-red-500" />
          )}
        </div>

        {/* CONTENT */}
        <div className="min-w-0 flex-1">
          {/* TOP */}
          <div className="flex items-start justify-between gap-2">
            <div>
              {/* MANUAL REQUEST */}
              {notification.type === "manual_request" && (
                <>
                  <p className="text-sm font-semibold">
                    {notification.data.name}
                  </p>
                  {notification.data.rollNo && (
                    <p className="text-xs text-muted-foreground">
                      {notification.data.rollNo}
                    </p>
                  )}
                </>
              )}

              {/* SESSION START */}
              {notification.type === "session_started" && (
                <>
                  <p className="text-sm font-semibold">Session Started</p>

                  <p className="text-xs text-muted-foreground">
                    {notification.data.groupName || "Your class"} is now live
                  </p>
                </>
              )}

              {/* SESSION END */}
              {notification.type === "session_ended" && (
                <>
                  <p className="text-sm font-semibold">Session Ended</p>

                  <p className="text-xs text-muted-foreground">
                    {notification.data.groupName || "Your class"} has ended
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {notification.status && (
                <Badge
                  variant={
                    notification.status === "approved"
                      ? "default"
                      : notification.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                  className="capitalize"
                >
                  {notification.status}
                </Badge>
              )}

              {unread && <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>
          </div>

          {/* REASON */}
          {notification.type === "manual_request" &&
            notification.data.reason && (
              <div className="mt-3 rounded-md border bg-muted/30 px-3 py-2">
                <p className="text-sm italic text-muted-foreground">
                  "{notification.data.reason}"
                </p>
              </div>
            )}

          {/* FOOTER */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock3 className="h-3 w-3" />
              {formatTimeAgo(notification.createdAt)}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2">
              {/* SESSION STARTED */}
              {notification.type === "session_started" && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/group/${notification.data.groupId}`}>Open</Link>
                </Button>
              )}

              {/* MANUAL REQUEST */}
              {notification.type === "manual_request" &&
                notification.status !== "approved" &&
                notification.status !== "rejected" && (
                  <>
                    <Button
                      size="sm"
                      disabled={processing}
                      onClick={(e) => {
                        e.stopPropagation();

                        onApprove?.(notification);
                      }}
                    >
                      {processing ? (
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
                      disabled={processing}
                      onClick={(e) => {
                        e.stopPropagation();

                        onReject?.(notification);
                      }}
                    >
                      {processing ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </>
                      )}
                    </Button>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
