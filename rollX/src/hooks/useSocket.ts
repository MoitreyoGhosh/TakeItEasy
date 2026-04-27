"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
//import type { SerializableMember } from "@/types/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface ActiveSession {
  sessionId: string;
  duration: number;
}

interface ServerToClientEvents {
  connect: () => void;
  disconnect: (reason: string) => void;
  session_started: (session: ActiveSession) => void;
  session_finalized: (data: {
    sessionId: string;
    presentMembers: string[];
  }) => void;
  participant_confirmed: (member: { _id: string }) => void;
  host_online: () => void;
  host_offline: () => void;
  manual_attendance_request: (data: {
    studentId: string;
    sessionId: string;
    reason: string;
  }) => void;
  manual_attendance_approved: (data: { studentId: string }) => void;
  manual_attendance_rejected: (data: { studentId: string }) => void;
}

interface ClientToServerEvents {
  get_host_status: (callback: (isOnline: boolean) => void) => void;
  confirm_presence: (
    sessionId: string,
    callback: (success: boolean) => void,
  ) => void;
  end_session: (data: { sessionId: string }) => void;
}

interface UseSocketProps {
  groupId?: string;
}

export const useSocket = ({ groupId }: UseSocketProps) => {
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null,
  );

  const [isHostOnline, setIsHostOnline] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (!groupId) return;

    let isMounted = true;
    let socketInstance: Socket<
      ServerToClientEvents,
      ClientToServerEvents
    > | null = null;

    const connectSocket = async () => {
      try {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        const response = await fetch("/api/ws/ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId }),
        });

        if (response.status === 401 || response.status === 403)
          throw new Error("Unauthorized. Please log in again.");

        if (!response.ok) throw new Error("Failed to fetch auth ticket.");

        const { ticket } = await response.json();

        if (!ticket) throw new Error("Missing auth ticket from server.");

        const socketUrl =
          process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080";

        socketInstance = io(socketUrl, {
          auth: { token: ticket },
          reconnectionAttempts: 5,
          reconnectionDelay: 2000, // 2 seconds between attempts
        });

        socketRef.current = socketInstance;

        // Set up event listeners
        socketInstance.on("connect", () => {
          if (!isMounted) return;

          console.log(`[Socket.IO] Connected: ${socketInstance?.id}`);

          setSocket(socketInstance);
          setIsConnected(true);
          setError(null);

          socketInstance?.emit("get_host_status", (isOnline: boolean) => {
            if (isMounted) {
              console.log(
                `[Socket.IO] Initial host status received: ${isOnline}`,
              );
              setIsHostOnline(isOnline);
            }
          });
        });

        // Handle disconnections and errors
        socketInstance.on("disconnect", (reason) => {
          if (!isMounted) return;

          console.log(`[Socket.IO] Disconnected: ${reason}`);

          setIsConnected(false);
          setActiveSession(null);
          setIsHostOnline(false);

          if (reason === "io server disconnect")
            setError("Disconnected by server. Please refresh.");
        });

        // Handle connection errors
        socketInstance.on("connect_error", (err) => {
          if (isMounted) setError(err.message);
        });

        // Handle session started event
        socketInstance.on("session_started", (session) => {
          if (isMounted) {
            console.log("[Socket.IO] session_started", session);
            setActiveSession(session);
          }
        });

        // Handle participant confirmed event
        socketInstance.on("participant_confirmed", (member) => {
          console.log("[Socket.IO] participant_confirmed", member);
        });

        // Handle session finalized event
        socketInstance.on("session_finalized", (data) => {
          console.log("[Socket.IO] session_finalized", data);
          setActiveSession(null);
          if (typeof window !== "undefined") {
            const path = window.location.pathname;

            if (path.includes("/attend")) {
              const parts = path.split("/");
              const groupId = parts[2];
              router.push(`/group/${groupId}`);
            }
          }
        });

        // Handle host online events
        socketInstance.on("host_online", () => {
          if (isMounted) {
            console.log("[Socket.IO] host_online");
            setIsHostOnline(true);
          }
        });

        // Handle host offline events
        socketInstance.on("host_offline", () => {
          if (isMounted) {
            console.log("[Socket.IO] host_offline");
            setIsHostOnline(false);
          }
        });
      } catch (err: unknown) {
        console.error("[Socket.IO] Connection error:", err);

        if (isMounted)
          setError(
            err instanceof Error ? err.message : "Unknown error occurred",
          );
      }
    };

    connectSocket();

    return () => {
      isMounted = false;

      if (socketRef.current) {
        console.log("[Socket.IO] Cleaning up socket...");

        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error");
        socketRef.current.off("session_started");
        socketRef.current.off("participant_confirmed");
        socketRef.current.off("session_finalized");
        socketRef.current.off("host_online");
        socketRef.current.off("host_offline");

        setSocket(null);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [groupId]);

  const confirmPresence = useCallback((sessionId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Use socketRef.current to avoid stale closures during rapid state updates
      const currentSocket = socketRef.current;

      if (!currentSocket || !currentSocket.connected) {
        console.warn("[Socket.IO] Cannot confirm presence: not connected.");
        resolve(false);
        return;
      }

      currentSocket.emit("confirm_presence", sessionId, (success: boolean) => {
        resolve(success);
      });
    });
  }, []);

  return {
    socket,
    isConnected,
    error,
    activeSession,
    isHostOnline,
    confirmPresence,
  };
};
