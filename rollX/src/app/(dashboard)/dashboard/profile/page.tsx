"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentProfileCompletionForm from "@/components/profile/StudentProfileCompletionForm";
import HostProfileCompletionForm from "@/components/profile/HostProfileCompletionForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

type Role = "Student" | "Host";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // This effect correctly pre-selects the role from sessionStorage
  useEffect(() => {
    const preselectedRole = sessionStorage.getItem(
      "preselectedRole"
    ) as Role | null;
    if (preselectedRole === "Student" || preselectedRole === "Host") {
      setSelectedRole(preselectedRole);
      sessionStorage.removeItem("preselectedRole");
    }
  }, []);

  useEffect(() => {
    // This effect will run whenever the session or its status changes.
    if (status === "authenticated" && session?.user?.profileComplete) {
      const dashboardUrl =
        session.user.role === "Host" ? "/host/dashboard" : "/student/dashboard";
      router.replace(dashboardUrl);
    }
  }, [session, status, router]);

  // While the session is loading, show nothing to prevent flashes of content.
  if (status === "loading") {
    return null;
  }

  // If the profile is not yet complete, render the form.
  // The useEffect above will handle the redirect once the profile IS complete.
  return (
    <Card className="w-full max-w-xl">
      {!selectedRole ? (
        <>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome, {session?.user?.name}!
            </CardTitle>
            <CardDescription>
              Just one more step. Please select your role to complete your
              profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => setSelectedRole("Student")}
              className="w-full sm:w-auto"
            >
              Join as a Student
            </Button>
            <Button
              onClick={() => setSelectedRole("Host")}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Join as a Host
            </Button>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader>
            <div className="relative flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0"
                onClick={() => setSelectedRole(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl">
                Complete Your {selectedRole} Profile
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {selectedRole === "Student" && <StudentProfileCompletionForm />}
            {selectedRole === "Host" && <HostProfileCompletionForm />}
          </CardContent>
        </>
      )}
    </Card>
  );
}
