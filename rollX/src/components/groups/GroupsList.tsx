import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import Group, { IGroupLean } from "@/lib/models/Group.model";
import mongoose from "mongoose";
import { GroupCard } from "./GroupCard";
import { connectToDatabase } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import { Inbox } from "lucide-react";

export async function GroupsList() {
  noStore();
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <p>You must be logged in to view your groups.</p>;
  }

  await connectToDatabase();
  const userRole = session.user.role as "Host" | "Student";

  try {
    let groups: IGroupLean[];

    if (userRole === "Host") {
      groups = await Group.find({ owner: session.user.id })
        .sort({ createdAt: -1 })
        .lean<IGroupLean[]>();
    } else {
      groups = await Group.find({ members: session.user.id })
        .sort({ createdAt: -1 })
        .lean<IGroupLean[]>();
    }

    if (groups.length === 0) {
      return (
        <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center mt-8 flex flex-col items-center justify-center min-h-[200px]">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-xl font-semibold text-foreground">
            No Groups Found
          </h3>
          {userRole === "Host" ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Click &quot;Create New Group&quot; to get started.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Join a group using a code from your host.
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
        {groups.map((group) => (
          <GroupCard
            key={group._id.toString()}
            group={JSON.parse(JSON.stringify(group))}
            userRole={userRole}
          />
        ))}
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch groups:", error);
    return (
      <p className="text-red-500">
        Could not load groups. Please try again later.
      </p>
    );
  }
}
