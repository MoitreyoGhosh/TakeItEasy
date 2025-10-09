"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={true} refetchInterval={10 * 60}> {/*10 mins*/}
      {children}
    </SessionProvider>
  );
}
