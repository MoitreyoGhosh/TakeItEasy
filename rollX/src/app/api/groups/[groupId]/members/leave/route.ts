import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db";
import Group from "@/lib/models/Group.model";
import mongoose from "mongoose";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  let groupId: string = "";
  try {
    const session = await getServerSession(authOptions);

    // Authentication Check
    if (!session?.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }
    // Authorization Check: Only students can use this endpoint.
    if (session.user.role !== "Student") {
      return NextResponse.json(
        { message: "Forbidden: Only students can leave groups." },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const resolvedParams = await params;
    groupId = resolvedParams.groupId;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json(
        { message: "Invalid Group ID" },
        { status: 400 }
      );
    }

    // Database Operation: Atomically remove the student's ID from the members array.
    await Group.findByIdAndUpdate(groupId, {
      $pull: { members: session.user.id },
    });

    return NextResponse.json(
      { message: "You have successfully left the group." },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error leaving group ${groupId}:`, error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
