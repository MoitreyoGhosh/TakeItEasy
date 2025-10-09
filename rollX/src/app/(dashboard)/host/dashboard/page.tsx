import { CreateGroupDialog } from "@/components/groups/CreateGroupDialog";
import { GroupsList } from "@/components/groups/GroupsList";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// A simple loading skeleton component for a better user experience
function GroupsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function HostDashboardPage() {
  return (
    <div className="container mx-auto p-2 md:p-4">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Host Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your groups and start attendance sessions.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <CreateGroupDialog />
        </div>
      </div>

      {/* Use Suspense for a great loading UX while the server component fetches data */}
      <Suspense fallback={<GroupsListSkeleton />}>
        <GroupsList />
      </Suspense>
    </div>
  );
}
