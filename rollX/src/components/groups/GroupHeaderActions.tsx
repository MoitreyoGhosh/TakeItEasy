"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  MessageSquarePlus,
  Pencil,
  PlayCircle,
  Settings,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { EditGroupDialog } from "./EditGroupDialog";
import { DeleteGroupDialog } from "./DeleteGroupDialog";
import { ISchedule } from "@/lib/models/Group.model";

type GroupForHeader = {
  _id: string;
  groupName: string;
  description?: string;
  capacity: number;
  groupType: "Class" | "Event";
  schedules?: ISchedule[];
  eventTime?: { start?: Date | string; end?: Date | string };
};

type GroupHeaderActionsProps = {
  group: GroupForHeader;
};

// Inline Description Form Component
function InlineDescriptionForm({
  group,
  onCancel,
}: {
  group: GroupForHeader;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [description, setDescription] = useState(group.description || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    //.trim() is used to ensure whitespace changes don't trigger an API call.
    const originalDescription = group.description || "";
    if (description.trim() === originalDescription.trim()) {
      onCancel(); // Simply close the form if nothing changed.
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/groups/${group._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: group.groupName,
          capacity: group.capacity,
          description: description,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save.");

      toast.success("Description updated successfully.");
      router.refresh();
      onCancel();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-2 space-y-2 max-w-2xl">
      <Textarea
        placeholder="Enter a short description for your group..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="resize-none"
        disabled={isSaving}
        autoFocus
      />
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" /> Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function GroupHeaderActions({ group }: GroupHeaderActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <Link href="/host/dashboard" className="inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Group Settings
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Edit Details</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive-foreground focus:bg-destructive hover:text-white"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4 hover:text-white" />
              <span>Delete Group</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b pb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-bold tracking-tight">
            {group.groupName}
          </h2>

          {group.description && !isEditingDescription ? (
            <div className="flex items-start gap-2 mt-2">
              <p className="text-muted-foreground max-w-2xl">
                {group.description}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => setIsEditingDescription(true)}
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ) : isEditingDescription ? (
            <InlineDescriptionForm
              group={group}
              onCancel={() => setIsEditingDescription(false)}
            />
          ) : (
            <Button
              variant="link"
              className="p-0 h-auto mt-2 text-muted-foreground"
              onClick={() => setIsEditingDescription(true)}
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Add a description
            </Button>
          )}
        </div>
        <div className="flex-shrink-0 w-full md:w-auto">
          <Button
            size="lg"
            className="w-full md:w-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Start Attendance Session
          </Button>
        </div>
      </div>

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
