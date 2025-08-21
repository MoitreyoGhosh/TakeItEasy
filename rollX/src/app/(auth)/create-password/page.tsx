"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ResetPasswordForm from "@/components/auth/forms/ResetPasswordForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function CreatePasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h3 className="font-semibold text-destructive">Invalid Link</h3>
        <p className="text-sm text-muted-foreground">
          This link is missing the required token. Please try again.
        </p>
        <Button asChild className="w-full">
          <Link href="/signIn">Return to Sign In</Link>
        </Button>
      </div>
    );
  }

  // Reusing the ResetPasswordForm component
  return <ResetPasswordForm token={token} />;
}

export default function CreatePasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create a New Password</CardTitle>
          <CardDescription>
            This will allow you to sign in with your email and password in
            addition to Google.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="text-center text-muted-foreground">
                Loading...
              </div>
            }
          >
            <CreatePasswordContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
