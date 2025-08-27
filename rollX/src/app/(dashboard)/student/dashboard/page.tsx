import { GroupsList } from "@/components/groups/GroupsList";
import { JoinGroupForm } from "@/components/groups/JoinGroupForm";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function StudentDashboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Student Dashboard
          </h2>
          <p className="text-muted-foreground">
            Join groups and get ready for your next session.
          </p>
        </div>
      </div>

      <div className="mb-12 max-w-md">
        <JoinGroupForm />
      </div>

      <div>
        <h3 className="text-2xl font-bold tracking-tight">My Groups</h3>
        <Suspense fallback={<GroupsListSkeleton />}>
          <GroupsList />
        </Suspense>
      </div>
    </div>
  );
}
