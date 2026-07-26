import { redirect } from "next/navigation";
import type { Profile, UserRole } from "@/types/database";
import { isDemoMode } from "@/lib/config";
import { getHomePathForRole } from "@/lib/demo/constants";
import {
  getDemoSessionProfile,
  getDemoSessionRole,
} from "@/lib/demo/session";
import { createClient } from "@/lib/supabase/server";
import { findProfileById } from "@/lib/data/store";

export async function getSessionProfile(): Promise<Profile | null> {
  if (isDemoMode()) {
    return getDemoSessionProfile();
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return findProfileById(user.id);
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

export async function getSessionRole(): Promise<UserRole | null> {
  if (isDemoMode()) {
    return getDemoSessionRole();
  }

  const profile = await getSessionProfile();
  return profile?.role ?? null;
}
