import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db";
import AttendanceSession from "@/lib/models/AttendanceSession.model";
import mongoose from "mongoose";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const { studentId } = await request.json();

    const sessionAuth = await getServerSession(authOptions);

    if (!sessionAuth?.user || sessionAuth.user.role !== "Host") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (
      !mongoose.Types.ObjectId.isValid(sessionId) ||
      !mongoose.Types.ObjectId.isValid(studentId)
    ) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    await connectToDatabase();
    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    const updatedSession = await AttendanceSession.findOneAndUpdate(
      {
        _id: sessionId,
        host: new mongoose.Types.ObjectId(sessionAuth.user.id),
      },
      { $set: { "manualRequests.$[elem].status": "rejected" } },
      {
        arrayFilters: [
          { "elem.student": studentObjectId, "elem.status": "pending" },
        ],
        new: true,
      },
    );

    if (!updatedSession) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 },
      );
    }

    if (!updatedSession) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 },
      );
    }

    const groupId = updatedSession.group.toString();

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080";

    await fetch(`${WS_URL}/api/internal/manual-reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
      },
      body: JSON.stringify({
        sessionId,
        studentId,
        groupId,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Manual reject error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
