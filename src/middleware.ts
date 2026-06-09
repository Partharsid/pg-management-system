import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as { role?: string })?.role;

  // Public routes
  if (pathname === "/login" || pathname === "/") {
    if (isLoggedIn && pathname === "/login") {
      const dashboardUrl = getDashboardUrl(userRole || "");
      return NextResponse.redirect(new URL(dashboardUrl, req.url));
    }
    return NextResponse.next();
  }

  // Protected routes - require auth
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role-based access control
  if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL(getDashboardUrl(userRole || ""), req.url));
  }

  if (pathname.startsWith("/manager") && !["ADMIN", "MANAGER"].includes(userRole || "")) {
    return NextResponse.redirect(new URL(getDashboardUrl(userRole || ""), req.url));
  }

  if (pathname.startsWith("/tenant") && !["ADMIN", "MANAGER", "TENANT"].includes(userRole || "")) {
    return NextResponse.redirect(new URL(getDashboardUrl(userRole || ""), req.url));
  }

  // API routes - role check
  if (pathname.startsWith("/api/")) {
    // Public API routes
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Admin-only API routes
    if (pathname.startsWith("/api/users") && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Tenant can only read payments
    if (userRole === "TENANT" && req.method !== "GET") {
      if (pathname.startsWith("/api/payments") || pathname.startsWith("/api/invoices")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
});

function getDashboardUrl(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "MANAGER":
      return "/manager";
    case "TENANT":
      return "/tenant";
    default:
      return "/login";
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
