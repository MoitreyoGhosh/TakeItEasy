import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationBell } from "@/components/ui/NotificationBell";
import UserNav from "./UserNav";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-8">
      <div className="container flex h-14 max-w-full items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold sm:inline-block">takeiteasy</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <NotificationBell />
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
