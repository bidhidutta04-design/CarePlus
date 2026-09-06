import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { homeFor, isValidRole, pathAllowed } from "@/lib/roles";

const PUBLIC_PREFIXES = ["/login", "/portal", "/forgot-password", "/change-password", "/api"];

// NOTE: UI gating only. The role cookie is readable client-side and could be
// forged — but the backend re-checks RBAC on every API call, so a forged role
// reveals navigation at most, never data or actions.
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Public marketing site + auth flows
  if (pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    // Already logged in? Skip the login form straight to the role home.
    // NOTE: /portal stays viewable for everyone (it is informational) —
    // bouncing logged-in users away from it made the portal "not open".
    const token = request.cookies.get("careplus_token")?.value;
    if (token && (pathname === "/login" || pathname.startsWith("/login/"))) {
      const roleCookie = request.cookies.get("careplus_role")?.value;
      const home = isValidRole(roleCookie) ? homeFor(roleCookie) : "/dashboard";
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
  }

  const token = request.cookies.get("careplus_token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const roleCookie = request.cookies.get("careplus_role")?.value;
  if (!isValidRole(roleCookie)) {
    // Token without a known role (e.g. pre-existing session) — re-login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (!pathAllowed(roleCookie, pathname)) {
    return NextResponse.redirect(new URL(homeFor(roleCookie), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
