import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import jwt from "jsonwebtoken";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { message: "Server config error" },
        { status: 500 },
      );
    }

    // Global Payload: Just who they are and their role
    const payload = {
      userId: session.user.id,
      role: session.user.role,
    };

    // Longer expiry since it's a global app session
    const ticket = jwt.sign(payload, jwtSecret, { expiresIn: "12h" });

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Error generating WebSocket ticket:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
