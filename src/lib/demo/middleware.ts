import { NextResponse, type NextRequest } from "next/server";
import { DEMO_SESSION_COOKIE } from "./constants";
import { findProfileById } from "./store";

export function handleDemoMiddleware(request: NextRequest): NextResponse {
  const sessionId = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  
  // עדכון פה: במצב דמו, אם יש sessionId ב-Cookie, נחשיב את המשתמש כמחובר
  const isAuthenticated = !!sessionId;

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/classes");

  if (!isAuthenticated && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}