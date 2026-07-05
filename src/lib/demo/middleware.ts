import { NextResponse, type NextRequest } from "next/server";
import {
  DEMO_ROLE_COOKIE,
  DEMO_SESSION_COOKIE,
  getHomePathForRole,
} from "./constants";

export function handleDemoMiddleware(request: NextRequest): NextResponse {
  const sessionId = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  const role = request.cookies.get(DEMO_ROLE_COOKIE)?.value;
  const isAuthenticated = Boolean(sessionId);

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/classes") ||
    request.nextUrl.pathname.startsWith("/assignments") ||
    request.nextUrl.pathname.startsWith("/student") ||
    request.nextUrl.pathname.startsWith("/parent") ||
    request.nextUrl.pathname.startsWith("/admin");

  if (!isAuthenticated && isProtectedRoute) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(DEMO_SESSION_COOKIE);
    response.cookies.delete(DEMO_ROLE_COOKIE);
    return response;
  }

  if (isAuthenticated && isAuthRoute) {
    const home = getHomePathForRole(role ?? "teacher");
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (isAuthenticated && role === "student") {
    const teacherOnly =
      request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/classes") ||
      request.nextUrl.pathname.startsWith("/assignments") ||
      request.nextUrl.pathname.startsWith("/admin");
    if (teacherOnly) {
      return NextResponse.redirect(new URL("/student", request.url));
    }
  }

  if (
    isAuthenticated &&
    (role === "teacher" || role === "institution_admin" || role === "system_admin")
  ) {
    if (request.nextUrl.pathname.startsWith("/student")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isAuthenticated && role === "parent") {
    if (
      !request.nextUrl.pathname.startsWith("/parent") &&
      isProtectedRoute
    ) {
      return NextResponse.redirect(new URL("/parent", request.url));
    }
  }

  return NextResponse.next({ request });
}
