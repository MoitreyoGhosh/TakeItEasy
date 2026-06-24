import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { onConnection } from "./events/onConnection.js";
import { authMiddleware, internalApiAuthMiddleware } from "./utils/auth.js";
import { startSession } from "./sessionManager.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: process.env.ROLLX_CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "WebSocket server is healthy." });
});

// Internal endpoint for RollX to initiate a new attendance session
app.post(
  "/api/internal/start-session",
  internalApiAuthMiddleware, // Apply security middleware first
  (req, res) => {
    try {
      const {
        sessionId,
        groupId,
        duration,
        studentIds,
        notificationMap,
        groupName,
      } = req.body;

      // Validate the incoming data
      if (
        !sessionId ||
        !groupId ||
        !duration ||
        !studentIds ||
        !notificationMap
      ) {
        return res
          .status(400)
          .json({ message: "Missing required session data." });
      }

      // Delegate the logic to our session manager
      startSession(
        sessionId,
        groupId,
        duration,
        studentIds || [],
        notificationMap || [],
        groupName,
      );

      res.status(200).json({ message: "Session successfully initiated." });
    } catch (error) {
      console.error("[API Error] /start-session failed:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// Internal endpoint for rollx to confirm manual attendance requests
app.post(
  "/api/internal/manual-confirm",
  internalApiAuthMiddleware,
  (req, res) => {
    try {
      const { sessionId, studentId, groupId } = req.body;
      const roomName = `group-${groupId}`;

      // Notify host to update roster
      io.to(roomName).emit("participant_confirmed", { _id: studentId });
      // Notify student their request was approved
      io.to(roomName).emit("manual_attendance_approved", {
        studentId,
        sessionId,
      });

      res
        .status(200)
        .json({ message: "Manual attendance confirmed and broadcasted." });
    } catch (error) {
      console.error("[API Error] /manual-confirm failed:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// Internal endpoint for rollx to reject manual attendance requests
app.post(
  "/api/internal/manual-reject",
  internalApiAuthMiddleware,
  async (req, res) => {
    try {
      const { sessionId, studentId, groupId } = req.body;

      const roomName = `group-${groupId}`;

      // Fetch all connected sockets inside this classroom
      const sockets = await io.in(roomName).fetchSockets();

      sockets.forEach((socket) => {
        // Notify ONLY the student whose request was rejected
        if (
          socket.data.role === "Student" &&
          socket.data.userId === studentId
        ) {
          socket.emit("manual_attendance_rejected", {
            studentId,
            sessionId,
          });
        }
      });

      res.status(200).json({
        message: "Manual attendance rejection sent successfully.",
      });
    } catch (error) {
      console.error("[API Error] /manual-reject failed:", error);

      res.status(500).json({
        message: "Internal server error.",
      });
    }
  },
);

// Internal endpoint for rollx to forward broadcast manual attendance requests to host
app.post(
  "/api/internal/new-manual-request",
  internalApiAuthMiddleware,
  async (req, res) => {
    try {
      const {
        sessionId,
        studentId,
        groupId,
        hostId,
        reason,
        name,
        rollNo,
        notificationId,
      } = req.body;

      // Send directly to host personal room
      io.to(`user-${hostId}`).emit("manual_attendance_request", {
        notificationId,
        studentId,
        sessionId,
        groupId,
        reason,
        name,
        rollNo,
      });

      res.status(200).json({
        message: "Manual request sent to host successfully.",
      });
    } catch (error) {
      console.error("[API Error] /new-manual-request failed:", error);

      res.status(500).json({
        message: "Internal server error.",
      });
    }
  },
);

io.use(authMiddleware);
io.on("connection", onConnection);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(
    `[Server] WebSocket server is running on http://localhost:${PORT}`,
  );
});

export { io };
