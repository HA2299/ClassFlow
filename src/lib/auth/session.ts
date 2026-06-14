import { redirect } from "next/navigation";
import { getDemoSessionProfile } from "@/lib/demo/session";
import type { Profile } from "@/types/database";

export async function getSessionProfile(): Promise<Profile | null> {
  return getDemoSessionProfile();
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}
