"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LoaderCircle,
  CheckCircle2,
  ShieldCheck,
  Hourglass,
  WifiOff,
} from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";

// 1. We need to fetch the session details to get the groupId, which is required
// to initialize our WebSocket connection correctly.
const fetchSessionDetails = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch session details");
    return res.json();
  });

export default function EvaluationPage({
  params,
}: {
  params: { sessionId: string }; //change req for Next 15
}) {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "confirmed" | "failed"
  >("pending");

  // Fetch session data (we need the groupId)
  const { data: sessionData, error: fetchError } = useSWR(
    `/api/sessions/${params.sessionId}/status`,
    fetchSessionDetails,
  );

  const groupId = sessionData?.groupId;

  // Initialize socket connection ONLY when we have the groupId
  const {
    isConnected,
    error: socketError,
    confirmPresence,
    socket,
  } = useSocket({ groupId });

  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    const verifyPresence = async (attempt = 1) => {
      if (!isMounted) return;

      if (!isConnected || !groupId) {
        retryTimeout = setTimeout(() => verifyPresence(attempt), 1000);
        return;
      }

      const success = await confirmPresence(params.sessionId);

      if (!isMounted) return;

      if (success) {
        setVerificationStatus("confirmed");
        toast.success("Attendance confirmed!");
        return;
      }

      // Retry up to 5 times
      if (attempt < 5) {
        retryTimeout = setTimeout(() => verifyPresence(attempt + 1), 1200);
        return;
      }
      setVerificationStatus("failed");
      toast.error("Failed to verify presence. Please try again.");
    };
    verifyPresence();

    return () => {
      isMounted = false;
      clearTimeout(retryTimeout);
    };
  }, [isConnected, groupId, params.sessionId, confirmPresence]);

  // Listen for the session to end
  useEffect(() => {
    if (!socket) return;

    const handleFinalized = () => {
      toast.success("Session Complete!", {
        description: "Your attendance has been recorded.",
      });
      // Navigate back to the group page
      if (groupId) router.push(`/group/${groupId}`);
    };

    socket.on("session_finalized", handleFinalized);
    return () => {
      socket.off("session_finalized", handleFinalized);
    };
  }, [socket, router, groupId]);

  // --- Rendering Logic ---

  if (fetchError || socketError || verificationStatus === "failed") {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
              <WifiOff className="h-6 w-6" /> Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We lost connection or could not verify your session. Please return
              to the class page and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md mx-auto text-center shadow-lg border-primary/20 animate-in zoom-in-95 duration-500">
        <CardHeader className="pb-4">
          <div className="mx-auto bg-primary/10 text-primary h-16 w-16 flex items-center justify-center rounded-full mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">
            {verificationStatus === "pending"
              ? "Verifying Presence..."
              : "Attendance Confirmed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {verificationStatus === "pending" ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">
                Establishing secure connection...
              </p>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <span className="font-semibold text-green-700 dark:text-green-400">
                  Connection Secured
                </span>
              </div>
              <p className="text-sm text-foreground mb-4">
                Do not close or refresh this page.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-background p-2 rounded-md border">
                <Hourglass className="h-3 w-3 animate-spin-slow" />
                Waiting for session to end...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
