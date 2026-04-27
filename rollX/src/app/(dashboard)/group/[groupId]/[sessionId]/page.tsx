import { HostLiveView } from "@/components/sessions/HostLiveView";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { notFound } from "next/navigation";
import Group from "@/lib/models/Group.model";
import AttendanceSession from "@/lib/models/AttendanceSession.model";
import User from "@/lib/models/User.model";
import Student from "@/lib/models/Student.model";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { SerializableMember } from "@/types/types";

// --- Strict TypeScript Interfaces for Lean DB Documents ---
interface IUserDoc {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
}

interface IStudentDoc {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  fullName?: string;
  universityRollNo?: string;
}

export default async function HostSessionPage({
  params,
}: {
  params: Promise<{ groupId: string; sessionId: string }>;
}) {
  const { groupId, sessionId } = await params;

  // Auth Check
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth?.user || sessionAuth.user.role !== "Host") {
    return notFound();
  }

  await connectToDatabase();

  // Validate Route Params
  if (
    !mongoose.Types.ObjectId.isValid(groupId) ||
    !mongoose.Types.ObjectId.isValid(sessionId)
  ) {
    return notFound();
  }

  // Fetch Group and Session (Base Data)
  const [group, attendanceSession] = await Promise.all([
    Group.findOne({ _id: groupId, owner: sessionAuth.user.id })
      .select("groupName members")
      .lean(),
    AttendanceSession.findById(sessionId)
      .select("shortCode expiresAt presentMembers absentMembers")
      .lean(),
  ]);

  if (!group || !attendanceSession) return notFound();

  const groupMemberIds = group.members as mongoose.Types.ObjectId[];

  // Fetch Users and Students Independently
  // We run these in parallel to ensure we get all data regardless of Mongoose refs
  const [users, students] = await Promise.all([
    User.find({ _id: { $in: groupMemberIds } })
      .select("name email")
      .lean() as Promise<IUserDoc[]>,
    Student.find({ user: { $in: groupMemberIds } })
      .select("user fullName universityRollNo")
      .lean() as unknown as Promise<IStudentDoc[]>,
  ]);

  // Build a Strongly-Typed Map to Merge the Data
  const memberMap = new Map<string, SerializableMember>();

  // Step 5a: Initialize with User base data
  for (const u of users) {
    const userIdStr = u._id.toString();
    memberMap.set(userIdStr, {
      _id: userIdStr,
      name: u.name || "Unknown User",
      email: u.email || "",
      profile: {
        fullName: u.name || "Unknown User", // Fallback to basic name
        universityRollNo: "N/A", // Default fallback
      },
    });
  }

  // Overlay rich Student data where it exists
  for (const s of students) {
    const userIdStr = s.user.toString();
    const existingMember = memberMap.get(userIdStr);

    if (existingMember && existingMember.profile) {
      // If Student record exists, it overrides the basic user data
      existingMember.profile.fullName = s.fullName || existingMember.name;
      existingMember.profile.universityRollNo = s.universityRollNo || "N/A";
      // Update top-level name for UI consistency
      existingMember.name = s.fullName || existingMember.name;
    }
  }

  // Construct the Final Arrays for the Client
  const serializedRosterMembers: SerializableMember[] = [];
  for (const idObj of groupMemberIds) {
    const idStr = idObj.toString();
    const member = memberMap.get(idStr);
    if (member) serializedRosterMembers.push(member);
  }

  // Type-safe helper to map ObjectId arrays to SerializableMember arrays
  const mapIdsToMembers = (
    ids: mongoose.Types.ObjectId[] | undefined,
  ): SerializableMember[] => {
    if (!ids) return [];
    return ids
      .map((idObj) => memberMap.get(idObj.toString()))
      .filter((m): m is SerializableMember => m !== undefined);
  };

  const serializedPresentMembers = mapIdsToMembers(
    (attendanceSession.presentMembers as unknown as mongoose.Types.ObjectId[]) ||
      [],
  );
  const serializedAbsentMembers = mapIdsToMembers(
    (attendanceSession.absentMembers as unknown as mongoose.Types.ObjectId[]) ||
      [],
  );

  // 7. Prepare Props
  const sessionProps = {
    id: attendanceSession._id.toString(),
    shortCode: attendanceSession.shortCode,
    expiresAt: attendanceSession.expiresAt.toISOString(),
  };

  const groupProps = {
    id: groupId,
    name: group.groupName,
    totalMembers: groupMemberIds.length,
  };

  return (
    <HostLiveView
      session={sessionProps}
      group={groupProps}
      initialPresentMembers={serializedPresentMembers}
      initialAbsentMembers={serializedAbsentMembers}
      rosterMembers={serializedRosterMembers}
    />
  );
}
