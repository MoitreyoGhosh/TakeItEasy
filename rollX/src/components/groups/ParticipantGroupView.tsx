import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Hourglass, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

type SerializedGroup = {
  groupName: string;
  owner: {
    profile?: {
      fullName: string;
    };
  };
  members: unknown[];
  capacity: number;
};

export function ParticipantGroupView({ group }: { group: SerializedGroup }) {
  return (
    <div>
      <Link href="/student/dashboard" className="mb-8 inline-block">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>

      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">{group.groupName}</h2>
        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            Hosted by: <strong>{group.owner.profile?.fullName}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {group.members.length} / {group.capacity} members
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
    </div>
  );
}

// Optional: add a slow spin animation to globals.css for the hourglass
// @layer utilities {
//   .animate-spin-slow {
//     animation: spin 3s linear infinite;
//   }
// }
