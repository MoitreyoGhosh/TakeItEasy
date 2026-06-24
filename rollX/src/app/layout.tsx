import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/shared/Provider";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider } from "@/providers/SocketProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { GlobalNotifications } from "@/components/shared/GlobalNotifications";
import { GlobalSocketListener } from "@/components/shared/GlobalSocketListener";
import { NotificationHydrator } from "@/components/shared/NotificationHydrator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "takeiteasy - Smart Attendance System for Classrooms",
  description:
    "Real-time Attendance System using QR Codes and One-Time Code for Hosts/Teachers and Students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <SocketProvider>
              <NotificationProvider>
                <GlobalSocketListener />
                <NotificationHydrator />
                {children}
                <GlobalNotifications />
                <Toaster richColors position="top-center" />
              </NotificationProvider>
            </SocketProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
