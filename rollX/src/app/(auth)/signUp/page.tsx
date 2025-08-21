"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import StudentSignUpForm from "@/components/auth/forms/StudentSignUpForm";
import HostSignUpForm from "@/components/auth/forms/HostSignUpForm";
import GoogleSignInButton from "@/components/auth/buttons/GoogleSignInButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, User, School } from "lucide-react";

type Role = "Student" | "Host";

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleRoleSelect = (role: Role) => {
    sessionStorage.setItem("preselectedRole", role);
    setSelectedRole(role);
  };

  const handleGoBack = () => {
    sessionStorage.removeItem("preselectedRole");
    setSelectedRole(null);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">
      {/* Background with a subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted -z-10" />

      {/* THEME-AWARE Blurred accent blobs */}
      <div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-50 
                     bg-primary/30 dark:bg-primary/50 blur-3xl -z-10"
      />
      <div
        className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full opacity-50
                     bg-secondary/30 dark:bg-secondary/50 blur-3xl -z-10"
      />

      {/* Main authentication card */}
      <Card className="relative w-full max-w-md shadow-xl border-border/20">
        {/* Back to Home Button */}
        {!selectedRole && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="absolute top-4 left-4 text-muted-foreground"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
        )}

        {/* STATE 1: Initial Role Selection - Restored to your preferred layout */}
        {!selectedRole && (
          <>
            <CardHeader className="text-center pt-16">
              <CardTitle className="text-2xl">Join takeiteasy</CardTitle>
              <CardDescription>
                How will you be using our platform?
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col gap-2"
                onClick={() => handleRoleSelect("Student")}
              >
                <User className="h-8 w-8 text-primary" />
                <span className="font-semibold">I&apos;m a Student</span>
                <span className="text-xs text-muted-foreground">
                  To mark my attendance.
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col gap-2"
                onClick={() => handleRoleSelect("Host")}
              >
                <School className="h-8 w-8 text-primary" />
                <span className="font-semibold">I&apos;m a Host</span>
                <span className="text-xs text-muted-foreground">
                  To create sessions.
                </span>
              </Button>
            </CardContent>
          </>
        )}

        {/* STATE 2: Role-Specific Registration Form */}
        {selectedRole && (
          <>
            <CardHeader className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="absolute top-0 left-2 text-muted-foreground" 
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <CardTitle className="text-2xl text-center pt-8">
                Create a {selectedRole} Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRole === "Student" && <StudentSignUpForm />}
              {selectedRole === "Host" && <HostSignUpForm />}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <GoogleSignInButton />
            </CardContent>
          </>
        )}

        <CardFooter>
          <p className="w-full text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/signIn" className="underline hover:text-primary">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}