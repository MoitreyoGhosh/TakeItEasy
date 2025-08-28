import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Hash, UserCircle, CheckCircle2 } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { HostGroupCardActions } from "./HostGroupCardActions";
import { StudentGroupCardActions } from "./StudentGroupCardActions";

type GroupCardProps = {
  group: {
    _id: string;
    groupName: string;
    description?: string;
    joinCode: string;
    members: string[];
    capacity: number;
    owner?: {
      profile?: {
        fullName: string;
      };
    };
  };
  userRole: "Host" | "Student";
};

export function GroupCard({ group, userRole }: GroupCardProps) {
  // Destructure to pass a smaller object to the actions component
  const { ...groupInfo } = group;
  const isFull = group.members.length >= group.capacity;
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        {userRole === "Host" ? (
          <HostGroupCardActions group={groupInfo} />
        ) : (
          <StudentGroupCardActions group={groupInfo} />
        )}
      </div>

      <Link
        href={`/group/${group._id}`}
        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Card className="flex flex-col justify-between h-full transition-all duration-300 group hover:shadow-lg hover:border-primary/50">
          <CardHeader>
            <CardTitle className="truncate group-hover:text-primary transition-colors pr-8">
              {group.groupName}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {group.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow pt-0 pb-2">
            <div className="border-t border-border/50 pt-2 space-y-2">
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

          <CardFooter>
            {userRole === "Host" ? (
              <div className="flex flex-col w-full gap-1">
                <div className="flex items-center justify-between text-md text-muted-foreground px-1">
                  <span>Join Code</span>
                </div>
                <div className="flex items-center w-full justify-between text-sm font-mono bg-muted/50 p-2 rounded-md">
                  <span className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    {group.joinCode}
                  </span>
                  <CopyButton textToCopy={group.joinCode} />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm font-medium text-green-600 dark:text-green-400">
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
