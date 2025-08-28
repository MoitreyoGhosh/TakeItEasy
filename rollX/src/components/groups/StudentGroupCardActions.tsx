"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal,LogOut } from "lucide-react";
import { LeaveGroupDialog } from "./LeaveGroupDialog";

type GroupForCardActions = {
  _id: string;
  groupName: string;
};

type StudentGroupCardActionsProps = {
  group: GroupForCardActions;
};

export function StudentGroupCardActions({
  group,
}: StudentGroupCardActionsProps) {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  // This function prevents the parent <Link> from navigating
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleActionClick}
          >
            <span className="sr-only">Open group menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={handleActionClick}>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive-foreground focus:bg-destructive hover:text-white"
            onClick={() => setIsLeaveDialogOpen(true)}
          >
            <LogOut className="mr-2 h-4 w-4 hover:text-white" />
            <span>Leave Group</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LeaveGroupDialog
        group={group}
        isOpen={isLeaveDialogOpen}
        setIsOpen={setIsLeaveDialogOpen}
      />
    </>
  );
}
