export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Get the session token from cookies
  const sessionToken = req.cookies.get('better-auth.session_token')?.value;
  
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
  
  // For authenticated users, we'll check role in the page/layout instead
  return NextResponse.next();
}

export const config = {
  matcher: ["/driver/:path*", "/sponsor/:path*", "/admin/:path*"],
};