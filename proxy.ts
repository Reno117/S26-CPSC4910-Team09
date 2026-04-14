import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const sessionToken =
    req.cookies.get("__Secure-better-auth.session_token")?.value ||
    req.cookies.get("better-auth.session_token")?.value;

  // If no session token, redirect protected routes to login
  if (!sessionToken) {
    if (
      pathname.startsWith("/driver") ||
      pathname.startsWith("/sponsor") ||
      pathname.startsWith("/admin")
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // For authenticated users, role checks happen in page/layout logic
  return NextResponse.next();
}

export const config = {
  matcher: ["/driver/:path*", "/sponsor/:path*", "/admin/:path*"],
};