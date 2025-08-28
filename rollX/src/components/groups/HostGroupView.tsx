import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Hash, Users } from "lucide-react";
import { MembersTable } from "./MembersTable";
import { CopyButton } from "./CopyButton";
import { GroupHeaderActions } from "./GroupHeaderActions";

// Define a type for the serialized group data
type SerializedGroup = {
  _id: string;
  groupName: string;
  description?: string;
  joinCode: string;
  capacity: number;
  members: {
    _id: string;
    name: string;
    email: string;
    profile?: {
      universityRollNo?: string;
      classRollNo?: string;
      fullName?: string;
    };
  }[];
};

export function HostGroupView({ group }: { group: SerializedGroup }) {
  // We need to destructure the group to pass a smaller object to GroupHeaderActions
  const { ...groupInfo } = group;
  return (
    <div className="space-y-8">
      <GroupHeaderActions group={groupInfo} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Join Code</CardTitle>
            <CardDescription>
              Share this code with your participants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center w-full justify-between text-2xl font-mono bg-muted p-4 rounded-md">
              <span className="flex items-center gap-2">
                <Hash className="h-6 w-6" />
                {group.joinCode}
              </span>
              <CopyButton textToCopy={group.joinCode} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Roster</CardTitle>
            <CardDescription>
              Total members who have joined the group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-muted-foreground" />
              {group.members.length} / {group.capacity}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table Section */}
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-4">Members</h3>
        <MembersTable members={group.members} groupId={group._id} />
      </div>
    </div>
  );
}
