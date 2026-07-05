import { cookies } from "next/headers";
import type { Profile, UserRole } from "@/types/database";
import { DEMO_ROLE_COOKIE, DEMO_SESSION_COOKIE } from "./constants";
import { ensureDemoStoreHydrated } from "./hydrate.server";
import { findProfileById } from "./store";

const sessionOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
};

export function setDemoSession(profileId: string, role: UserRole): void {
  cookies().set(DEMO_SESSION_COOKIE, profileId, sessionOptions);
  cookies().set(DEMO_ROLE_COOKIE, role, sessionOptions);
}

export function clearDemoSession(): void {
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete(DEMO_ROLE_COOKIE);
}

export function getDemoSessionProfileId(): string | null {
  return cookies().get(DEMO_SESSION_COOKIE)?.value ?? null;
}

export function getDemoSessionRole(): UserRole | null {
  const role = cookies().get(DEMO_ROLE_COOKIE)?.value;
  if (
    role === "teacher" ||
    role === "student" ||
    role === "parent" ||
    role === "institution_admin" ||
    role === "system_admin"
  ) {
    return role;
  }
  return null;
}

export function getDemoSessionProfile(): Profile | null {
  ensureDemoStoreHydrated();

  const profileId = getDemoSessionProfileId();
  if (!profileId) {
    return null;
  }

  return findProfileById(profileId) ?? null;
}

export function isDemoAuthenticated(): boolean {
  return getDemoSessionProfile() !== null;
}
