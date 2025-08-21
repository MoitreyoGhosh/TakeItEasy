import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2
        className="h-12 w-12 animate-spin text-primary"
        role="status"
        aria-label="loading"
      />
    </div>
  );
}
