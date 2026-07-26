import { type NextRequest, NextResponse } from "next/server";
import { isDemoMode } from "@/lib/config";
import { handleDemoMiddleware } from "@/lib/demo/middleware";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (isDemoMode()) {
    return handleDemoMiddleware(request);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
