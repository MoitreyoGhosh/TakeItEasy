import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import AttendanceSession from "@/lib/models/AttendanceSession.model";
import { connectToDatabase } from "@/lib/db";

// In-memory rate limiting map
// Key: "sessionId-userId"
const rateLimitMap = new Map<string, { attempts: number; timestamp: number }>();

const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;

    const sessionAuth = await getServerSession(authOptions);

    if (!sessionAuth?.user || sessionAuth.user.role !== "Student") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const userId = sessionAuth.user.id;

    // validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request payload." },
        { status: 400 },
      );
    }

    const normalizedCode = body?.shortCode?.toUpperCase();

    // basic validation before hitting the database
    if (!normalizedCode || !/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      return NextResponse.json(
        { message: "Invalid code format." },
        { status: 400 },
      );
    }

    // rate limiting
    const rateKey = `${sessionId}-${userId}`;
    const now = Date.now();

    const userLimit = rateLimitMap.get(rateKey);

    if (userLimit) {
      if (now - userLimit.timestamp < RATE_LIMIT_WINDOW_MS) {
        if (userLimit.attempts >= MAX_ATTEMPTS) {
          return NextResponse.json(
            {
              message:
                "Too many failed attempts. Please try again in 1 minute.",
            },
            { status: 429 },
          );
        }

        userLimit.attempts += 1;
      } else {
        rateLimitMap.set(rateKey, { attempts: 1, timestamp: now });
      }
    } else {
      rateLimitMap.set(rateKey, { attempts: 1, timestamp: now });
    }

    // automatic cleanup to prevent memory leak
    setTimeout(() => {
      rateLimitMap.delete(rateKey);
    }, RATE_LIMIT_WINDOW_MS);

    await connectToDatabase();

    const attendanceSession = await AttendanceSession.findById(sessionId);

    if (!attendanceSession) {
      return NextResponse.json(
        { message: "Session not found." },
        { status: 404 },
      );
    }

    // expiration check
    if (
      attendanceSession.status !== "active" ||
      new Date() > attendanceSession.expiresAt
    ) {
      if (attendanceSession.status === "active") {
        attendanceSession.status = "expired";
        await attendanceSession.save();
      }

      return NextResponse.json(
        { message: "This attendance session has expired." },
        { status: 410 },
      );
    }

    // validate attendance code
    if (attendanceSession.shortCode !== normalizedCode) {
      return NextResponse.json(
        { message: "Incorrect attendance code." },
        { status: 400 },
      );
    }

    // success: clear rate limit entry
    rateLimitMap.delete(rateKey);

    return NextResponse.json({
      success: true,
      message: "Code accepted. Proceeding to verification.",
    });
  } catch (error) {
    console.error("Error submitting attendance:", error);

    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}
