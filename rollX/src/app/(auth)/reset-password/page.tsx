"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ResetPasswordForm from "@/components/auth/forms/ResetPasswordForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * This inner component handles the client-side logic after the page has loaded.
 * It's necessary because useSearchParams can only be used in Client Components.
 */
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // If there's no token, display an error message inside the card.
  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h3 className="font-semibold text-destructive">
          Invalid or Expired Link
        </h3>
        <p className="text-sm text-muted-foreground">
          This password reset link is missing the required token or has already
          expired.
        </p>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request a New Link</Link>
        </Button>
      </div>
    );
  }

  // If the token exists, render the form.
  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set a New Password</CardTitle>
          <CardDescription>
            Create a new secure password for your account.
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
            <ResetPasswordContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
