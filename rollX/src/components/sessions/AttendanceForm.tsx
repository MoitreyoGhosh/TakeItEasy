"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Html5QrcodeScanner } from "html5-qrcode";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoaderCircle, KeyRound, QrCode, X } from "lucide-react";

type AttendanceFormProps = {
  sessionId: string;
};

// function to parse and validate QR code payloads in the format: ROLLX|sessionId|shortCode|timestamp
function parseQRPayload(decodedText: string) {
  const parts = decodedText.trim().split("|");

  if (parts.length !== 4) {
    throw new Error("Invalid QR format. Please scan the official code.");
  }

  const [prefix, qrSessionId, shortCode, timestamp] = parts;

  if (prefix !== "ROLLX") {
    throw new Error("Unrecognized QR code type.");
  }

  const parsedTimestamp = Number(timestamp);

  if (isNaN(parsedTimestamp)) {
    throw new Error("Invalid QR timestamp.");
  }

  const now = Date.now();

  if (now - parsedTimestamp > 10 * 60 * 1000) {
    throw new Error("QR code expired. Please scan again.");
  }

  return {
    sessionId: qrSessionId,
    shortCode,
    timestamp: parsedTimestamp,
  };
}

// Utility function to validate short code format (6 uppercase letters/numbers)
function isValidShortCode(code: string) {
  return /^[A-Z0-9]{6}$/.test(code);
}

export function AttendanceForm({ sessionId }: AttendanceFormProps) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);

  // Process code submission (from manual input or QR scan)
  const processSubmission = async (codeToSubmit: string) => {
    if (!isValidShortCode(codeToSubmit)) {
      toast.error("Invalid code format. Must be 6 uppercase letters/numbers.");
      setScanLocked(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/finalize/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shortCode: codeToSubmit,
          }),
        },
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("Unexpected server response.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Submission failed.");
      }

      toast.success("Code verified. Stay on the page until the session ends.");

      router.replace(`/attend/${sessionId}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unexpected error occurred.";

      toast.error(message);

      setCode("");
      setScanLocked(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await processSubmission(code.toUpperCase());
  };

  useEffect(() => {
    if (!isScanning) return;

    let scanner: Html5QrcodeScanner | null = null;
    let mounted = true;

    const initScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");

        if (!mounted) return;

        scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
            videoConstraints: {
              facingMode: "environment",
            },
          },
          false,
        );

        const onScanSuccess = async (decodedText: string) => {
          if (scanLocked) return;

          setScanLocked(true);

          try {
            const parsed = parseQRPayload(decodedText);

            if (parsed.sessionId !== sessionId) {
              toast.error("This QR code is for a different session.");
              setScanLocked(false);
              return;
            }

            await scanner?.clear();

            setIsScanning(false);

            setCode(parsed.shortCode);

            toast.info("QR detected. Verifying...");

            await processSubmission(parsed.shortCode);
          } catch (err: unknown) {
            toast.error(
              err instanceof Error ? err.message : "Invalid QR code.",
            );

            setScanLocked(false);
          }
        };

        const onScanFailure = () => {
          // ignore continuous scan failures
        };

        scanner.render(onScanSuccess, onScanFailure);
      } catch (err) {
        console.error("Scanner initialization failed:", err);

        if (mounted) {
          toast.error("Camera access failed. Please check permissions.");
          setIsScanning(false);
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;

      if (scanner) {
        try {
          scanner.clear();
        } catch (err) {
          console.warn("Scanner cleanup warning:", err);
        }
      }
    };
  }, [isScanning, sessionId]);

  return (
    <Card className="w-full max-w-md mx-auto animate-fade-in shadow-lg border-primary/20">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 text-primary h-14 w-14 flex items-center justify-center rounded-full mb-4">
          <KeyRound className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl">Enter Attendance Code</CardTitle>
        <CardDescription>
          Scan the QR code or enter the 6-character code displayed on the host's
          screen.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isScanning ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div
              id="qr-reader"
              className="w-full overflow-hidden rounded-xl border-2 border-primary/50 bg-black/5"
            ></div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsScanning(false)}
              disabled={scanLocked}
            >
              <X className="mr-2 h-4 w-4" /> Cancel Scan
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value.toUpperCase())}
                aria-label="Attendance Code Input"
                disabled={isLoading}
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot
                    index={0}
                    className="text-lg h-12 w-10 sm:h-14 sm:w-12"
                  />
                  <InputOTPSlot
                    index={1}
                    className="text-lg h-12 w-10 sm:h-14 sm:w-12"
                  />
                  <InputOTPSlot
                    index={2}
                    className="text-lg h-12 w-10 sm:h-14 sm:w-12"
                  />
                  <InputOTPSlot
                    index={3}
                    className="text-lg h-12 w-10 sm:h-14 sm:w-12"
                  />
                  <InputOTPSlot
                    index={4}
                    className="text-lg h-12 w-10 sm:h-14 sm:w-12"
                  />
                  <InputOTPSlot
                    index={5}
                    className="text-lg h-12 w-10 sm:h-14 sm:w-12"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isLoading || code.length < 6}
              >
                {isLoading && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isLoading ? "Verifying Code..." : "Submit Attendance"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full bg-secondary/50 hover:bg-secondary"
                onClick={() => setIsScanning(true)}
                disabled={isLoading}
              >
                <QrCode className="mr-2 h-5 w-5" /> Scan QR Code
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
