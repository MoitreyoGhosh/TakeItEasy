import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap } from "lucide-react";

type LiveSessionHeaderProps = {
  isExpired: boolean;
  groupName: string;
  groupId: string;
  startTime: Date;
};

export const LiveSessionHeader = ({
  isExpired,
  groupName,
  groupId,
  startTime,
}: LiveSessionHeaderProps) => (
  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
    <Link href={`/group/${groupId}`}>
      <Button size="sm" variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Group Details
      </Button>
    </Link>
    <div className="text-center">
      <Badge
        variant="outline"
        className={`px-3 py-1 text-sm mb-2 ${
          isExpired
            ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30"
            : "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full animate-pulse mr-2 ${
            isExpired ? "bg-red-400" : "bg-green-500"
          }`}
        ></div>
        {isExpired ? "SESSION ENDED" : "LIVE"}
      </Badge>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
        {isExpired ? "Session Report" : "Session is Live!"}
      </h1>
      <p className="text-sm text-slate-900 font-medium mt-1 flex items-center justify-center gap-1">
        <GraduationCap className="h-4 w-4" /> Group: {groupName}
        <span className="mx-0.5">|</span>
        Started at{" "}
        {startTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
    <div className="hidden sm:block opacity-0">
      <Button variant="outline" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </div>
  </div>
);
