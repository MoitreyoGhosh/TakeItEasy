import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import Group from "@/lib/models/Group.model";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }
    if (session.user.role !== "Student") {
      return NextResponse.json(
        { message: "Forbidden: Only Students can join groups" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { joinCode } = await request.json();
    if (
      !joinCode ||
      typeof joinCode !== "string" ||
      joinCode.trim().length === 0
    ) {
      return NextResponse.json(
        { message: "A valid join code is required" },
        { status: 400 }
      );
    }

    const sanitizedCode = joinCode.trim().toUpperCase();
    const studentIdString = session.user.id;
    const group = await Group.findOne({ joinCode: sanitizedCode });

    if (!group) {
      return NextResponse.json(
        { message: "Group not found." },
        { status: 404 }
      );
    }

    const isAlreadyMember = group.members.some(
      (memberId) => memberId.toString() === studentIdString
    );

    if (isAlreadyMember) {
      return NextResponse.json(
        { message: `You are already a member of "${group.groupName}".` },
        { status: 200 }
      );
    }

    if (group.members.length >= group.capacity) {
      return NextResponse.json(
        { message: "This group is full." },
        { status: 400 }
      );
    }

    const studentObjectId = new mongoose.Types.ObjectId(studentIdString);
    group.members.push(studentObjectId);
    const savedGroup = await group.save();

    return NextResponse.json(
      {
        message: `Successfully joined "${savedGroup.groupName}"!`,
        group: savedGroup,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error joining group:", error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
