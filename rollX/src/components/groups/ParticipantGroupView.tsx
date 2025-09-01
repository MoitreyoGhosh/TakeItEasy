"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Hourglass,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { LeaveGroupDialog } from "./LeaveGroupDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useState } from "react";
import { daysOfWeekValues } from "@/lib/utils/constants";
import { formatFullSchedule, formatEventDisplayTime } from "@/lib/utils/time";

type SerializedGroup = {
  _id: string;
  groupName: string;
  description?: string;
  owner: {
    profile?: {
      fullName: string;
    };
  };
  members: unknown[];
  capacity: number;
  groupType: "Class" | "Event";
  schedules?: { dayOfWeek: number; startTime: string; endTime: string }[];
  eventTime?: { start?: Date | string; end?: Date | string };
};

export function ParticipantGroupView({ group }: { group: SerializedGroup }) {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  // Create the array of full day names from the constant
  const fullDayNames = daysOfWeekValues.map((day) => day.label);

  return (
    <>
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <Link href="/student/dashboard" className="inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Group Settings dropdown for students */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Group Settings
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
              onClick={() => setIsLeaveDialogOpen(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Leave Group</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="my-8">
        <h2 className="text-3xl font-bold tracking-tight">{group.groupName}</h2>
        {group.description && (
          <p className="mt-4 max-w-2xl text-foreground/80">
            {group.description}
          </p>
        )}
        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            Hosted by:
            <strong>{group.owner.profile?.fullName || "Host"}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {group.members.length} / {group.capacity} members
          </span>

          <span className="flex items-center gap-1.5 font-medium text-foreground">
            {group.groupType === "Class" ? (
              <Clock className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Calendar className="h-4 w-4 text-muted-foreground" />
            )}
            {group.groupType === "Class"
              ? group.schedules && group.schedules.length > 0
                ? group.schedules
                    .map((s) => formatFullSchedule(s, fullDayNames))
                    .join(" | ")
                : "Schedule not set"
              : formatEventDisplayTime(group.eventTime)}
          </span>
        </div>
      </div>

      <Card className="w-full max-w-lg mx-auto text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Hourglass className="h-6 w-6 animate-spin-slow" />
            Session Not Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please wait here. When the host starts an attendance session, this
            page will update automatically.
          </p>
        </CardContent>
      </Card>

      <LeaveGroupDialog
        group={group}
        isOpen={isLeaveDialogOpen}
        setIsOpen={setIsLeaveDialogOpen}
      />
    </>
  );
}

// Optional: add a slow spin animation to globals.css for the hourglass
// @layer utilities {
//   .animate-spin-slow {
//     animation: spin 3s linear infinite;
//   }
// }
