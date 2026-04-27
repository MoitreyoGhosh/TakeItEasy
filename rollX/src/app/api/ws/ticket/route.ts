import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import jwt from "jsonwebtoken";
import Group from "@/lib/models/Group.model";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    // Verify user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    // Parse request body
    const { groupId } = await request.json();

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json(
        { message: "A valid Group ID is required" },
        { status: 400 },
      );
    }

    // Connect to DB
    await connectToDatabase();

    // Fetch group to verify membership
    const group = await Group.findById(groupId).select("owner members").lean();

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const userId = session.user.id;

    const isOwner = group.owner.toString() === userId;

    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId,
    );

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { message: "Forbidden: You are not part of this group" },
        { status: 403 },
      );
    }

    // Verify JWT secret
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not defined.");
      return NextResponse.json(
        { message: "Internal server configuration error." },
        { status: 500 },
      );
    }

    // Determine role for WebSocket connection
    const role: "Host" | "Student" = isOwner ? "Host" : "Student";

    // Create JWT payload
    const payload = {
      userId,
      groupId,
      role,
    };

    //  Sign WebSocket ticket
    // Increased expiry to avoid reconnect issues
    const ticket = jwt.sign(payload, jwtSecret, {
      expiresIn: "10m",
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Error generating WebSocket ticket:", error);

    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
