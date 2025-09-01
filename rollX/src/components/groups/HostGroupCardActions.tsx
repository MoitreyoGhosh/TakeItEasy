"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { EditGroupDialog } from "./EditGroupDialog";
import { DeleteGroupDialog } from "./DeleteGroupDialog";
import { ISchedule } from "@/lib/models/Group.model";

// Define the type for the group data this component needs
type GroupForCardActions = {
  _id: string;
  groupName: string;
  description?: string;
  capacity: number;
  groupType: "Class" | "Event";
  schedules?: ISchedule[];
  eventTime?: { start?: Date | string; end?: Date | string };
};

type HostGroupCardActionsProps = {
  group: GroupForCardActions;
};

export function HostGroupCardActions({ group }: HostGroupCardActionsProps) {
  // State for the dialogs lives here
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
            onClick={handleActionClick} // Prevent navigation when opening menu
          >
            <span className="sr-only">Open group menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onClick={handleActionClick} // Prevent navigation when clicking inside menu
        >
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive-foreground focus:bg-destructive hover:text-white"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4 hover:text-white" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* The dialogs are rendered but invisible until their state is true */}
      <EditGroupDialog
        group={group}
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
      />
      <DeleteGroupDialog
        group={group}
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
      />
    </>
  );
}
