export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db";
import AttendanceSession from "@/lib/models/AttendanceSession.model";
import mongoose from "mongoose";

interface IProjectedSession {
  _id: mongoose.Types.ObjectId;
  presentMembers?: mongoose.Types.ObjectId[];
  manualRequests?: {
    student: mongoose.Types.ObjectId;
    reason?: string;
    status: "pending" | "approved" | "rejected";
    requestedAt: Date;
  }[];
}

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string; userId: string }> },
) {
  try {
    const sessionAuth = await getServerSession(authOptions);

    if (!sessionAuth?.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    const { sessionId, userId } = await context.params;

    // Security check
    if (sessionAuth.user.id !== userId && sessionAuth.user.role !== "Host") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (
      !mongoose.Types.ObjectId.isValid(sessionId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const session = await AttendanceSession.findOne(
      { _id: sessionId },
      {
        presentMembers: 1, // Only fetch present members to check if the user is already approved
        manualRequests: 1, // Only fetch manual requests to check for existing ones and count attempts
      },
    ).lean<IProjectedSession | null>();

    if (!session) {
      return NextResponse.json({ status: "none", attempts: 0 });
    }

    // Check if already present
    if (session.presentMembers?.some((id) => id.toString() === userId)) {
      return NextResponse.json({ status: "approved", attempts: 0 });
    }

    // Filter requests to just this user to count them
    const userRequests =
      session.manualRequests?.filter(
        (req) => req.student.toString() === userId,
      ) || [];

    const attemptsCount = userRequests.length;

    if (attemptsCount > 0) {
      const latestRequest = userRequests[attemptsCount - 1];

      return NextResponse.json({
        status: latestRequest.status,
        attempts: attemptsCount,
      });
    }

    // No requests
    return NextResponse.json({
      status: "none",
      attempts: 0,
    });
  } catch (error) {
    console.error("Error fetching manual status:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
