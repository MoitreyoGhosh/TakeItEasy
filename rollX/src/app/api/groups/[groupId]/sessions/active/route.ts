import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db";
import AttendanceSession from "@/lib/models/AttendanceSession.model";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  context: { params: Promise<{ groupId: string }> },
) {
  try {
    const sessionAuth = await getServerSession(authOptions);

    if (!sessionAuth?.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }
    const { groupId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json(
        { message: "Invalid Group ID" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const activeSession = await AttendanceSession.findOne({
      group: groupId,
      status: "active",
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .select("_id expiresAt")
      .lean();

    if (!activeSession) {
      return NextResponse.json({ activeSession: null });
    }

    return NextResponse.json({
      activeSession: {
        sessionId: activeSession._id.toString(),
        expiresAt: activeSession.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching active session:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
