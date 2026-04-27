"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Download, Badge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SerializableMember } from "@/types/types"; // Assuming you create this types file

type LiveRosterProps = {
  isExpired: boolean;
  presentMembers: SerializableMember[];
  onDownload: () => void;
};

export const LiveRoster = ({
  isExpired,
  presentMembers,
  onDownload,
}: LiveRosterProps) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isExpired ? "Final Roster" : "Live Roster"}
          </CardTitle>
          <CardDescription>
            {isExpired
              ? `Attendance results for this session.`
              : `Attendees who have joined your session will appear here.`}
          </CardDescription>
        </div>
        {isExpired && presentMembers.length > 0 && (
          <Button variant="outline" size="icon" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {presentMembers.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center bg-muted/50">
            <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              {isExpired
                ? "No attendees were present."
                : "Waiting for participants to join..."}
            </p>
            <p className="text-sm text-muted-foreground/80 mt-1">
              {isExpired
                ? "The list below is the final record."
                : "Confirmed attendees will appear here in real-time."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Here we will map over the real list of members */}
            {presentMembers.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="font-semibold">
                    {member.profile?.fullName || member.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.profile?.universityRollNo || "No Roll No."}
                  </p>
                </div>
                <Badge
                  className="text-green-600 border-green-500"
                >
                  Present
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
