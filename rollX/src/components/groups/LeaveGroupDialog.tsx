"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LeaveGroupDialogProps = {
  group: { _id: string; groupName: string };
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export function LeaveGroupDialog({
  group,
  isOpen,
  setIsOpen,
}: LeaveGroupDialogProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleConfirmLeave = async () => {
    setIsLeaving(true);
    try {
      const response = await fetch(`/api/groups/${group._id}/members/leave`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to leave group.");
      }

      toast.success(`Successfully left "${group.groupName}".`);
      setIsOpen(false);
      router.refresh(); // Refresh the dashboard to remove the card
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      toast.error(errorMessage);
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to leave the group 
            <span className="font-bold text-foreground">
              &quot;{group.groupName}&quot;
            </span>
            . You will need a new join code from the host to rejoin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmLeave}
            disabled={isLeaving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLeaving ? "Leaving..." : "Yes, leave group"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
