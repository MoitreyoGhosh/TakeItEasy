"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useDebounce } from "use-debounce";

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Debounce the email input to avoid excessive API calls
  const [debouncedEmail] = useDebounce(email, 500);

  // This effect will run when the user stops typing their email
  useEffect(() => {
    async function checkAccountStatus() {
      if (debouncedEmail) {
        try {
          const response = await fetch("/api/auth/account-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: debouncedEmail }),
          });
          const data = await response.json();
          // If the account is a Google account AND has no password, show the "Create Password" button
          if (data.provider === "google" && !data.hasPassword) {
            setIsGoogleAccount(true);
            setError(null);
          } else {
            setIsGoogleAccount(false);
          }
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          }
          // If the check fails, default to the standard sign-in
          setIsGoogleAccount(false);
        }
      }
      if (!debouncedEmail) {
        setIsGoogleAccount(false); // Reset if the email is cleared
        return;
      }
    }
    checkAccountStatus();
  }, [debouncedEmail]); // Only re-run when the debounced email changes

  // Handle the creation of a password for Google accounts
  const handleCreatePassword = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/generate-create-password-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(data.message);
      setIsGoogleAccount(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (result?.error) {
        if (result.error === "GOOGLE_ACCOUNT_NO_PASSWORD") {
          setError(
            "This account uses Google. Please use the button below or create a password."
          );
          setIsGoogleAccount(true);
        } else {
          setError("Invalid email or password.");
        }
        return;
      }
      if (result?.ok) {
        const session = await getSession();
        if (session?.user?.profileComplete === false) {
          router.push("/dashboard/profile");
        } else if (session?.user?.role === "Host") {
          router.push("/host/dashboard");
        } else {
          router.push("/student/dashboard");
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
      {message && (
        <p className="text-sm text-green-500 text-center">{message}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          placeholder="name@example.com"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          {/* Only show "Forgot Password?" if it's NOT a Google account without a password */}
          {!isGoogleAccount && (
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot?
            </Link>
          )}
        </div>
        <div className="relative">
          <Input
            id="password"
            placeholder="********"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {isGoogleAccount ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleCreatePassword}
          disabled={isLoading}
        >
          {isLoading ? "Sending Link..." : "Create a Password"}
        </Button>
      ) : (
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>
      )}
    </form>
  );
}
