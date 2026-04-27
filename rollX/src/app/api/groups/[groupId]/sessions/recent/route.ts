import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import AttendanceSession from "@/lib/models/AttendanceSession.model";
import mongoose, { Types } from "mongoose";

type RecentSessionLean = {
  _id: Types.ObjectId;
  createdAt: Date;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const { groupId } = await params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ message: "Invalid groupId" }, { status: 400 });
    }

    await connectToDatabase();

    const recentSession = await AttendanceSession.findOne({
      group: groupId,
      status: "completed",
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // Only consider sessions finalized in the last 30 minutes for manual attendance requests
    })
      .sort({ createdAt: -1 })
      .select("_id createdAt")
      .lean<RecentSessionLean>();

    if (!recentSession) {
      return NextResponse.json({ sessionId: null });
    }

    return NextResponse.json({
      sessionId: recentSession._id.toString(),
      createdAt: recentSession.createdAt,
    });
  } catch (error) {
    console.error("Error fetching recent session:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
