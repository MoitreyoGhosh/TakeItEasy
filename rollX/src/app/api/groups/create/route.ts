import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db";
import Group from "@/lib/models/Group.model";
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
    const { groupName, capacity } = body;

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
    if (capacity && (typeof capacity !== "number" || capacity < 1)) {
      return NextResponse.json(
        { message: "Capacity must be a positive number" },
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

    // 4. Database Operation: Create and save the new group
    const newGroup = new Group({
      groupName: groupName.trim(),
      capacity,
      joinCode,
      owner: session.user.id,
      members: [], // A new group starts with no members
    });

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
