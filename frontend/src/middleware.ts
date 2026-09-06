import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/login", "/portal", "/forgot-password", "/api"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Public marketing site + auth flows
  if (pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    // Already logged in? Skip auth pages straight to the dashboard
    const token = request.cookies.get("careplus_token")?.value;
    if (token && (pathname === "/login" || pathname === "/portal")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const token = request.cookies.get("careplus_token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
