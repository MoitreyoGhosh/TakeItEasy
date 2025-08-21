"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

export default function GoogleSignInButton() {
  const handleClick = () => {
    // This function call triggers the Google OAuth flow managed by NextAuth
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <Button onClick={handleClick} variant="outline" className="w-full">
      <FcGoogle className="mr-2 h-4 w-4" />
      Continue with Google
    </Button>
  );
}
