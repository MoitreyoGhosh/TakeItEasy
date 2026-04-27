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
      const { sessionId, groupId, duration } = req.body;

      // Validate the incoming data
      if (!sessionId || !groupId || !duration) {
        return res
          .status(400)
          .json({ message: "Missing required session data." });
      }

      // Delegate the logic to our session manager
      startSession(sessionId, groupId, duration);

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
  (req, res) => {
    try {
      const { sessionId, studentId, groupId } = req.body;

      const roomName = `group-${groupId}`;
      io.to(roomName).emit("manual_attendance_rejected", {
        studentId,
        sessionId,
      });

      res
        .status(200)
        .json({ message: "Manual attendance rejected and broadcasted." });
    } catch (error) {
      console.error("[API Error] /manual-reject failed:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// Internal endpoint for rollx to forward broadcast manual attendance requests to host
app.post(
  "/api/internal/new-manual-request",
  internalApiAuthMiddleware,
  (req, res) => {
    try {
      const { sessionId, studentId, groupId, reason } = req.body;

      const roomName = `group-${groupId}`;

      // Relay the request event to the Host
      io.to(roomName).emit("manual_attendance_request", {
        studentId,
        sessionId,
        reason,
      });

      res.status(200).json({ message: "Manual request broadcasted to host." });
    } catch (error) {
      console.error("[API Error] /new-manual-request failed:", error);
      res.status(500).json({ message: "Internal server error." });
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
