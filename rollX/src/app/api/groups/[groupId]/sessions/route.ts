import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import Group from "@/lib/models/Group.model";
import AttendanceSession from "@/lib/models/AttendanceSession.model";
import mongoose from "mongoose";
import { customAlphabet } from "nanoid";
import { connectToDatabase } from "@/lib/db";

// Configuration Constants
const generateShortCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const SESSION_DURATION_SECONDS = 45; // 45 seconds

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await context.params;
  try {
    // 1. Authenticate the user (This is our first `await`)
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "Host") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 2. Validate Group ID and connect to DB
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json(
        { message: "Invalid Group ID" },
        { status: 400 }
      );
    }

    const hostId = new mongoose.Types.ObjectId(session.user.id);

    // 3. Ensure the host owns this group
    const group = await Group.findOne({ _id: groupId, owner: hostId });
    if (!group) {
      return NextResponse.json(
        { message: "Group not found or you are not the owner" },
        { status: 404 }
      );
    }

    // 4. Prevent multiple active sessions for the same group
    const existingActiveSession = await AttendanceSession.findOne({
      group: groupId,
      status: "active",
    });
    if (existingActiveSession) {
      return NextResponse.json(
        { message: "An active session for this group already exists." },
        { status: 409 }
      );
    }

    // 5. Create and save a new attendance session
    const shortCode = generateShortCode();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
    const newSession = new AttendanceSession({
      group: groupId,
      host: hostId,
      shortCode,
      expiresAt,
      status: "active",
    });
    await newSession.save();

    // 6. Notify the WebSocket server (internal secure call)
    const wsHost =
      process.env.NODE_ENV === "production" ? "ws-server" : "localhost";
    const wsServerUrl = `http://${wsHost}:${
      process.env.WS_SERVER_PORT || 8080
    }/api/internal/start-session`;

    console.log(`[Session Start] Notifying ws-server at: ${wsServerUrl}`);

    const internalApiResponse = await fetch(wsServerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
      },
      body: JSON.stringify({
        sessionId: newSession._id!.toString(),
        groupId,
        duration: SESSION_DURATION_SECONDS,
      }),
    });

    if (!internalApiResponse.ok) {
      console.error(
        "Failed to notify ws-server:",
        await internalApiResponse.text()
      );
      await AttendanceSession.findByIdAndDelete(newSession._id);
      return NextResponse.json(
        { message: "Failed to start real-time session." },
        { status: 500 }
      );
    }

    // 7. Success response
    return NextResponse.json(
      {
        message: "Session started successfully!",
        session: {
          id: newSession._id,
          shortCode: newSession.shortCode,
          expiresAt: newSession.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error starting session:", error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
