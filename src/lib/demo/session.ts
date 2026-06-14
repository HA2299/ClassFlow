import { cookies } from "next/headers";
import type { Profile } from "@/types/database";
import { DEMO_SESSION_COOKIE } from "./constants";
import { findProfileById } from "./store";

const sessionOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
};

export function setDemoSession(profileId: string): void {
  cookies().set(DEMO_SESSION_COOKIE, profileId, sessionOptions);
}

export function clearDemoSession(): void {
  cookies().delete(DEMO_SESSION_COOKIE);
}

export function getDemoSessionProfileId(): string | null {
  return cookies().get(DEMO_SESSION_COOKIE)?.value ?? null;
}

export function getDemoSessionProfile(): Profile | null {
  const profileId = getDemoSessionProfileId();
  if (!profileId) {
    return null;
  }

  return findProfileById(profileId) ?? null;
}

export function isDemoAuthenticated(): boolean {
  return getDemoSessionProfile() !== null;
}
