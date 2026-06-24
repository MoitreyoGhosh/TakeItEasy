import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db";
import AttendanceSession from "@/lib/models/AttendanceSession.model";
import mongoose from "mongoose";

interface PopulatedStudent {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  profile?: {
    fullName?: string;
    universityRollNo?: string;
  };
}

interface ManualRequest {
  _id: mongoose.Types.ObjectId;
  notificationId: mongoose.Types.ObjectId;
  student: PopulatedStudent;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: Date;
}

interface AttendanceSessionLean {
  host: mongoose.Types.ObjectId;
  manualRequests: ManualRequest[];
}

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const sessionAuth = await getServerSession(authOptions);

    if (!sessionAuth?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await context.params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { message: "Invalid session ID" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const session = await AttendanceSession.findById(sessionId)
      .select("manualRequests host")
      .populate("manualRequests.student", "name email profile")
      .lean<AttendanceSessionLean | null>();

    if (!session) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 },
      );
    }

    const manualRequests = session.manualRequests || [];

    // Student Status Check
    if (studentId) {
      const filtered = manualRequests.filter(
        (req) => req.student._id.toString() === studentId,
      );

      const attempts = filtered.length;
      const latest = filtered.sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
      )[0];

      return NextResponse.json({
        status: latest?.status || "none",
        attempts,
      });
    }

    // Host Pending
    if (
      sessionAuth.user.role !== "Host" ||
      session.host.toString() !== sessionAuth.user.id
    ) {
      return NextResponse.json(
        { message: "Forbidden: Not the host of this session" },
        { status: 403 },
      );
    }

    const pending = manualRequests
      .filter((req) => req.status === "pending" && req.notificationId)
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
      )
      .map((req) => ({
        databaseId: req.notificationId.toString(),
        studentId: req.student._id.toString(),
        name: req.student.profile?.fullName || req.student.name || "Unknown",
        email: req.student.email || "",
        rollNo: req.student.profile?.universityRollNo || "",
        reason: req.reason || "",
        sessionId,
        createdAt: req.requestedAt,
      }));

    return NextResponse.json(pending);
  } catch (error) {
    console.error("Manual request hydration error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
