import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db";
import AttendanceSession from "@/lib/models/AttendanceSession.model";
import Student from "@/lib/models/Student.model";
import { createNotification } from "@/lib/services/notification.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const sessionAuth = await getServerSession(authOptions);

    // Authorization: Only authenticated students can make manual attendance requests
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

    // Fetch student's profile details for notification
    let studentName = sessionAuth.user.name || "Unknown Student";
    let studentRollNo = "N/A";

    try {
      const studentProfile = await Student.findOne({
        user: studentObjectId,
      })
        .select("fullName universityRollNo")
        .lean<{
          fullName?: string;
          universityRollNo?: string;
        } | null>();

      if (studentProfile && !Array.isArray(studentProfile)) {
        studentName = studentProfile.fullName || studentName;

        studentRollNo = studentProfile.universityRollNo || "N/A";
      }
    } catch (err) {
      console.error("[Manual Request] Failed to fetch student profile:", err);
    }

    // Validate session eligibility BEFORE creating notification
    const existingSession = await AttendanceSession.findOne({
      _id: sessionId,
      status: { $ne: "active" },
      presentMembers: { $ne: studentObjectId },

      // Prevent duplicate active requests
      manualRequests: {
        $not: {
          $elemMatch: {
            student: studentObjectId,

            status: {
              $in: ["pending", "approved"],
            },
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
                    {
                      $toString: "$$req.student",
                    },
                    studentObjectId.toString(),
                  ],
                },
              },
            },
          },
          MAX_ATTEMPTS,
        ],
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        {
          message:
            "Could not submit request. The session may be active, you may already be present, or you have reached the maximum number of attempts.",
        },
        {
          status: 409,
        },
      );
    }

    // Create persistent notification FIRST
    const notification = await createNotification({
      recipient: existingSession.host.toString(),
      type: "manual_request",
      priority: "high",
      persistent: true,
      data: {
        sessionId,
        groupId: existingSession.group.toString(),
        studentId,
        name: studentName,
        rollNo: studentRollNo,
        reason: reason || "",
      },

      // Auto-expire after 24 hours
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const notificationId = notification._id;

    console.log(
      "[Manual Request Notification Created]",
      notificationId.toString(),
    );

    // Create request object WITH notification linkage
    const newRequest = {
      notificationId,
      student: studentObjectId,
      reason: reason || "",
      status: "pending" as const,
      requestedAt: new Date(),
    };

    // Push request after notification creation
    const updatedSession = await AttendanceSession.findByIdAndUpdate(
      sessionId,
      { $push: { manualRequests: newRequest } },
      { new: true },
    );

    if (!updatedSession) {
      return NextResponse.json(
        { message: "Failed to update session with manual request." },
        { status: 500 },
      );
    }

    // Real-time notification to host via WebSocket
    if (!process.env.INTERNAL_API_KEY) {
      console.error("[Manual Request] INTERNAL_API_KEY is not configured.");
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
            notificationId: notificationId.toString(),
            sessionId,
            studentId,
            groupId: existingSession.group.toString(),
            hostId: existingSession.host.toString(),
            reason: reason || "",
            name: studentName,
            rollNo: studentRollNo,
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

        request: {
          ...newRequest,
          notificationId: notificationId.toString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Manual Attendance Request Error]", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
