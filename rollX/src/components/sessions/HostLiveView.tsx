"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LiveSessionHeader } from "./LiveSessionHeader";
import { LiveRoster } from "./LiveRoster";
import { AttendancePieChart } from "./AttendancePieChart";
import { HostLiveViewProps, SerializableMember } from "@/types/types";
import {
  Timer,
  Users,
  Copy,
  Scan,
  UserCheck,
  Link as LinkIcon,
  Info,
  StopCircle,
  PlusCircle,
  Check,
  Download,
  FileDown,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { formatTimeLeft } from "@/lib/utils/time";
import { ManualAttendancePanel } from "@/components/sessions/ManualAttendancePanel";

// Utility function to generate CSV content from present and absent members
const generateCSV = (
  present: SerializableMember[],
  absent: SerializableMember[],
): string => {
  const headers = "Status,Full Name,University Roll No,Email\n";
  const presentRows = present
    .map(
      (m) =>
        `Present,"${m.profile?.fullName || m.name}","${
          m.profile?.universityRollNo || "N/A"
        }","${m.email}"`,
    )
    .join("\n");
  const absentRows = absent
    .map(
      (m) =>
        `Absent,"${m.profile?.fullName || m.name}","${
          m.profile?.universityRollNo || "N/A"
        }","${m.email}"`,
    )
    .join("\n");
  return headers + presentRows + "\n" + absentRows;
};

export function HostLiveView({
  session,
  group,
  initialPresentMembers,
  initialAbsentMembers,
  rosterMembers,
}: HostLiveViewProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(0);
  const [presentMembers, setPresentMembers] = useState<SerializableMember[]>(
    initialPresentMembers,
  );
  const [sessionStartTime] = useState(new Date());
  const chartRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket({ groupId: group.id });
  const [isCodeCopied, copyCode] = useCopyToClipboard();
  const [isLinkCopied, copyLink] = useCopyToClipboard();
  const [ending, setEnding] = useState(false);
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const rosterMap = useRef<Map<string, SerializableMember>>(new Map());
  const isExpired = timeLeft <= 0;

  const qrPayload = useMemo(() => {
    const expiry = new Date(session.expiresAt).getTime();

    return `ROLLX|${session.id}|${session.shortCode}|${expiry}`;
  }, [session.id, session.shortCode, session.expiresAt]);

  // Create a map of memberId → member for quick lookups when participants confirm attendance
  useEffect(() => {
    const map = new Map<string, SerializableMember>();

    rosterMembers.forEach((member) => {
      map.set(member._id, member);
    });

    rosterMap.current = map;
  }, [rosterMembers]);

  // Initialize the countdown timer based on session expiry
  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiry = new Date(session.expiresAt).getTime();
      const diff = Math.floor((expiry - Date.now()) / 1000);
      return Math.max(0, diff);
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return calculateTimeLeft();
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session.expiresAt]);

  // Listen for real-time attendance confirmations from participants
  useEffect(() => {
    if (!socket) return;

    const handleParticipantConfirmed = (data: { _id: string }) => {
      const member = rosterMap.current.get(data._id);

      if (!member) return;

      setPresentMembers((prev) => {
        if (prev.some((m) => m._id === member._id)) return prev;

        return [...prev, member].sort((a, b) =>
          (a.profile?.universityRollNo || "").localeCompare(
            b.profile?.universityRollNo || "",
          ),
        );
      });
    };
    // Listen for new participants confirming their presence
    socket.on("participant_confirmed", handleParticipantConfirmed);
    return () => {
      socket.off("participant_confirmed", handleParticipantConfirmed);
    };
  }, [socket]);

  // Listen for session finalization event from the server
  useEffect(() => {
    if (!socket) return;

    const handleSessionFinalized = (data: {
      sessionId: string;
      presentMembers: string[];
    }) => {
      if (data.sessionId !== session.id) return;

      console.log("[Socket] Session finalized received");

      const now = new Date();

      setSessionEndTime(now);
      setTimeLeft(0);
      setEnding(false);

      toast.success("Session ended");

      // Sync final attendance
      setPresentMembers(() => {
        const map = rosterMap.current;

        const updated = data.presentMembers
          .map((id) => map.get(id))
          .filter(Boolean) as SerializableMember[];

        return updated.sort((a, b) =>
          (a.profile?.universityRollNo || "").localeCompare(
            b.profile?.universityRollNo || "",
          ),
        );
      });
    };

    socket.on("session_finalized", handleSessionFinalized);

    return () => {
      socket.off("session_finalized", handleSessionFinalized);
    };
  }, [socket, session.id]);

  // Handle manual session termination by host
  const handleEndSession = () => {
    if (!socket || ending) return;

    setTimeLeft(0);
    setEnding(false); // true for showing "ending..." state if we want to add a delay or animation later
    // false for immediate UI response since backend will finalize right away

    socket.emit("end_session", { sessionId: session.id });
    toast.info("Ending session now...");
  };

  const handleManualApproval = (studentId: string) => {
    const member = rosterMap.current.get(studentId);

    if (!member) return;

    setPresentMembers((prev) => {
      if (prev.some((m) => m._id === studentId)) return prev;
      return [...prev, member];
    });
  };

  const handleStartNewSession = () => router.push(`/group/${group.id}`);

  // Handle report downloads in various formats
  const handleDownload = (format: "png" | "pdf" | "csv") => {
    const date = new Date().toLocaleDateString("en-CA");
    const filename = `attendance-${group.name.replace(/\s+/g, "-")}-${date}`;
    const finalAbsentMembers = initialAbsentMembers.filter(
      (absentM) =>
        !presentMembers.some((presentM) => presentM._id === absentM._id),
    );

    if (format === "png") {
      if (chartRef.current === null)
        return toast.error("Chart element not found.");
      toast.info("Generating PNG image...");
      toPng(chartRef.current, { cacheBust: true, quality: 0.95 })
        .then((dataUrl) => {
          const link = document.createElement("a");
          link.download = `${filename}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          toast.error("Failed to generate image.");
          console.error(err);
        });
    } else if (format === "csv") {
      toast.info("Generating CSV file...");
      const csvContent = generateCSV(presentMembers, finalAbsentMembers);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
    } else if (format === "pdf") {
      toast.info("Generating PDF document...");
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Attendance Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Group: ${group.name}`, 14, 30);
      doc.text(`Date: ${new Date().toLocaleString()}`, 14, 36);

      autoTable(doc, {
        startY: 50,
        head: [["Status", "Full Name", "University Roll No", "Email"]],
        body: [
          ...presentMembers.map((m) => [
            "Present",
            m.profile?.fullName || m.name,
            m.profile?.universityRollNo || "N/A",
            m.email,
          ]),
          ...finalAbsentMembers.map((m) => [
            "Absent",
            m.profile?.fullName || m.name,
            m.profile?.universityRollNo || "N/A",
            m.email,
          ]),
        ],
        theme: "grid",
        headStyles: { fillColor: [22, 163, 74] },
        didParseCell: (data) => {
          const row = data.row.raw as string[];
          if (row[0] === "Absent") {
            data.cell.styles.textColor = [239, 68, 68];
          }
        },
      });
      doc.save(`${filename}.pdf`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-slate-900 dark:to-slate-900/80 p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        <LiveSessionHeader
          isExpired={isExpired}
          groupName={group.name}
          groupId={group.id}
          startTime={sessionStartTime}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
          <div className="lg:col-span-2 space-y-6">
            {isExpired ? (
              <div ref={chartRef} className="h-full">
                <AttendancePieChart
                  data={{
                    present: presentMembers.length,
                    absent: group.totalMembers - presentMembers.length,
                  }}
                />
              </div>
            ) : (
              <Card className="shadow-sm flex flex-col h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="text-center flex-1">
                      <CardTitle className="flex items-center justify-center gap-2 text-xl">
                        <Scan className="h-5 w-5 text-primary" />
                        Scan to Join
                      </CardTitle>
                      <CardDescription>
                        Participants can scan this QR code
                      </CardDescription>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mt-2 -mr-2"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This code is unique to this session.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-6 flex-grow">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-inner w-full max-w-[256px] cursor-pointer hover:scale-105 transition-transform duration-300 ease-in-out">
                        <QRCodeSVG
                          value={qrPayload}
                          level="H"
                          className="w-full h-full p-2"
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="bg-white p-6 rounded-lg shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-md [&>button]:text-slate-900">
                      <QRCodeSVG
                        value={qrPayload}
                        size={1024}
                        level="H"
                        className="w-full h-auto p-6"
                      />
                    </DialogContent>
                  </Dialog>
                  <div className="text-sm font-medium text-muted-foreground">
                    Or enter this code:
                  </div>
                  <div className="flex items-center justify-center gap-2 md:gap-4 p-4 bg-background border rounded-xl w-full max-w-xs">
                    <p className="text-4xl font-bold font-mono tracking-widest text-foreground flex-1 text-center">
                      {session.shortCode}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyCode(session.shortCode)}
                    >
                      {isCodeCopied ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {isExpired ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium">
                      Session Duration
                    </CardTitle>
                    <Timer className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold font-mono mb-1 text-foreground">
                      {formatTimeLeft(
                        ((
                          sessionEndTime ?? new Date(session.expiresAt)
                        ).getTime() -
                          sessionStartTime.getTime()) /
                          1000,
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The session has now ended.
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm animate-fade-in">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Next Steps & Exports
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full" onClick={handleStartNewSession}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Start New Session
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Download Report
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => handleDownload("pdf")}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload("csv")}>
                          <FileDown className="h-4 w-4 mr-2" />
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload("png")}>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Save Chart as Image
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                  <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium">
                        Time Remaining
                      </CardTitle>
                      <Timer className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold font-mono mb-1 text-foreground">
                        {formatTimeLeft(timeLeft)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Session will automatically close when the timer ends.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium">
                        Confirmed Attendees
                      </CardTitle>
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-bold text-foreground">
                          {presentMembers.length}
                        </div>
                        <UserCheck className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        out of {group.totalMembers} members.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <Card className="shadow-sm animate-fade-in">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => copyCode(session.shortCode)}
                    >
                      {isCodeCopied ? (
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      Copy Join Code
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        const sessionLink =
                          typeof window !== "undefined"
                            ? `${window.location.origin}/join/${session.shortCode}`
                            : "";
                        copyLink(sessionLink);
                      }}
                    >
                      {isLinkCopied ? (
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                      ) : (
                        <LinkIcon className="h-4 w-4 mr-2" />
                      )}
                      Share Session Link
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={handleEndSession}
                    >
                      <StopCircle className="h-4 w-4 mr-2" /> End Session Now
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        <ManualAttendancePanel
          groupId={group.id}
          sessionId={session.id}
          members={rosterMembers}
          onManualApprove={handleManualApproval}
        />

        <LiveRoster
          isExpired={isExpired}
          presentMembers={presentMembers}
          onDownload={() => handleDownload("pdf")}
        />
      </div>
    </div>
  );
}
