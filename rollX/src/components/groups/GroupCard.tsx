import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Hash,
  UserCircle,
  Clock,
  Calendar,
  CheckCircle2,
  BookOpen,
  Radio,
  CalendarClock,
  FlaskConical,
} from "lucide-react";
import { CopyButton } from "./CopyButton";
import { HostGroupCardActions } from "./HostGroupCardActions";
import { StudentGroupCardActions } from "./StudentGroupCardActions";
import { daysOfWeekValues } from "@/lib/utils/constants";
import {
  formatEventDisplayTime,
  formatScheduleTime,
  getScheduleStatus,
} from "@/lib/utils/time";

type GroupCardProps = {
  group: {
    _id: string;
    groupName: string;
    description?: string;
    joinCode: string;
    members: string[];
    capacity: number;
    owner?: { profile?: { fullName: string } };
    groupType: "Class" | "Lab" | "Event";
    schedules?: { dayOfWeek: number; startTime: string; endTime: string }[];
    eventTime?: { start?: Date | string; end?: Date | string };
  };
  userRole: "Host" | "Student";
};

export function GroupCard({ group, userRole }: GroupCardProps) {
  const groupInfo = group;
  const isFull = group.members.length >= group.capacity;
  const fullDayNames = daysOfWeekValues.map((day) => day.label);
  const scheduleStatus = getScheduleStatus(group.schedules);

  const renderSchedule = () => {
    const mainTimeStyle = "font-semibold text-foreground truncate";

    switch (scheduleStatus.status) {
      case "Live":
        return (
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-2 font-semibold text-red-500 animate-pulse">
              <Radio className="h-4 w-4" />
              Live now
            </span>
          </div>
        );
      case "Upcoming":
        return (
          <div className="flex flex-col items-end -space-y-1">
            <span className={mainTimeStyle}>
              {formatScheduleTime(scheduleStatus.schedule!, fullDayNames)}
            </span>
            {scheduleStatus.remainingSchedules > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                (+{scheduleStatus.remainingSchedules} more)
              </span>
            )}
          </div>
        );
      case "None":
      default:
        return <span className={mainTimeStyle}>Not set</span>;
    }
  };

  return (
    <div className="relative h-full group">
      {/* ellipsis */}
      <div className="pointer-events-none absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="pointer-events-auto">
          {userRole === "Host" ? (
            <HostGroupCardActions group={groupInfo} />
          ) : (
            <StudentGroupCardActions group={groupInfo} />
          )}
        </div>
      </div>

      <Link
        href={`/group/${group._id}`}
        className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50">
          {/* --- HEADER SECTION--- */}
          <CardHeader>
            <CardTitle className="truncate pr-10 group-hover:text-primary transition-colors">
              {group.groupName}
            </CardTitle>

            {/* Description and Badge */}
            <div className="flex justify-between gap-4 pt-1 items-center">
              <CardDescription className="line-clamp-2">
                {group.description || "No description."}
              </CardDescription>
              <span
                className={`flex items-center gap-1 flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm ${
                  group.groupType === "Class"
                    ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-800 dark:to-blue-900 dark:text-blue-100"
                    : group.groupType === "Lab"
                    ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-800 dark:to-green-900 dark:text-green-100"
                    : "bg-gradient-to-r from-purple-100 to-pink-200 text-purple-800 dark:from-purple-800 dark:to-pink-900 dark:text-purple-100"
                }`}
              >
                {group.groupType === "Class" ? (
                  <BookOpen className="h-3.5 w-3.5" />
                ) : group.groupType === "Lab" ? (
                  <FlaskConical className="h-3.5 w-3.5" />
                ) : (
                  <CalendarClock className="h-3.5 w-3.5" />
                )}

                {group.groupType}
              </span>
            </div>
          </CardHeader>

          {/* --- CONTENT SECTION --- */}
          <CardContent className="flex-grow pt-2 border-t">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  {group.groupType === "Class" ? (
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  ) : group.groupType === "Lab" ? (
                    <FlaskConical className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  )}
                  {group.groupType === "Class" || group.groupType == "Lab" ? "Schedule" : "Date & Time"}
                </span>

                {group.groupType === "Class" || group.groupType == "Lab"? (
                  renderSchedule()
                ) : (
                  <span className="font-semibold text-foreground truncate">
                    {formatEventDisplayTime(group.eventTime)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Host
                </span>
                <span className="font-semibold text-foreground truncate">
                  {userRole === "Host"
                    ? "You"
                    : group.owner?.profile?.fullName || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Roster
                </span>
                <span
                  className={`font-semibold ${
                    isFull ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {group.members.length} / {group.capacity}
                </span>
              </div>
            </div>
          </CardContent>

          {/* --- FOOTER SECTION --- */}
          <CardFooter className="border-t">
            {userRole === "Host" ? (
              <div className="flex flex-col w-full gap-1">
                <div className="flex items-center justify-between text-md text-muted-foreground px-1">
                  <span>Join Code</span>
                </div>
                <div className="flex items-center w-full justify-between text-sm font-mono bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-2 text-foreground">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    {group.joinCode}
                  </span>
                  <CopyButton textToCopy={group.joinCode} />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Enrolled</span>
              </div>
            )}
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
}
