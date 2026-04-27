import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db";
import AttendanceSession from "@/lib/models/AttendanceSession.model";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const sessionAuth = await getServerSession(authOptions);
    if (!sessionAuth?.user)
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );

    const { sessionId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId))
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

    await connectToDatabase();

    // We only need to return the group ID so the frontend can initialize the socket
    const session = await AttendanceSession.findById(sessionId)
      .select("group")
      .lean();

    if (!session)
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({ groupId: session.group.toString() });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
