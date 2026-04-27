"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  CalendarClock,
  FlaskConical,
  Hash,
  Users,
} from "lucide-react";
import { MembersTable } from "./MembersTable";
import { CopyButton } from "./CopyButton";
import { GroupHeaderActions } from "./GroupHeaderActions";
import { daysOfWeek } from "@/lib/utils/constants";
import { Badge } from "@/components/ui/badge";
import { formatFullSchedule, formatFullEventTime } from "@/lib/utils/time";
import { useRouter } from "next/navigation";
import { ManualAttendancePanel } from "@/components/sessions/ManualAttendancePanel";

type ActiveSession = {
  id: string;
  shortCode: string;
  expiresAt: string;
};

type ManualRequest = {
  studentId: string;
  sessionId: string;
  reason?: string;
};

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
  groupType: "Class" | "Lab" | "Event";
  schedules?: { dayOfWeek: number; startTime: string; endTime: string }[];
  eventTime?: { start?: Date | string; end?: Date | string };
};

export function HostGroupView({ group }: { group: SerializedGroup }) {
  const router = useRouter();

  const handleStartSession = (session: ActiveSession) => {
    router.push(`/group/${group._id}/${session.id}`);
  };

  return (
    <div className="space-y-8">
      <GroupHeaderActions group={group} onSessionStart={handleStartSession} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {group.groupType === "Class" ? (
                <BookOpen className="h-5 w-5" />
              ) : group.groupType === "Lab" ? (
                <FlaskConical className="h-5 w-5" />
              ) : (
                <CalendarClock className="h-5 w-5" />
              )}
              {group.groupType === "Class"
                ? "Weekly Class Schedule"
                : group.groupType === "Lab"
                  ? "Weekly Lab Schedule"
                  : "Event Time"}
            </CardTitle>

            <CardDescription>
              {group.groupType === "Class"
                ? "Recurring class times."
                : group.groupType === "Lab"
                  ? "Recurring lab times."
                  : "The date and time for this event."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {group.groupType === "Class" || group.groupType === "Lab" ? (
              <div className="flex flex-wrap gap-2">
                {group.schedules && group.schedules.length > 0 ? (
                  group.schedules.map((s, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-sm font-medium"
                    >
                      {formatFullSchedule(s, daysOfWeek)}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No schedule set.</p>
                )}
              </div>
            ) : (
              <div className="font-medium text-foreground">
                {formatFullEventTime(group.eventTime)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Join Code</CardTitle>
            <CardDescription>
              Share this code with participants.
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
            <CardDescription>Total members enrolled.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-muted-foreground" />
              {group.members.length} / {group.capacity}
            </div>
          </CardContent>
        </Card>
      </div>

      <ManualAttendancePanel groupId={group._id} members={group.members} />

      {/* Members Table Section */}
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-4">Members</h3>
        <MembersTable members={group.members} groupId={group._id} />
      </div>
    </div>
  );
}
