"use client";

import { AttendanceForm } from "@/components/sessions/AttendanceForm";
import { LoaderCircle } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AttendPage({
  params,
}: {
  params: { groupId: string };
}) {
  const router = useRouter();
  const { isConnected, activeSession } = useSocket({ groupId: params.groupId });

  const [sessionId, setSessionId] = useState<string | null>(null);

  // If socket gives us session, use it
  useEffect(() => {
    if (activeSession) {
      setSessionId(activeSession.sessionId);
    }
  }, [activeSession]);

  // Fallback API check (for late arrivals)
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const res = await fetch(
          `/api/groups/${params.groupId}/sessions/active`,
        );

        if (!res.ok) return;

        const data = await res.json();

        if (data?.activeSession) {
          setSessionId(data.activeSession.sessionId);
        } else {
          toast.info("The attendance session has ended.");
          router.push(`/group/${params.groupId}`);
        }
      } catch (err) {
        console.error("Failed to check active session:", err);
      }
    };

    if (!sessionId) {
      checkActiveSession();
    }
  }, [params.groupId, router, sessionId]);

  // If we have sessionId → show form
  if (sessionId) {
    return (
      <div className="container mx-auto flex items-center justify-center py-12">
        <AttendanceForm sessionId={sessionId} />
      </div>
    );
  }

  // Otherwise show loader
  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground">Joining session...</p>
    </div>
  );
}
