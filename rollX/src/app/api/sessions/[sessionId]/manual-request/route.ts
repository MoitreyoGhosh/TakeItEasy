import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db";
import AttendanceSession from "@/lib/models/AttendanceSession.model";
import mongoose from "mongoose";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const sessionAuth = await getServerSession(authOptions);

    if (!sessionAuth?.user || sessionAuth.user.role !== "Student") {
      return NextResponse.json(
        { message: "Forbidden: Only students can request attendance" },
        { status: 403 },
      );
    }

    const { sessionId } = await context.params;
    const { reason } = await request.json();
    const studentId = sessionAuth.user.id;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { message: "Invalid session ID" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    // Rate Limiting: Max 3 attempts per session
    const MAX_ATTEMPTS = 3;

    const newRequest = {
      student: studentObjectId,
      reason: reason || "",
      status: "pending" as const,
      requestedAt: new Date(),
    };

    /**
     * Single, Atomic Update and Validation
     * MongoDB validates everything in one query.
     */
    const updatedSession = await AttendanceSession.findOneAndUpdate(
      {
        _id: sessionId,
        status: { $ne: "active" },
        presentMembers: { $ne: studentObjectId },
        // Condition to check for pending/approved requests
        manualRequests: {
          $not: {
            $elemMatch: {
              student: studentObjectId,
              status: { $in: ["pending", "approved"] },
            },
          },
        },
        // Rate limit check
        $expr: {
          $lt: [
            {
              $size: {
                $filter: {
                  input: "$manualRequests",
                  as: "req",
                  cond: {
                    $eq: [
                      { $toString: "$$req.student" },
                      studentObjectId.toString(),
                    ],
                  },
                },
              },
            },
            MAX_ATTEMPTS,
          ],
        },
      },
      {
        // Use the pre-defined newRequest object
        $push: { manualRequests: newRequest },
      },
      { new: true },
    );

    if (!updatedSession) {
      return NextResponse.json(
        {
          message:
            "Could not submit request. The session may be active, you may already be present, or you have reached the maximum number of attempts.",
        },
        { status: 409 },
      );
    }

    if (!process.env.INTERNAL_API_KEY) {
      console.error("INTERNAL_API_KEY is not configured.");
    } else {
      const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080";

      const wsRequestUrl = `${WS_URL}/api/internal/new-manual-request`;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        await fetch(wsRequestUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
          },
          body: JSON.stringify({
            sessionId,
            studentId,
            groupId: updatedSession.group.toString(),
            reason: reason || "",
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        console.log(
          `[API] Notified ws-server of new manual request for ${studentId}`,
        );
      } catch (wsError) {
        console.error(
          "[API] Failed to notify ws-server of manual request:",
          wsError,
        );
      }
    }

    return NextResponse.json(
      {
        message: "Manual request submitted successfully.",
        request: newRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Manual attendance request error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
