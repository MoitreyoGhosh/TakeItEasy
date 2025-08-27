import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Hash, Users, PlayCircle } from "lucide-react";
import { MembersTable } from "./MembersTable";
import { CopyButton } from "./CopyButton";

// Define a type for the serialized group data
type SerializedGroup = {
  _id: string;
  groupName: string;
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
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {group.groupName}
          </h2>
          <p className="text-muted-foreground">
            Manage your group and view your roster.
          </p>
        </div>
        <Button size="lg">
          <PlayCircle className="mr-2 h-5 w-5" />
          Start Attendance Session
        </Button>
      </div>

      {/* Info Cards Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Join Code</CardTitle>
            <CardDescription>
              Share this code with your participants.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center w-full justify-between text-2xl font-mono bg-muted p-4 rounded-md">
            <span className="flex items-center gap-2">
              <Hash className="h-6 w-6" />
              {group.joinCode}
            </span>
            <CopyButton textToCopy={group.joinCode} />
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
