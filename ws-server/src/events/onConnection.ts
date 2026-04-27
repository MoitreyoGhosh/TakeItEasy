import { Socket } from "socket.io";
import {
  activeSessions,
  finalizeSession,
} from "../sessionManager.js";

// Track active hosts per group
const activeHostsByGroup = new Map<string, number>();

// Socket interface
interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
    groupId?: string;
    role?: "Host" | "Student";
  };
}

/**
 * Handles authenticated socket connections
 */
export const onConnection = (socket: AuthenticatedSocket) => {
  const { userId, groupId, role } = socket.data;

  if (!userId || !groupId || !role) {
    console.error(
      "[Error] Authenticated socket missing userId, groupId, or role.",
    );
    socket.disconnect(true);
    return;
  }

  console.log(
    `[Auth] Client authenticated: User ${userId} for Group ${groupId}, Role: ${role}`,
  );

  const roomName = `group-${groupId}`;
  socket.join(roomName);

  console.log(
    `[Room] Socket ${socket.id} (User ${userId}) joined room ${roomName}`,
  );

  // -------------------------------
  // Client-to-Server Events
  // -------------------------------

  // Host status request (for students to check if host is online)
  socket.on("get_host_status", (ack: (isOnline: boolean) => void) => {
    if (typeof ack !== "function") return;

    const hostCount = activeHostsByGroup.get(groupId) || 0;
    const isOnline = hostCount > 0;

    console.log(
      `[Presence] Host status requested by ${userId} in group ${groupId}: ${isOnline}`,
    );

    ack(isOnline);
  });

  // Attendance confirmation from students
  socket.on(
    "confirm_presence",
    (sessionId: string, ack: (success: boolean, message?: string) => void) => {
      if (typeof ack !== "function") return;

      console.log(
        `[Verification] User ${userId} confirming presence for session ${sessionId}`,
      );

      const session = activeSessions.get(sessionId);

      if (!session) {
        console.warn(`[Verification] Session ${sessionId} not found.`);
        ack(false, "Session not found");
        return;
      }

      if (session.groupId !== groupId) {
        console.warn(
          `[Verification] Group mismatch for session ${sessionId}. Expected group ${groupId}.`,
        );
        ack(false, "Invalid session group");
        return;
      }

      if (!session.isActive) {
        console.warn(
          `[Verification] Attempt to confirm presence for ended session ${sessionId}.`,
        );
        ack(false, "Session has already ended");
        return;
      }

      // Prevent duplicate attendance confirmations
      if (session.connectedParticipants.has(userId)) {
        console.log(
          `[Verification] User ${userId} already confirmed for session ${sessionId}.`,
        );

        ack(true, "Already confirmed");
        return;
      }

      // Add participant
      session.connectedParticipants.add(userId);

      ack(true, "Confirmation successful");

      // Broadcast to host only for new confirmations
      socket.to(roomName).emit("participant_confirmed", { _id: userId });

      console.log(
        `[Verification] User ${userId} successfully added to live session.`,
      );
    },
  );

  // Host can manually end session
  socket.on("end_session", (data: { sessionId: string }) => {
    if (role !== "Host") {
      console.warn(`[Security] Unauthorized end_session attempt`);
      return;
    }

    const session = activeSessions.get(data.sessionId);

    if (!session) {
      console.warn(`[Session] Session not found: ${data.sessionId}`);
      return;
    }

    if (session.groupId !== groupId) {
      console.warn(`[Security] Cross-group session end attempt`);
      return;
    }

    if (!session.isActive) {
      console.warn(
        `[SessionManager] Attempt to end already finalized session ${data.sessionId}`,
      );
      return;
    }

    console.log(
      `[SessionManager] Host ${userId} manually ended session ${data.sessionId}`,
    );

    finalizeSession(data.sessionId);
  });

  // -------------------------------
  // Host Presence Logic
  // -------------------------------

  if (role === "Host") {
    const currentCount = activeHostsByGroup.get(groupId) || 0;
    activeHostsByGroup.set(groupId, currentCount + 1);

    // Notify other clients
    socket.to(roomName).emit("host_online");

    console.log(
      `[Presence] Host ${userId} is ONLINE. Host count for ${groupId}: ${
        currentCount + 1
      }`,
    );
  } else {
    // If student joins, inform them if host already present
    if (activeHostsByGroup.has(groupId)) {
      socket.emit("host_online");
    }
  }

  // -------------------------------
  // Disconnect Handler
  // -------------------------------

  socket.on("disconnect", (reason) => {
    console.log(
      `[Disconnect] User ${userId} disconnected from Group ${groupId}. Reason: ${reason}`,
    );

    if (role === "Host") {
      const currentCount = activeHostsByGroup.get(groupId) || 0;

      if (currentCount <= 1) {
        activeHostsByGroup.delete(groupId);

        socket.to(roomName).emit("host_offline");

        console.log(
          `[Presence] Last host left group ${groupId}. Notifying room.`,
        );
      } else {
        activeHostsByGroup.set(groupId, currentCount - 1);

        console.log(
          `[Presence] Host left group ${groupId}. Remaining hosts: ${
            currentCount - 1
          }`,
        );
      }
    }

    if (role === "Student") {
      // Iterate through active sessions to find if they were in on, later we can optimize this by using socket.data.sessionId and mapping sessionId to participants
      activeSessions.forEach((sessionData, sessionId) => {
        if (sessionData.connectedParticipants.has(userId)) {
          sessionData.connectedParticipants.delete(userId);
          console.log(
            `[Disconnect] User ${userId} left live session ${sessionId} early.`,
          );

          // Broadcast to host that they left
          socket
            .to(`group-${groupId}`)
            .emit("participant_left", { _id: userId });
        }
      });
    }
  });

  // -------------------------------
  // Future Events
  // -------------------------------
  // registerGroupEvents(socket, userId, groupId);
};
