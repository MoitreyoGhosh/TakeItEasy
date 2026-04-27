import { NextResponse } from "next/server";
import AttendanceSession from "@/lib/models/AttendanceSession.model";
import Group from "@/lib/models/Group.model";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";

// Middleware-like function to protect the internal route
async function protectedInternalRoute(request: Request) {
  const apiKey = request.headers.get("authorization")?.split(" ")[1];
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return new NextResponse(
      JSON.stringify({ message: "Forbidden: Invalid API key" }),
      { status: 403 },
    );
  }
  return null;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  // Protect the route
  const authError = await protectedInternalRoute(request);
  if (authError) return authError;

  try {
    const { sessionId } = await context.params;
    const { presentMembers } = await request.json(); // List of userIds from ws-server

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { message: "Invalid Session ID" },
        { status: 400 },
      );
    }
    if (!Array.isArray(presentMembers)) {
      return NextResponse.json(
        { message: "presentMembers must be an array" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 },
      );
    }
    if (session.status !== "active") {
      return NextResponse.json(
        { message: "Session is not active and cannot be finalized." },
        { status: 409 },
      );
    }

    // Find the full list of members from the group to calculate who was absent
    const group = await Group.findById(session.group).select("members").lean();
    if (!group) {
      return NextResponse.json(
        { message: "Associated group not found" },
        { status: 404 },
      );
    }

    const allMemberIds = group.members.map((id) => id.toString());
    const presentMemberIds = presentMembers.map((id) => id.toString());

    // Calculate absent members
    const absentMembers = allMemberIds.filter(
      (id) => !presentMemberIds.includes(id),
    );

    // Update the session document
    session.presentMembers = presentMemberIds.map(
      (id) => id as unknown as mongoose.Schema.Types.ObjectId,
    );
    session.absentMembers = absentMembers.map(
      (id) => id as unknown as mongoose.Schema.Types.ObjectId,
    );
    session.status = "completed";

    await session.save();

    return NextResponse.json({ message: "Session finalized successfully." });
  } catch (error) {
    console.error(
      `Error finalizing session ${await context.params}.sessionId:`,
      error,
    );
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
