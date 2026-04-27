import { io } from "./server.js";

interface SessionData {
  isActive: boolean;
  groupId: string;
  timerId: NodeJS.Timeout;
  connectedParticipants: Set<string>;
}

// In-Memory Store for Active Sessions
const activeSessions = new Map<string, SessionData>();

// Function: Start a New Attendance Session
/**
 * Starts a new session timer and notifies all group members in real-time.
 *
 * @param sessionId - The unique ID for this session (MongoDB ObjectId)
 * @param groupId - The group ID this session belongs to
 * @param duration - Session duration in seconds
 */
export const startSession = (
  sessionId: string,
  groupId: string,
  duration: number,
) => {
  // If a session already exists, clear it to prevent overlaps.
  if (activeSessions.has(sessionId)) {
    console.warn(
      `[SessionManager] ⚠️ Session ${sessionId} already active. Overwriting existing timer.`,
    );
    clearTimeout(activeSessions.get(sessionId)!.timerId);
  }
  console.log(
    `[SessionManager] 🕒 Starting session ${sessionId} for group ${groupId}. Duration: ${duration}s`,
  );

  // Automatically finalize the session after the duration expires.
  const timerId = setTimeout(() => finalizeSession(sessionId), duration * 1000);

  // Store the session data in-memory.
  activeSessions.set(sessionId, {
    groupId,
    timerId,
    connectedParticipants: new Set(),
    isActive: true,
  });

  // Broadcast the "session_started" event
  const roomName = `group-${groupId}`;
  io.to(roomName).emit("session_started", {
    sessionId,
    duration,
  });

  console.log(`[Broadcast] 📢 'session_started' emitted to room: ${roomName}`);
};

// Function: Finalize Expired Session
/**
 * Finalizes the session when the timer expires.
 * Calls the rollx backend to persist the data, then
 * broadcasts the "session_finalized" event and cleans up memory.
 *
 * @param sessionId - The ID of the session to finalize
 */
const finalizeSession = async (sessionId: string) => {
  const sessionData = activeSessions.get(sessionId);

  if (!sessionData) {
    console.warn(
      `[SessionManager] ⚠️ Tried to finalize session ${sessionId}, but it does not exist.`,
    );
    return;
  }
  console.log(`[SessionManager] ✅ Finalizing session ${sessionId}.`);

  const { groupId, connectedParticipants, timerId } = sessionData;
  clearTimeout(timerId);

  // Securely notify RollX backend to persist attendance results.
  const presentMemberIds = Array.from(connectedParticipants);
  const rollxHost =
    process.env.NODE_ENV === "production" ? "rollx" : "localhost";
  const rollxFinalizeUrl = `http://${rollxHost}:${
    process.env.ROLLX_APP_PORT || 3000
  }/api/sessions/${sessionId}/finalize`;

  try {
    console.log(
      `[API Call] Notifying rollx to finalize session at: ${rollxFinalizeUrl}`,
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(rollxFinalizeUrl, {
      method: "PUT", // Use PUT for updating an existing resource
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
      },
      body: JSON.stringify({ presentMembers: presentMemberIds }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      // This error is critical because the DB state will be out of sync.
      throw new Error(
        `Failed to finalize session in database (rollx API returned ${response.status}): ${errorText}`,
      );
    }
    console.log(
      `[API Call] ✅ Successfully finalized session ${sessionId} in database.`,
    );
  } catch (error) {
    console.error(
      "[SessionManager] 🚨 CRITICAL: Could not finalize session in rollx DB.",
      error,
    );
    // TODO: Implement retry logic or alerting here, as this means our in-memory state and database state are out of sync, which could cause issues for future sessions and analytics.
  }

  // Broadcast the "session_finalized" event
  const roomName = `group-${groupId}`;
  io.to(roomName).emit("session_finalized", {
    sessionId,
    presentMembers: presentMemberIds,
  });

  console.log(
    `[Broadcast] 📢 'session_finalized' emitted to room: ${roomName}`,
  );

  activeSessions.delete(sessionId);
};

// Exporting for use in onConnection event handlers
export { activeSessions, finalizeSession };
