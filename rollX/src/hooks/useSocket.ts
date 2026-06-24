"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGlobalSocket } from "@/providers/SocketProvider";
import type { SerializableMember } from "@/types/types";

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
  get_host_status: (
    groupId: string,
    callback: (isOnline: boolean) => void,
  ) => void;
  confirm_presence: (
    sessionId: string,
    callback: (success: boolean) => void,
  ) => void;
  end_session: (data: { sessionId: string }) => void;
  request_manual_attendance: (
    data: { sessionId: string; reason: string },
    callback: (success: boolean, message?: string) => void,
  ) => void;
  join_group: (groupId: string) => void;
  leave_group: (groupId: string) => void;
}

export const useSocket = ({ groupId }: { groupId?: string }) => {
  const { socket } = useGlobalSocket();
  const router = useRouter();

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null,
  );
  const [isHostOnline, setIsHostOnline] = useState(false);

  useEffect(() => {
    if (!socket || !groupId) return;

    let isMounted = true;

    // 1. INSTANT STATE SYNC (Fixes the perpetual loading bug)
    setIsConnected(socket.connected);

    // 2. JOIN THE ROOM
    socket.emit("join_group", groupId);

    // 3. FETCH INITIAL STATUS
    const checkHostStatus = () => {
      socket.emit("get_host_status", groupId, (isOnline: boolean) => {
        if (isMounted) setIsHostOnline(isOnline);
      });
    };

    if (socket.connected) checkHostStatus();

    // 4. ATTACH LISTENERS
    const onConnect = () => {
      if (!isMounted) return;
      setIsConnected(true);
      setError(null);
      socket.emit("join_group", groupId); // Re-join if reconnected
      checkHostStatus();
    };

    const onDisconnect = (reason: string) => {
      if (!isMounted) return;
      setIsConnected(false);
      setActiveSession(null);
      setIsHostOnline(false);
      if (reason === "io server disconnect")
        setError("Disconnected by server.");
    };

    const onSessionStarted = (session: ActiveSession) => {
      if (!isMounted) return;
      setActiveSession(session);
      router.push(`/group/${groupId}/attend`);
    };

    const onSessionFinalized = () => {
      if (!isMounted) return;
      setActiveSession(null);
      if (
        typeof window !== "undefined" &&
        window.location.pathname.includes("/attend")
      ) {
        router.push(`/group/${groupId}`);
      }
    };

    const onHostOnline = () => {
      if (isMounted) setIsHostOnline(true);
    };
    const onHostOffline = () => {
      if (isMounted) setIsHostOnline(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", (err: Error) => {
      if (isMounted) setError(err.message);
    });
    socket.on("session_started", onSessionStarted);
    socket.on("session_finalized", onSessionFinalized);
    socket.on("host_online", onHostOnline);
    socket.on("host_offline", onHostOffline);

    // CLEANUP
    return () => {
      isMounted = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error");
      socket.off("session_started", onSessionStarted);
      socket.off("session_finalized", onSessionFinalized);
      socket.off("host_online", onHostOnline);
      socket.off("host_offline", onHostOffline);

      socket.emit("leave_group", groupId);
    };
  }, [socket, groupId, router]);

  // ACTIONS
  const confirmPresence = useCallback(
    (sessionId: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!socket || !socket.connected) {
          resolve(false);
          return;
        }
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        }, 4000);

        socket.emit("confirm_presence", sessionId, (success: boolean) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          resolve(success);
        });
      });
    },
    [socket],
  );

  return {
    socket,
    isConnected,
    error,
    activeSession,
    isHostOnline,
    confirmPresence,
  };
};
