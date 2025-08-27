import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import Group from "@/lib/models/Group.model";
import Student, { IStudent } from "@/lib/models/Student.model";
import User from "@/lib/models/User.model";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";

interface PopulatedMember {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  profile?: Pick<IStudent, "universityRollNo" | "classRollNo" > | null;
}

interface PopulatedGroup {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  members: PopulatedMember[];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  let groupId: string = "";
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const resolvedParams = await params;
    groupId = resolvedParams.groupId;

    const userId = new mongoose.Types.ObjectId(session.user.id);

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json(
        { message: "Invalid Group ID" },
        { status: 400 }
      );
    }

    const group = await Group.findById(groupId)
      .populate({
        path: "members",
        model: User,
        select: "name email profile",
        populate: {
          path: "profile",
          model: Student,
          select: "universityRollNo classRollNo",
        },
      })
      .lean<PopulatedGroup>();

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    // Authorization
    const hasAccess =
      group.owner.toString() === userId.toString() ||
      group.members.some((m) => m._id.toString() === userId.toString());

    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Sort by classRollNo if available, otherwise universityRollNo
    group.members.sort((a, b) => {
      const rollA = a.profile?.classRollNo ?? a.profile?.universityRollNo ?? "";
      const rollB = b.profile?.classRollNo ?? b.profile?.universityRollNo ?? "";
      return rollA.localeCompare(rollB, undefined, { numeric: true });
    });

    return NextResponse.json({ group }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching group ${groupId}:`, error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
