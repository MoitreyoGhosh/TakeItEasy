import SignInForm from "@/components/auth/forms/SignInForm";
import GoogleSignInButton from "@/components/auth/buttons/GoogleSignInButton";
import Link from "next/link";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
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
      <Card className="relative w-full max-w-sm shadow-xl border-border/20">
        <CardHeader>
          {/* Back to Home Button */}
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

          <div className="text-center pt-8">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to continue to your dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignInForm />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <GoogleSignInButton />
        </CardContent>
        <CardFooter>
          <p className="w-full text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signUp"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
