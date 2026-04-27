"use client";

import { LoaderCircle, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type LiveStatusIndicatorProps = {
  isConnected: boolean;
  error: string | null;
};

export const LiveStatusIndicator = ({
  isConnected,
  error,
}: LiveStatusIndicatorProps) => {
  // 1. Error State
  if (error) {
    return (
      <Badge variant="destructive" className="flex items-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>Session Inactive</span>
      </Badge>
    );
  }

  // 2. Connecting State
  if (!isConnected) {
    return (
      <Badge
        variant="outline"
        className="flex items-center gap-2 text-muted-foreground"
      >
        <LoaderCircle className="h-4 w-4 animate-spin" />
        <span>Connecting...</span>
      </Badge>
    );
  }

  // 3. Connected State (Happy Path)
  return (
    <Badge
      variant="outline"
      className="flex items-center gap-2 border-green-500 text-green-600"
    >
      <Wifi className="h-4 w-4" />
      <span>Ready for Session</span>
    </Badge>
  );
};
