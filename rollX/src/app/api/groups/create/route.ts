import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db";
import Group, { ISchedule } from "@/lib/models/Group.model";
import { customAlphabet } from "nanoid";

/**
 * Generates a unique, non-ambiguous 8-character code for joining a group.
 * Excludes characters that are easily confused (e.g., '0' and 'O', '1' and 'I').
 */
const generateJoinCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Authentication & Authorization Check
    if (!session?.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }
    if (session.user.role !== "Host") {
      return NextResponse.json(
        { message: "Forbidden: Only Hosts can create groups" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // 2. Input Parsing and Validation
    const body = await request.json();
    const {
      groupName,
      description,
      capacity,
      groupType,
      schedules,
      eventTime,
    } = body;

    if (
      !groupName ||
      typeof groupName !== "string" ||
      groupName.trim().length === 0
    ) {
      return NextResponse.json(
        { message: "Group name is required" },
        { status: 400 }
      );
    }
    if (
      capacity === undefined ||
      typeof capacity !== "number" ||
      capacity < 1
    ) {
      return NextResponse.json(
        { message: "Capacity must be a positive number" },
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

    // 3. Ensure the generated join code is unique
    let joinCode;
    let isCodeUnique = false;
    let attempts = 0;
    while (!isCodeUnique && attempts < 10) {
      // Safety break after 10 tries
      joinCode = generateJoinCode();
      const existingGroup = await Group.findOne({ joinCode });
      if (!existingGroup) {
        isCodeUnique = true;
      }
      attempts++;
    }

    if (!isCodeUnique) {
      // This is extremely rare, but good to handle.
      return NextResponse.json(
        { message: "Could not generate a unique join code. Please try again." },
        { status: 500 }
      );
    }

    interface GroupData {
      groupName: string;
      capacity: number;
      joinCode: string;
      owner: string;
      members: [];
      groupType: "Class" | "Event";
      description?: string;
      schedules?: ISchedule[];
      eventTime?: { start: Date; end: Date };
    }

    // 4. Database Operation: Create and save the new group
    const groupData: GroupData = {
      groupName: groupName.trim(),
      capacity,
      joinCode,
      owner: session.user.id,
      members: [], // A new group starts with no members
      // Conditionally add description if it's a valid, non-empty string
      ...(description &&
        typeof description === "string" &&
        description.trim().length > 0 && { description: description.trim() }),
      groupType: groupType,
    };

    if (groupType === "Class") {
      groupData.schedules = schedules.map((s: ISchedule) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      }));
    } else {
      groupData.eventTime = {
        start: new Date(eventTime.start),
        end: new Date(eventTime.end),
      };
    }

    console.log("Creating group with data:", groupData);

    const newGroup = new Group(groupData);
    await newGroup.save();

    return NextResponse.json(
      {
        message: "Group created successfully!",
        group: newGroup,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating group:", error);
    // Generic error for the client to prevent leaking implementation details
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
