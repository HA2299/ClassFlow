import { type NextRequest } from "next/server";
import { handleDemoMiddleware } from "@/lib/demo/middleware";

export async function middleware(request: NextRequest) {
  return handleDemoMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
