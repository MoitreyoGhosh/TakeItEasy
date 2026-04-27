"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";

type ManualRequest = {
  studentId: string;
  sessionId: string;
  reason?: string;
};

interface PopulatedMember {
  _id: string;
  name: string;
  email: string;
  profile?: {
    universityRollNo?: string;
    classRollNo?: string;
    fullName?: string;
  } | null;
}

export function ManualAttendancePanel({
  groupId,
  members,
  rosterMap,
  sessionId,
  onManualApprove,
}: {
  groupId: string;
  members?: PopulatedMember[];
  rosterMap?: React.MutableRefObject<Map<string, PopulatedMember>>;
  sessionId?: string;
  onManualApprove?: (studentId: string) => void;
}) {
  const { socket } = useSocket({ groupId });

  const [manualRequests, setManualRequests] = useState<ManualRequest[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleManualRequest = (data: ManualRequest) => {
      setManualRequests((prev) => {
        const exists = prev.some(
          (req) =>
            req.studentId === data.studentId &&
            req.sessionId === data.sessionId,
        );
        if (exists) {
          toast.info("Duplicate manual attendance request received, ignoring.");
          return prev;
        }

        return [...prev, data];
      });

      toast.info("Manual attendance request received");
    };

    socket.on("manual_attendance_request", handleManualRequest);

    return () => {
      socket.off("manual_attendance_request", handleManualRequest);
    };
  }, [socket]);

  const approveManualAttendance = async (
    studentId: string,
    sessionId: string,
  ) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/manual-add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId }),
      });

      if (!res.ok) throw new Error();

      setManualRequests((prev) =>
        prev.filter((req) => req.studentId !== studentId),
      );

      onManualApprove?.(studentId);
    } catch {
      toast.error("Failed to approve attendance");
    }
  };

  const rejectManualAttendance = async (
    studentId: string,
    requestSessionId: string,
  ) => {
    try {
      const res = await fetch(
        `/api/sessions/${requestSessionId}/manual-reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentId }),
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to reject request.");
      }

      setManualRequests((prev) =>
        prev.filter((req) => req.studentId !== studentId),
      );

      toast.info("Manual attendance request rejected.");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to reject attendance.");
    }
  };

  const getMember = (id: string) => {
    if (rosterMap) return rosterMap.current.get(id);
    if (members) return members.find((m) => m._id === id);
    return null;
  };

  if (manualRequests.length === 0) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Manual Attendance Requests
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {manualRequests.map((req) => {
          const member = getMember(req.studentId);

          return (
            <div
              key={req.studentId}
              className="flex items-center justify-between border p-2 rounded-md"
            >
              <div>
                <p className="text-sm font-medium">
                  {member?.profile?.fullName || member?.name || "Student"}
                </p>

                <p className="text-xs text-muted-foreground">
                  {member?.profile?.universityRollNo || ""}
                </p>

                {req.reason && (
                  <p className="text-xs text-muted-foreground">
                    Reason: {req.reason}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    approveManualAttendance(req.studentId, req.sessionId)
                  }
                >
                  Approve
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => rejectManualAttendance(req.studentId, req.sessionId)}
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
