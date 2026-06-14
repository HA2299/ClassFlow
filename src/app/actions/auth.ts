"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Class, Institution, Profile } from "@/types/database";
import {
  clearDemoSession,
  getDemoSessionProfile,
  setDemoSession,
} from "@/lib/demo/session";
import {
  addClass,
  addInstitution,
  addProfile,
  countClassesByTeacher,
  findProfileByEmail,
  getClassByIdForTeacher,
  getClassesByTeacher,
  getRecentClassesByTeacher,
  setProfilePassword,
  verifyProfilePassword,
} from "@/lib/demo/store";

export type AuthActionState = {
  error?: string;
};

function generateId(): string {
  return crypto.randomUUID();
}

function timestamp(): string {
  return new Date().toISOString();
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const fullName = formData.get("fullName");
  const institutionName = formData.get("institutionName");
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof fullName !== "string" ||
    typeof institutionName !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return { error: "כל השדות נדרשים" };
  }

  const trimmedFullName = fullName.trim();
  const trimmedInstitution = institutionName.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedFullName || !trimmedInstitution || !trimmedEmail || !password) {
    return { error: "כל השדות נדרשים" };
  }

  if (password.length < 8) {
    return { error: "הסיסמה חייבת להכיל לפחות 8 תווים" };
  }

  if (findProfileByEmail(trimmedEmail)) {
    return { error: "אימייל כבר רשום במערכת" };
  }

  const institutionId = generateId();
  const profileId = generateId();
  const createdAt = timestamp();

  const institution: Institution = {
    id: institutionId,
    name: trimmedInstitution,
    created_at: createdAt,
  };

  const profile: Profile = {
    id: profileId,
    institution_id: institutionId,
    role: "teacher",
    full_name: trimmedFullName,
    email: trimmedEmail,
    created_at: createdAt,
    updated_at: createdAt,
  };

  addInstitution(institution);
  addProfile(profile);
  setProfilePassword(profileId, password);
  setDemoSession(profileId);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "אימייל וסיסמה נדרשים" };
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail || !password) {
    return { error: "אימייל וסיסמה נדרשים" };
  }

  const profile = findProfileByEmail(trimmedEmail);

  if (!profile || !verifyProfilePassword(profile.id, password)) {
    return { error: "אימייל או סיסמה שגויים" };
  }

  setDemoSession(profile.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signOut() {
  clearDemoSession();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function createClass(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const name = formData.get("name");

  if (typeof name !== "string") {
    return { error: "שם כיתה נדרש" };
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    return { error: "שם כיתה נדרש" };
  }

  const profile = getDemoSessionProfile();

  if (!profile) {
    return { error: "נדרשת התחברות" };
  }

  if (profile.role !== "teacher" && profile.role !== "institution_admin") {
    return { error: "אין הרשאה ליצירת כיתות" };
  }

  const createdAt = timestamp();

  addClass({
    id: generateId(),
    name: trimmedName,
    institution_id: profile.institution_id,
    teacher_id: profile.id,
    created_at: createdAt,
    updated_at: createdAt,
  });

  revalidatePath("/classes");
  revalidatePath("/dashboard");
  redirect("/classes");
}

export async function getTeacherClassCount(teacherId: string): Promise<number> {
  return countClassesByTeacher(teacherId);
}

export async function getTeacherRecentClasses(
  teacherId: string,
  limit: number
): Promise<Class[]> {
  return getRecentClassesByTeacher(teacherId, limit);
}

export async function getTeacherClasses(teacherId: string): Promise<Class[]> {
  return getClassesByTeacher(teacherId);
}

export async function getTeacherClassById(
  classId: string,
  teacherId: string
): Promise<Class | null> {
  return getClassByIdForTeacher(classId, teacherId) ?? null;
}
