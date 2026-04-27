"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

type CopyFn = (text: string) => Promise<boolean>;

export function useCopyToClipboard(): [boolean, CopyFn] {
  const [isCopied, setIsCopied] = useState(false);

  const copy: CopyFn = useCallback(
    async (text) => {
      if (!navigator?.clipboard) {
        toast.error("Clipboard API not available.");
        return false;
      }

      // Prevents spamming the button
      if (isCopied) {
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        toast.success("Copied to clipboard!");

        setTimeout(() => {
          setIsCopied(false);
        }, 2000); // Reset after 2 seconds

        return true;
      } catch (error) {
        console.warn("Copy failed", error);
        toast.error("Failed to copy text.");
        setIsCopied(false);
        return false;
      }
    },
    [isCopied]
  ); // Dependency array ensures the function is stable

  return [isCopied, copy];
}
