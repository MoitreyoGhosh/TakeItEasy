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
  profile?: Pick<IStudent, "universityRollNo" | "classRollNo"> | null;
}

interface PopulatedGroup {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  members: PopulatedMember[];
}

// GET group by ID
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

    // Create a new sorted array to avoid mutating fetched data.
    const sortedMembers = [...group.members].sort((a, b) => {
      const rollA = a.profile?.classRollNo ?? a.profile?.universityRollNo ?? "";
      const rollB = b.profile?.classRollNo ?? b.profile?.universityRollNo ?? "";
      return rollA.localeCompare(rollB, undefined, { numeric: true });
    });

    const responseGroup = { ...group, members: sortedMembers };

    return NextResponse.json({ group: responseGroup }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching group ${groupId}:`, error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

// PATCH group by ID
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  let groupId: string = "";
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "Host") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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

    // Update group details
    const body = await request.json();
    const {
      groupName,
      description,
      capacity,
      groupType,
      schedules,
      eventTime,
    } = body;

    // Validation
    if (!groupName || groupName.trim().length === 0) {
      return NextResponse.json(
        { message: "Group name is required" },
        { status: 400 }
      );
    }
    if (capacity < 1) {
      return NextResponse.json(
        { message: "Capacity must be at least 1" },
        { status: 400 }
      );
    }
    if (!groupType || !["Class", "Event"].includes(groupType)) {
      return NextResponse.json(
        { message: "A valid group type is required" },
        { status: 400 }
      );
    }
    if (groupType === "Class") {
      // Check if schedules is a non-empty array
      if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
        return NextResponse.json(
          { message: "At least one schedule is required for a class" },
          { status: 400 }
        );
      }

      // Validate every schedule object inside the array
      for (const s of schedules) {
        if (s.dayOfWeek === undefined || !s.startTime || !s.endTime) {
          return NextResponse.json(
            {
              message:
                "Each schedule entry must be complete (day, start time, end time)",
            },
            { status: 400 }
          );
        }
      }
    }
    if (
      groupType === "Event" &&
      (!eventTime || !eventTime.start || !eventTime.end)
    ) {
      return NextResponse.json(
        { message: "A start and end time is required for an event" },
        { status: 400 }
      );
    }

    // Prepare the update object
    interface UpdateData {
      groupName: string;
      description?: string;
      capacity: number;
      groupType: "Class" | "Event";
      schedules?: typeof schedules | null;
      eventTime?: typeof eventTime | null;
    }

    const updateData: UpdateData = {
      groupName: groupName.trim(),
      description: description?.trim(),
      capacity: capacity,
      groupType: groupType,
    };

    // Set the appropriate time fields based on group type
    if (groupType === "Class") {
      updateData.schedules = schedules;
      updateData.eventTime = null; // Remove eventTime for class groups
    } else {
      // Event
      updateData.eventTime = {
        start: new Date(eventTime.start),
        end: new Date(eventTime.end),
      };
      updateData.schedules = null; // Remove schedule for event groups
    }

    const updatedGroup = await Group.findOneAndUpdate(
      { _id: groupId, owner: session.user.id }, // Atomic authorization check
      { $set: updateData },
      { new: true } // Return the updated document
    ).lean();

    if (!updatedGroup) {
      return NextResponse.json(
        { message: "Group not found or you are not the owner" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Group updated successfully", group: updatedGroup },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error updating group ${groupId}:`, error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

// DELETE group by ID
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  let groupId: string = "";
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "Host") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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

    // Delete the group
    const result = await Group.findOneAndDelete({
      _id: groupId,
      owner: session.user.id, // Atomic authorization check
    });

    if (!result) {
      return NextResponse.json(
        { message: "Group not found or you are not the owner" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Group deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting group ${groupId}:`, error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
