"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const handleClick = () => {
    // This function clears the session and redirects to the signIn page
    signOut({ callbackUrl: "/signIn" });
  };

  return (
    <Button onClick={handleClick} variant="ghost">
      Sign Out
    </Button>
  );
}
