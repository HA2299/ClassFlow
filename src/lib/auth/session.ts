import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import { getHomePathForRole } from "@/lib/demo/constants";
import {
  getDemoSessionProfile,
  getDemoSessionRole,
} from "@/lib/demo/session";

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

export async function requireTeacher(): Promise<Profile> {
  const profile = await requireProfile();

  if (
    profile.role !== "teacher" &&
    profile.role !== "institution_admin" &&
    profile.role !== "system_admin"
  ) {
    redirect(getHomePathForRole(profile.role));
  }

  return profile;
}

export async function requireStudent(): Promise<Profile> {
  const profile = await requireProfile();

  if (profile.role !== "student") {
    redirect(getHomePathForRole(profile.role));
  }

  return profile;
}

export async function requireParent(): Promise<Profile> {
  const profile = await requireProfile();

  if (profile.role !== "parent") {
    redirect(getHomePathForRole(profile.role));
  }

  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();

  if (
    profile.role !== "institution_admin" &&
    profile.role !== "system_admin"
  ) {
    redirect(getHomePathForRole(profile.role));
  }

  return profile;
}

export function getSessionRole() {
  return getDemoSessionRole();
}
