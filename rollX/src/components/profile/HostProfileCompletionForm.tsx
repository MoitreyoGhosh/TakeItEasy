"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HostProfileCompletionForm() {
  const router = useRouter();
  const { update } = useSession();
  const [organizationName, setOrganizationName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
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
          role: "Host",
          organizationName,
          organizationId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }
      const newSession = await update();
      if (newSession?.user?.profileComplete) {
        router.replace("/host/dashboard");
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
        <Label htmlFor="organizationName">University / Organization Name</Label>
        <Input
          id="organizationName"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          required
          disabled={isLoading}
          placeholder="e.g., NIT Department of Computer Science"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="organizationId">Employee ID (Optional)</Label>
        <Input
          id="organizationId"
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          disabled={isLoading}
          placeholder="e.g., EMP404"
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
