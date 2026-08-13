import { redirect } from "next/navigation";
import type { Profile, UserRole } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { findProfileById } from "@/lib/data/store";

export async function getSessionProfile(): Promise<Profile | null> {
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
    if (profile.role === "student") {
      redirect("/student");
    }
    if (profile.role === "parent") {
      redirect("/parent");
    }
    redirect("/dashboard");
  }

  return profile;
}

export async function requireStudent(): Promise<Profile> {
  const profile = await requireProfile();

  if (profile.role !== "student") {
    if (profile.role === "parent") {
      redirect("/parent");
    }
    redirect("/dashboard");
  }

  return profile;
}

export async function requireParent(): Promise<Profile> {
  const profile = await requireProfile();

  if (profile.role !== "parent") {
    if (profile.role === "student") {
      redirect("/student");
    }
    redirect("/dashboard");
  }

  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();

  if (
    profile.role !== "institution_admin" &&
    profile.role !== "system_admin"
  ) {
    if (profile.role === "student") {
      redirect("/student");
    }
    if (profile.role === "parent") {
      redirect("/parent");
    }
    redirect("/dashboard");
  }

  return profile;
}

export async function getSessionRole(): Promise<UserRole | null> {
  const profile = await getSessionProfile();
  return profile?.role ?? null;
}
