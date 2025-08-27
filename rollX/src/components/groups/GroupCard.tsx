import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Hash } from "lucide-react";
import { CopyButton } from "./CopyButton";

type GroupCardProps = {
  group: {
    _id: string;
    groupName: string;
    joinCode: string;
    members: string[];
    capacity: number;
  };
  userRole: "Host" | "Student";
};

export function GroupCard({ group, userRole }: GroupCardProps) {
  return (
    <Link
      href={`/group/${group._id}`}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="flex flex-col justify-between h-full transition-all duration-300 group hover:shadow-lg hover:border-primary/50">
        <CardHeader>
          <CardTitle className="truncate group-hover:text-primary transition-colors">
            {group.groupName}
          </CardTitle>
          <CardDescription>
            {userRole === "Host"
              ? "You are the host of this group."
              : "You are a member."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {group.members.length} / {group.capacity} members
            </span>
          </div>
        </CardContent>
        <CardFooter>
          {userRole === "Host" ? (
            <div className="flex items-center w-full justify-between text-sm font-mono bg-muted/50 p-2 rounded-md">
              <span className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                {group.joinCode}
              </span>
              <CopyButton textToCopy={group.joinCode} />
            </div>
          ) : (
            <Badge variant="secondary">Enrolled</Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
