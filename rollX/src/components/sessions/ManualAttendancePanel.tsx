"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { useNotifications } from "@/providers/NotificationProvider";
import { ManualRequestNotification } from "@/types/notifications";

interface PopulatedMember {
  _id: string;
  name: string;
  profile?: {
    fullName?: string;
    universityRollNo?: string;
  } | null;
}

interface TransformedNotification {
  databaseId: string;
  sessionId: string;
  studentId: string;
  name?: string;
  rollNo?: string;
  reason?: string;
  createdAt?: string;
  read?: boolean;
}

export function ManualAttendancePanel({
  groupId,
  members,
  sessionId,
  onManualApprove,
}: {
  groupId: string;
  members?: PopulatedMember[];
  sessionId?: string;
  onManualApprove?: (studentId: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [localRequests, setLocalRequests] = useState<
    ManualRequestNotification[]
  >([]);
  const processingRef = useRef<Set<string>>(new Set());

  const {
    notifications,
    hydrateNotifications,
    markAsRead,
    archiveNotification,
    approveNotification,
    rejectNotification,
    hideNotification,
  } = useNotifications();

  // Hydrate pending requests on mount
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const fetchPendingRequests = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/manual-requests`);

        if (!res.ok) {
          throw new Error("Failed to hydrate requests");
        }

        const data = await res.json();

        // Transform API response to match ManualRequestNotification structure
        const transformedNotifications: ManualRequestNotification[] = data.map(
          (req: TransformedNotification) => ({
            id: `manual_${req.databaseId}`,
            databaseId: req.databaseId,
            type: "manual_request",
            createdAt: new Date(req.createdAt || Date.now()).getTime(),
            read: req.read ?? false,
            status: "pending",
            archived: false,
            data: {
              sessionId: req.sessionId,
              groupId,
              studentId: req.studentId,
              name: req.name,
              rollNo: req.rollNo,
              reason: req.reason,
            },
          }),
        );

        hydrateNotifications(transformedNotifications);
      } catch (error) {
        console.error("Hydration failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingRequests();
  }, [sessionId, groupId, hydrateNotifications]);

  // Sync local pending requests with global notifications
  useEffect(() => {
    const filtered = notifications.filter(
      (n): n is ManualRequestNotification =>
        n.type === "manual_request" &&
        n.data.groupId === groupId &&
        !n.archived &&
        n.status !== "approved" &&
        n.status !== "rejected",
    );

    setLocalRequests(filtered);
  }, [notifications, groupId]);

  // Approve manual attendance
  const approveManualAttendance = async (
    studentId: string,
    reqSessionId: string,
  ) => {
    const notification = localRequests.find(
      (req) =>
        req.data.studentId === studentId && req.data.sessionId === reqSessionId,
    );

    if (!notification) {
      return;
    }
    const uiId = notification.id;

    if (processingRef.current.has(uiId)) {
      return;
    }

    processingRef.current.add(uiId);

    try {
      const res = await fetch(`/api/sessions/${reqSessionId}/manual-add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      // Persist archive in MongoDB
      if (notification.databaseId) {
        await fetch(`/api/notifications/${notification.databaseId}/archive`, {
          method: "PATCH",
        });
      }

      // Remove locally immediately
      setLocalRequests((prev) => prev.filter((req) => req.id !== uiId));

      // Sync provider
      markAsRead(uiId);
      archiveNotification(uiId);
      approveNotification(uiId);
      hideNotification(uiId);

      toast.success("Attendance approved");
      onManualApprove?.(studentId);
    } catch {
      toast.error("Failed to approve attendance");
    } finally {
      processingRef.current.delete(uiId);
    }
  };

  // Reject manual attendance
  const rejectManualAttendance = async (
    studentId: string,
    reqSessionId: string,
  ) => {
    const notification = localRequests.find(
      (req) =>
        req.data.studentId === studentId && req.data.sessionId === reqSessionId,
    );

    if (!notification) {
      return;
    }
    const uiId = notification.id;

    if (processingRef.current.has(uiId)) {
      return;
    }
    processingRef.current.add(uiId);

    try {
      const res = await fetch(`/api/sessions/${reqSessionId}/manual-reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message);
      }

      // Persist archive in MongoDB
      if (notification.databaseId) {
        await fetch(`/api/notifications/${notification.databaseId}/archive`, {
          method: "PATCH",
        });
      }

      // Remove locally immediately
      setLocalRequests((prev) => prev.filter((req) => req.id !== uiId));

      // Sync provider
      markAsRead(uiId);
      archiveNotification(uiId);
      rejectNotification(uiId);
      hideNotification(uiId);

      toast.info("Request rejected");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to reject attendance");
    } finally {
      processingRef.current.delete(uiId);
    }
  };

  // Helper to get member info for fallback display when name/rollNo is missing in the notification
  const getFallbackMember = (id: string) => {
    return members?.find((m) => m._id === id);
  };

  // Show loading state while fetching pending requests
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Manual Attendance Requests
          </CardTitle>
        </CardHeader>

        <CardContent className="flex justify-center py-4">
          <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // If there are no pending requests, don't render anything
  if (localRequests.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm animate-fade-in">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Pending Requests ({localRequests.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {localRequests.map((req) => {
          const fallback = getFallbackMember(req.data.studentId);

          const name =
            req.data.name ||
            fallback?.profile?.fullName ||
            fallback?.name ||
            "Unknown Student";

          const roll =
            req.data.rollNo || fallback?.profile?.universityRollNo || "";

          return (
            <div
              key={req.id}
              className="flex items-center justify-between border p-3 rounded-md bg-background"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>

                <p className="text-xs text-muted-foreground">{roll}</p>

                {req.data.reason && (
                  <p className="text-xs text-muted-foreground italic mt-1">
                    "{req.data.reason}"
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={processingRef.current.has(req.id)}
                  onClick={() =>
                    approveManualAttendance(
                      req.data.studentId,
                      req.data.sessionId,
                    )
                  }
                >
                  Approve
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  disabled={processingRef.current.has(req.id)}
                  onClick={() =>
                    rejectManualAttendance(
                      req.data.studentId,
                      req.data.sessionId,
                    )
                  }
                >
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
