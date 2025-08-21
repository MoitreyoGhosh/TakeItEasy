import SessionAuthProvider from "@/components/shared/SessionAuthProvider";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionAuthProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-start p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </SessionAuthProvider>
  );
}
