"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// The group prop will not include the large 'members' array for efficiency
type GroupForEdit = {
  _id: string;
  groupName: string;
  description?: string;
  capacity: number;
};

type EditGroupDialogProps = {
  group: GroupForEdit;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export function EditGroupDialog({
  group,
  isOpen,
  setIsOpen,
}: EditGroupDialogProps) {
  const router = useRouter();
  const [groupName, setGroupName] = useState(group.groupName);
  const [description, setDescription] = useState(group.description || "");
  const [capacity, setCapacity] = useState(group.capacity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Effect to sync state if the underlying group prop changes
  useEffect(() => {
    setGroupName(group.groupName);
    setDescription(group.description || "");
    setCapacity(group.capacity);
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!groupName.trim()) {
      setError("Group name is required.");
      setIsSubmitting(false);
      return;
    }
    if (capacity < 1) {
      setError("Capacity must be at least 1.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/groups/${group._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName, description, capacity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      toast.success(`Group "${data.group.groupName}" has been updated.`);
      setIsOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update group.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update the details for your group. Changes will be visible to all
              members.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName-edit">Group Name</Label>
              <Input
                id="groupName-edit"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description-edit">Description</Label>
              <Textarea
                id="description-edit"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity-edit">Capacity</Label>
              <Input
                id="capacity-edit"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                min="1"
                disabled={isSubmitting}
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-500 text-center mb-4">{error}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
