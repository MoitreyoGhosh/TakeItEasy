import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import Group, { IGroupLean } from "@/lib/models/Group.model";
import User from "@/lib/models/User.model";
import Student from "@/lib/models/Student.model";
import Host from "@/lib/models/Host.model";
import mongoose from "mongoose";
import { notFound } from "next/navigation";

import { connectToDatabase } from "@/lib/db";
import { HostGroupView } from "@/components/groups/HostGroupView";
import { ParticipantGroupView } from "@/components/groups/ParticipantGroupView";
import { unstable_noStore as noStore } from "next/cache";

interface PopulatedMember {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  profile?: {
    universityRollNo?: string;
    classRollNo?: string;
    fullName?: string;
  } | null;
}

// Define the shape of the entire group object AFTER population.
interface PopulatedGroup extends Omit<IGroupLean, "members" | "owner"> {
  owner: {
    _id: mongoose.Types.ObjectId;
    profile: {
      fullName: string;
    } | null;
  };
  members: PopulatedMember[];
}

interface PageProps {
  params: Promise<{
    groupId: string;
  }>;
}

async function getGroupData(groupId: string, userId: string) {
  noStore();
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return null;
  }

  const group = await Group.findById(groupId)
    .populate({
      path: "owner",
      model: User,
      select: "profile profileModel",
      populate: {
        path: "profile",
        model: Host,
        select: "fullName",
      },
    })
    .populate({
      path: "members",
      model: User,
      select: "name email profile",
      populate: {
        path: "profile",
        model: Student,
        select: "universityRollNo classRollNo fullName",
      },
    })
    .lean<PopulatedGroup>();

  if (!group) {
    return null;
  }

  // Authorization Check
  const isOwner = group.owner._id.toString() === userId.toString();
  const isMember = group.members.some(
    (member) => member._id.toString() === userId.toString()
  );

  if (!isOwner && !isMember) {
    return null;
  }

  // Sort by classRollNo if available, otherwise universityRollNo
  group.members.sort((a, b) => {
    const rollA = a.profile?.classRollNo ?? a.profile?.universityRollNo ?? "";
    const rollB = b.profile?.classRollNo ?? b.profile?.universityRollNo ?? "";
    return rollA.localeCompare(rollB, undefined, { numeric: true });
  });
  return group;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return notFound();
  }

  const groupData = await getGroupData(groupId, session.user.id);

  if (!groupData) {
    return notFound();
  }

  const isOwner = groupData.owner._id.toString() === session.user.id;

  const serializedGroup = JSON.parse(JSON.stringify(groupData));

  return (
    <div className="container mx-auto p-4 md:p-8">
      {isOwner ? (
        <HostGroupView group={serializedGroup} />
      ) : (
        <ParticipantGroupView group={serializedGroup} />
      )}
    </div>
  );
}
