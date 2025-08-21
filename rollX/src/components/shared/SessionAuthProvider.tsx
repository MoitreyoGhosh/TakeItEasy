"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";
import LoadingSpinner from "../ui/LoadingSpinner";


export default function SessionAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Use the 'required: true' option for robust session checking.
  const { status } = useSession({
    required: true,
    // This function will be called if the user is determined to be unauthenticated.
    onUnauthenticated() {
      // The middleware should handle this, but this is a strong client-side safeguard.
      router.replace("/signIn");
    },
  });

  // While the session is being confirmed, show the loading spinner.
  // 'useSession' with 'required: true' will not proceed until the status is 'authenticated'.
  if (status === "loading") {
    return <LoadingSpinner />;
  }

  // Once the session is confirmed as 'authenticated', render the actual page content.
  return <>{children}</>;
}
 