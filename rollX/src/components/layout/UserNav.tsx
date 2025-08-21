import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserNavMenu from "./UserNavMenu";

export default async function UserNav() {
  // Force dynamic rendering to prevent caching issues
  cookies();

  const session = await getServerSession(authOptions);

  // If the user is logged in, render the interactive Client Component and pass the session data as a prop.
  if (session) {
    return <UserNavMenu session={session} />;
  }

  // If the user is a guest, render the simple, non-interactive links.
  return (
    <nav className="flex items-center gap-2">
      <Button asChild variant="ghost">
        <Link href="/signIn">Sign In</Link>
      </Button>
      <Button asChild>
        <Link href="/signUp">Sign Up</Link>
      </Button>
    </nav>
  );
}
