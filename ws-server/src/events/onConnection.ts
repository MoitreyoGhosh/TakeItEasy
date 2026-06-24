import { Socket } from "socket.io";
import { activeSessions, finalizeSession } from "../sessionManager.js";
import { io } from "../server.js";

const activeHostsByGroup = new Map<string, Set<string>>();

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
    role?: "Host" | "Student";
  };
}

export const onConnection = (socket: AuthenticatedSocket) => {
  const { userId, role } = socket.data;

  if (!userId || !role) {
    socket.disconnect(true);
    return;
  }

  console.log(`[Auth] Global Client connected: User ${userId}, Role: ${role}`);

  // -------------------------------
  // GLOBAL USER ROOM
  // -------------------------------
  // Every connected user joins their personal room.
  // Used for notifications, approvals, announcements, etc.
  const userRoom = `user-${userId}`;
  socket.join(userRoom);

  console.log(`[Room] ${userId} joined personal room ${userRoom}`);

  // -------------------------------
  // GROUP JOIN / LEAVE
  // -------------------------------
  socket.on("join_group", (groupId: string) => {
    if (!groupId) return;

    const roomName = `group-${groupId}`;
    socket.join(roomName);

    if (role === "Host") {
      let hostSet = activeHostsByGroup.get(groupId);

      if (!hostSet) {
        hostSet = new Set();
        activeHostsByGroup.set(groupId, hostSet);
      }

      hostSet.add(socket.id);

      socket.to(roomName).emit("host_online");
    }
  });

  socket.on("leave_group", (groupId: string) => {
    if (!groupId) return;

    const roomName = `group-${groupId}`;
    socket.leave(roomName);

    if (role === "Host") {
      const hostSet = activeHostsByGroup.get(groupId);

      if (!hostSet) return;

      hostSet.delete(socket.id);

      if (hostSet.size === 0) {
        activeHostsByGroup.delete(groupId);
        socket.to(roomName).emit("host_offline");
      }
    }
  });

  // -------------------------------
  // CLIENT EVENTS
  // -------------------------------
  socket.on(
    "get_host_status",
    (groupId: string, ack: (isOnline: boolean) => void) => {
      if (!groupId || typeof ack !== "function") return;
      // const count = activeHostsByGroup.get(groupId) || 0;
      // ack(count > 0);
      const hostSet = activeHostsByGroup.get(groupId);
      ack(!!hostSet && hostSet.size > 0);
    },
  );

  socket.on(
    "confirm_presence",
    (sessionId: string, ack: (success: boolean) => void) => {
      if (typeof ack !== "function") return;
      const session = activeSessions.get(sessionId);

      if (!session || !session.isActive) return ack(false);

      if (session.connectedParticipants.has(userId)) return ack(true);

      session.connectedParticipants.add(userId);
      ack(true);

      // Broadcast to room derived from session
      socket
        .to(`group-${session.groupId}`)
        .emit("participant_confirmed", { _id: userId });
    },
  );

  socket.on("end_session", (data: { sessionId: string }) => {
    if (role !== "Host") return;
    const session = activeSessions.get(data.sessionId);
    if (!session || !session.isActive) return;

    finalizeSession(data.sessionId);
  });

  // -------------------------------
  // DISCONNECT (Global Cleanup)
  // -------------------------------
  socket.on("disconnect", () => {
    if (role === "Host") {
      activeHostsByGroup.forEach((hostSet, groupId) => {
        if (hostSet.has(socket.id)) {
          hostSet.delete(socket.id);

          if (hostSet.size === 0) {
            activeHostsByGroup.delete(groupId);
            io.to(`group-${groupId}`).emit("host_offline");
          }
        }
      });
    } else if (role === "Student") {
      activeSessions.forEach((sessionData, sessionId) => {
        if (sessionData.connectedParticipants.has(userId)) {
          sessionData.connectedParticipants.delete(userId);
          io.to(`group-${sessionData.groupId}`).emit("participant_left", {
            _id: userId,
          });
        }
      });
    }
  });
};
