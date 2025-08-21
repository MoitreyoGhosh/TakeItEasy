"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StudentProfileCompletionForm() {
  const router = useRouter();
  const { update } = useSession();
  const [universityName, setUniversityName] = useState("");
  const [universityRollNo, setUniversityRollNo] = useState("");
  const [classRollNo, setClassRollNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "Student",
          universityName,
          universityRollNo,
          classRollNo,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }
      const newSession = await update();
      if (newSession?.user?.profileComplete) {
        router.replace("/student/dashboard");
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      {error && <p className="text-sm text-center text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="universityName">University Name</Label>
        <Input
          id="universityName"
          value={universityName}
          onChange={(e) => setUniversityName(e.target.value)}
          required
          disabled={isLoading}
          placeholder="e.g., National Institute of Technology"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="universityRollNo">University Roll No.</Label>
        <Input
          id="universityRollNo"
          value={universityRollNo}
          onChange={(e) => setUniversityRollNo(e.target.value)}
          required
          disabled={isLoading}
          placeholder="e.g., NIT/2021/1234"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="classRollNo">Class Roll No. (Optional)</Label>
        <Input
          id="classRollNo"
          value={classRollNo}
          onChange={(e) => setClassRollNo(e.target.value)}
          disabled={isLoading}
          placeholder="e.g., 45"
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        className="w-full"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Save and Continue"}
      </Button>
    </form>
  );
}
