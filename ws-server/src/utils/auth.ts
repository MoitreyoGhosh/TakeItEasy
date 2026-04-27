import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

/**
 * Interface defining the structure of the JWT payload.
 * This ensures type safety for the decoded data.
 */
interface DecodedTicket extends JwtPayload {
  userId: string;
  groupId: string;
  role: "Host" | "Student";
}

/* Socket.IO Authentication Middleware                                      */
/**
 * Verifies clients connecting over WebSocket using a JWT token.
 *
 * - Expects client to send the token as:
 *   `io({ auth: { token: "<JWT>" } })`
 * - Attaches `userId`, `groupId`, and `role` to the `socket.data` object on success.
 */
export const authMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token as string | undefined;

  if (!token) {
    console.warn("[Auth] ❌ Rejected connection: No token provided.");
    return next(new Error("Authentication error: No token provided."));
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("[Auth] 🚨 Missing environment variable: JWT_SECRET");
    return next(
      new Error(
        "Internal server error: Authentication not configured properly.",
      ),
    );
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as DecodedTicket;

    if (!decoded.userId || !decoded.groupId || !decoded.role) {
      console.warn("[Auth] ❌ Token payload missing required fields.");
      return next(new Error("Authentication error: Malformed token payload."));
    }

    // Attach validated user data to the socket
    socket.data.userId = decoded.userId;
    socket.data.groupId = decoded.groupId;
    socket.data.role = decoded.role;

    console.log(
      `[Auth] ✅ Authenticated socket connection: user=${decoded.userId}, group=${decoded.groupId}, role=${decoded.role}`,
    );

    return next();
  } catch (err: unknown) {
    console.warn(
      `[Auth] ❌ Invalid token: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
    return next(new Error("Authentication error: Invalid or expired token."));
  }
};

/* Internal API Authentication Middleware (Express)                         */
/**
 * Protects internal routes by validating an API key passed via
 * the `Authorization: Bearer <API_KEY>` header.
 */
export const internalApiAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers.authorization?.split(" ")[1];

  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    console.warn("[API Auth] ❌ Unauthorized internal API request detected.");
    return res
      .status(403)
      .json({ message: "Forbidden: Invalid or missing API key." });
  }

  // Key verified → proceed
  next();
};
