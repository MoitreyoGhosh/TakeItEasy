"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  FlaskConical,
  Hourglass,
  LogOut,
  Settings,
  Users,
  Wifi,
  WifiOff,
  LoaderCircle,
  LogIn,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { LeaveGroupDialog } from "./LeaveGroupDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useState, useEffect } from "react";
import { daysOfWeekValues } from "@/lib/utils/constants";
import { formatFullSchedule, formatEventDisplayTime } from "@/lib/utils/time";
import { useSocket } from "@/hooks/useSocket";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface ActiveSession {
  sessionId: string;
  duration: number;
}
// Define the maximum number of manual attendance requests allowed per session
const MAX_ATTEMPTS = 3;

// Displays the group details and the "Join Live Session" button if there's an active session.
const SessionStatus = ({
  activeSession,
  isHostOnline,
  groupId,
}: {
  activeSession: ActiveSession | null;
  isHostOnline: boolean;
  groupId: string;
}) => {
  if (activeSession) {
    return (
      <Link href={`/group/${groupId}/attend`}>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground animate-pulse w-full sm:w-auto">
          <LogIn className="mr-2 h-4 w-4" />
          Join Live Session
        </Button>
      </Link>
    );
  }

  // Host is Online -> "Host Active" badge
  if (isHostOnline) {
    return (
      <div className="flex items-center justify-end">
        <Badge
          variant="outline"
          className="border-green-500/50 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
          Host is Active
        </Badge>
      </div>
    );
  }

  // Host is Offline -> "Waiting for Host" badge
  return (
    <div className="flex items-center justify-end">
      <Badge variant="secondary" className="text-muted-foreground">
        <Hourglass className="h-4 w-4 mr-2 animate-spin-slow" />
        Waiting for Host
      </Badge>
    </div>
  );
};

type SerializedGroup = {
  _id: string;
  groupName: string;
  description?: string;
  owner: { profile?: { fullName: string } };
  members: unknown[];
  capacity: number;
  groupType: "Class" | "Lab" | "Event";
  schedules?: { dayOfWeek: number; startTime: string; endTime: string }[];
  eventTime?: { start?: Date | string; end?: Date | string };
};

