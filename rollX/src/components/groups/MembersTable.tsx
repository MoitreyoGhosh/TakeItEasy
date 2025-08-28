"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Trash2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define the shape of a populated member for type safety
type PopulatedMember = {
  _id: string;
  name: string;
  email: string;
  profile?: {
    universityRollNo?: string; // Make these optional too
    classRollNo?: string;
    fullName?: string;
  };
};

type MembersTableProps = {
  members: PopulatedMember[];
  groupId: string;
};

export function MembersTable({ members, groupId }: MembersTableProps) {
  const router = useRouter();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<PopulatedMember | null>(
    null
  );
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveClick = (member: PopulatedMember) => {
    setSelectedMember(member);
    setIsAlertOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!selectedMember) return;
    setIsRemoving(true);

    try {
      const response = await fetch(
        `/api/groups/${groupId}/members/${selectedMember._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to remove member.");
      }

      toast.success(`Removed ${selectedMember.name} from the group.`);
      router.refresh(); // Reload server data to update the list
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred.");
      }
    } finally {
      setIsRemoving(false);
      setIsAlertOpen(false);
      setSelectedMember(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {/* TABLE HEADERS */}
              <TableHead className="w-[150px]">Roll No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>University Roll No.</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length > 0 ? (
              members.map((member) => (
                <TableRow key={member._id}>
                  {/* Column 1: Primary Roll No. */}
                  <TableCell className="font-medium">
                    {member.profile?.classRollNo ??
                      member.profile?.universityRollNo ??
                      "N/A"}
                  </TableCell>

                  {/* Column 2: Full Name */}
                  <TableCell>
                    {member.profile?.fullName ?? member.name ?? "N/A"}
                  </TableCell>

                  {/* Column 3: University Roll No. (Conditional) */}
                  <TableCell>
                    {/* Only show this if a class roll no. was the primary display */}
                    {member.profile?.classRollNo
                      ? member.profile.universityRollNo
                      : "—"}
                  </TableCell>

                  {/* Column 4: Email */}
                  <TableCell>{member.email}</TableCell>

                  {/* Column 5: Actions Dropdown */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleRemoveClick(member)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No members have joined yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Confirmation Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-semibold">{selectedMember?.name}</span> from
              the group. They will need to rejoin using the code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
