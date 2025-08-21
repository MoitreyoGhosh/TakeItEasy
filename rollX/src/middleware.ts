import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith("/signIn") || pathname.startsWith("/signUp");

  // If the user has no token (is not logged in)
  if (!token) {
    // If they are trying to access a protected page, redirect them to signIn.
    // Otherwise, allow them to access public/auth pages.
    if (!isAuthPage) {
      return NextResponse.redirect(
        new URL(`/signIn?callbackUrl=${pathname}`, request.url)
      );
    }
    return NextResponse.next();
  }

  // If the user IS logged in
  const { profileComplete, role } = token;
  const isProfilePage = pathname.startsWith("/dashboard/profile");

  // Flow 1: Profile is incomplete (e.g., new Google user)
  if (profileComplete === false) {
    // If they are not already on the profile completion page, force them there.
    // We allow API calls to pass through.
    if (!isProfilePage && !pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/dashboard/profile", request.url));
    }
  }

  // Flow 2: Profile IS complete
  else if (profileComplete === true) {
    // If they try to visit an auth page, redirect them away to their specific dashboard.
    if (isAuthPage) {
      const dashboardUrl =
        role === "Host" ? "/host/dashboard" : "/student/dashboard";
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    // If they try to visit the generic /dashboard, redirect them to their specific one.
    if (pathname === "/dashboard") {
      const dashboardUrl =
        role === "Host" ? "/host/dashboard" : "/student/dashboard";
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
  }

  // If none of the above redirect conditions are met, the user is authenticated,
  // their profile is complete, and they are navigating to a valid page. Allow the request.
  return NextResponse.next();
}

// Configuration to specify which paths the middleware should run on.
export const config = {
  matcher: [
    "/signIn",
    "/signUp",
    "/dashboard/:path*",
    "/host/:path*",
    "/student/:path*",
  ],
};
