import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import Group from "@/lib/models/Group.model";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  let groupId: string = "";
  let memberId: string = "";

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "Host") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const resolvedParams = await params;
    groupId = resolvedParams.groupId;
    memberId = resolvedParams.memberId;

    const hostId = new mongoose.Types.ObjectId(session.user.id);

    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(memberId)
    ) {
      return NextResponse.json(
        { message: "Invalid ID provided" },
        { status: 400 }
      );
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    // Authorization: Ensure the requester is the owner of this specific group
    if (group.owner.toString() !== hostId.toString()) {
      return NextResponse.json(
        { message: "You are not the owner of this group" },
        { status: 403 }
      );
    }

    // Use $pull to atomically remove the member from the array
    await Group.updateOne(
      { _id: groupId },
      { $pull: { members: new mongoose.Types.ObjectId(memberId) } }
    );

    return NextResponse.json(
      { message: "Member removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `Error removing member ${memberId} from group ${groupId}:`,
      error
    );
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
