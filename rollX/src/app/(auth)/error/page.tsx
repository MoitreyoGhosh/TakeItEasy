"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ErrorCard = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: { [key: string]: string } = {
    CredentialsSignin:
      "Invalid email or password. Please check your credentials and try again.",
    OAuthAccountNotLinked:
      "This email is already linked with another provider. Please sign in using the method you originally used.",
    Default: "An unexpected authentication error occurred. Please try again.",
  };

  const message =
    error && errorMessages[error]
      ? errorMessages[error]
      : errorMessages.Default;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-destructive">
          Authentication Failed
        </CardTitle>
        <CardDescription className="text-center pt-2">
          {message}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/signIn">Return to Sign In</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ErrorCard />
      </Suspense>
    </div>
  );
}
