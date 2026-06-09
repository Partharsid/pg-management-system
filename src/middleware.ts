import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getSessionFromRequest(req: NextRequest): { role?: string } | null {
  const sessionToken = req.cookies.get("next-auth.session-token")?.value ||
                       req.cookies.get("__Secure-next-auth.session-token")?.value;
  if (!sessionToken) return null;
  return { role: undefined };
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow all auth routes and API auth routes
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Allow public routes
  if (pathname === "/" || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Check if user has a session cookie
  const sessionToken = req.cookies.get("next-auth.session-token")?.value ||
                       req.cookies.get("__Secure-next-auth.session-token")?.value;

  // If no session, redirect to login
  if (!sessionToken && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If no session on API route, return 401
  if (!sessionToken && pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