export function ParticipantGroupView({ group }: { group: SerializedGroup }) {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [recentSessionId, setRecentSessionId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fullDayNames = daysOfWeekValues.map((day) => day.label);
  const router = useRouter();
  const { socket, isConnected, error, activeSession, isHostOnline } = useSocket(
    { groupId: group._id },
  );
  const [manualRequestStatus, setManualRequestStatus] = useState<
    "none" | "pending" | "approved" | "rejected"
  >("none");
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [attempts, setAttempts] = useState<number>(0);
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attempts);
  const attemptsExhausted = remainingAttempts === 0;

  // Real-time navigation when a session starts
  useEffect(() => {
    if (activeSession) {
      console.log("WebSocket event received: session_started. Navigating...");
      router.push(`/group/${group._id}/attend`);
    }
  }, [activeSession, group._id, router]);

  // Fallback check for active session, runs only once on mount
  useEffect(() => {
    const checkForActiveSession = async () => {
      // No need for the activeSession check here because of the empty dependency array
      try {
        const response = await fetch(
          `/api/groups/${group._id}/sessions/active`,
        );
        if (!response.ok) return;

        const data = await response.json();
        if (
          data?.activeSession &&
          window.location.pathname !== `/group/${group._id}/attend`
        ) {
          console.log("Fallback check found an active session. Navigating...");
          router.push(`/group/${group._id}/attend`);
        }
      } catch (err) {
        console.error("Fallback check for active session failed:", err);
      }
    };

    const timer = setTimeout(checkForActiveSession, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group._id, router]); // Dependency array is now correct

  // Fetch the most recent completed session ID
  useEffect(() => {
    const fetchRecentSession = async () => {
      try {
        const res = await fetch(`/api/groups/${group._id}/sessions/recent`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.sessionId) {
          setRecentSessionId(data.sessionId);
        }
      } catch (err) {
        console.error("Failed to fetch recent session:", err);
      }
    };
    fetchRecentSession();
  }, [group._id]);

  // Server Sync Function for Manual Request Status
  const verifyStatusWithServer = async () => {
    if (!recentSessionId || !currentUserId) return;

    try {
      const res = await fetch(
        `/api/sessions/${recentSessionId}/manual-status/${currentUserId}`,
        { cache: "no-store" },
      );

      if (!res.ok) return;

      const data: {
        status: "none" | "pending" | "approved" | "rejected";
        attempts: number;
      } = await res.json();

      setManualRequestStatus(data.status);
      setAttempts(data.attempts ?? 0);
    } catch (err) {
      console.error("Failed to sync manual request status:", err);
    }
  };

  // Initial Sync on Mount
  useEffect(() => {
    if (!recentSessionId || !currentUserId) return;

    verifyStatusWithServer();
  }, [recentSessionId, currentUserId]);

  // Submit Manual Attendance Request
  const sendManualRequest = async () => {
    if (!recentSessionId || !currentUserId) return;
    if (manualRequestStatus === "pending") return;

    if (remainingAttempts <= 0) {
      toast.error("You have reached the maximum number of attempts.");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason.");
      return;
    }

    try {
      const res = await fetch(
        `/api/sessions/${recentSessionId}/manual-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        },
      );

      if (res.status === 429) {
        setAttempts(MAX_ATTEMPTS);
        setManualRequestStatus("rejected");

        toast.error("You have reached the maximum number of attempts.");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Unable to send request.");
        return;
      }

      const statusKey = `manual-request-${recentSessionId}-${currentUserId}`;

      setManualRequestStatus("pending");
      localStorage.setItem(statusKey, "pending");
      setAttempts((prev) => prev + 1);

      toast.info("Attendance request sent. Waiting for host decision.");

      setIsDialogOpen(false);
      setReason("");
    } catch (err) {
      toast.error("Failed to send request.");
    }
  };

  // Listen for real-time host decisions
  useEffect(() => {
    if (!socket || !currentUserId || !recentSessionId) return;
    const storageKey = `manual-request-${recentSessionId}-${currentUserId}`;

    const handleApproved = async (data: { studentId: string }) => {
      if (data.studentId === currentUserId) {
        setManualRequestStatus("approved");
        localStorage.setItem(storageKey, "approved");

        // Sync attempts status from server to ensure accuracy
        await verifyStatusWithServer();

        toast.success("Your manual attendance request was approved.");
      }
    };

    const handleRejected = async (data: { studentId: string }) => {
      if (data.studentId === currentUserId) {
        setManualRequestStatus("rejected");
        localStorage.setItem(storageKey, "rejected");

        // Sync attempts status from server to ensure accuracy
        await verifyStatusWithServer();

        toast.error("Your manual attendance request was rejected.");
      }
    };

    socket.on("manual_attendance_approved", handleApproved);
    socket.on("manual_attendance_rejected", handleRejected);

    return () => {
      socket.off("manual_attendance_approved", handleApproved);
      socket.off("manual_attendance_rejected", handleRejected);
    };
  }, [socket, currentUserId, recentSessionId]);

  let requestButtonContent: React.ReactNode;
  switch (manualRequestStatus) {
    case "pending":
      requestButtonContent = (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Request Pending
        </>
      );
      break;
    case "approved":
      requestButtonContent = (
        <Badge className="bg-green-600 text-white">Attendance Approved</Badge>
      );
      break;
    case "rejected":
      requestButtonContent =
        remainingAttempts > 0 ? "Submit Another Request" : "No Attempts Left";
      break;
    default:
      requestButtonContent = "Request Attendance";
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <Link href="/student/dashboard" className="inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-4">
          {error ? (
            <Badge variant="destructive" className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              🔴
            </Badge>
          ) : !isConnected ? (
            <Badge
              variant="outline"
              className="flex items-center gap-2 text-muted-foreground"
            >
              <LoaderCircle className="h-4 w-4 animate-spin" />
              🟡
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="flex items-center gap-2 border-green-500 text-green-600"
            >
              <Wifi className="h-4 w-4" />
              🟢
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Group Settings
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                onClick={() => setIsLeaveDialogOpen(true)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="my-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div className="flex-1">
            <h2 className="text-3xl font-bold tracking-tight">
              {group.groupName}
            </h2>

            {group.description && (
              <p className="mt-4 max-w-2xl text-foreground/80">
                {group.description}
              </p>
            )}

            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                Hosted by{" "}
                <strong>{group.owner.profile?.fullName || "Host"}</strong>
              </span>

              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {group.members.length} / {group.capacity} members
              </span>

              <span className="flex items-center gap-1.5 font-medium text-foreground">
                {group.groupType === "Class" ? (
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                ) : group.groupType === "Lab" ? (
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                )}

                {group.groupType === "Class" || group.groupType === "Lab"
                  ? group.schedules && group.schedules.length > 0
                    ? group.schedules
                        .map((s) => formatFullSchedule(s, fullDayNames))
                        .join(" | ")
                    : "Schedule not set"
                  : formatEventDisplayTime(group.eventTime)}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-auto flex justify-end items-center gap-4">
            <SessionStatus
              activeSession={activeSession}
              isHostOnline={isHostOnline}
              groupId={group._id}
            />

            {!activeSession &&
              isHostOnline &&
              recentSessionId &&
              manualRequestStatus !== "approved" &&
              !attemptsExhausted && (
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                  {manualRequestStatus === "rejected" &&
                    remainingAttempts > 0 && (
                      <Badge variant="destructive" className="animate-fade-in">
                        Previous request rejected
                      </Badge>
                    )}

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={manualRequestStatus === "pending"}
                        className="w-full sm:w-auto"
                      >
                        {requestButtonContent}
                      </Button>
                    </DialogTrigger>

                    {manualRequestStatus !== "pending" &&
                      !attemptsExhausted && (
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Request Manual Attendance</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                              <p>
                                Please explain why you were unable to join the
                                session.
                              </p>

                              <Badge variant="outline">
                                {remainingAttempts} attempt
                                {remainingAttempts > 1 ? "s" : ""} left
                              </Badge>
                            </div>

                            <Textarea
                              placeholder="Example: I had a network issue..."
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                            />
                          </div>

                          <DialogFooter>
                            <Button
                              onClick={sendManualRequest}
                              disabled={!reason.trim()}
                            >
                              Submit Request
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      )}
                  </Dialog>
                </div>
              )}

            {attemptsExhausted && manualRequestStatus !== "approved" && (
              <Badge variant="secondary">Manual request limit reached</Badge>
            )}
          </div>
        </div>
      </div>

      <LeaveGroupDialog
        group={group}
        isOpen={isLeaveDialogOpen}
        setIsOpen={setIsLeaveDialogOpen}
      />
    </>
  );
}

// Optional: add a slow spin animation to globals.css for the hourglass
// @layer utilities {
//   .animate-spin-slow {
//     animation: spin 3s linear infinite;
//   }
// }
