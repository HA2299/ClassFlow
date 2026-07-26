"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Class, Institution, Profile, Student, Grade, Assignment, Submission, RiskFlag } from "@/types/database";
import { isDemoMode } from "@/lib/config";
import {
  clearDemoSession,
  getDemoSessionProfile,
  setDemoSession,
} from "@/lib/demo/session";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  addClass,
  addInstitution,
  addProfile,
  addStudent,
  addAssignment,
  countClassesByTeacher,
  findProfileByEmail,
  getClassByIdForTeacher,
  getClassesByTeacher,
  getRecentClassesByTeacher,
  getStudentsByClass,
  getStudentById,
  getGradesByStudent,
  calculateStudentAverage,
  getRiskFlagsByStudent,
  getAssignmentsByClass,
  getAssignmentById,
  getSubmissionsByAssignment,
  getSubmissionByStudentAndAssignment,
  setProfilePassword,
  verifyProfilePassword,
  upsertSubmission,
} from "@/lib/data/store";

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

  if (await findProfileByEmail(trimmedEmail)) {
    return { error: "אימייל כבר רשום במערכת" };
  }

  if (isDemoMode()) {
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
      linked_student_id: null,
      created_at: createdAt,
      updated_at: createdAt,
    };

    await addInstitution(institution);
    await addProfile(profile);
    setProfilePassword(profileId, password);
    setDemoSession(profileId, "teacher");

    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      data: { full_name: trimmedFullName },
    },
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "שגיאה בהרשמה" };
  }

  const { data: institution, error: institutionError } = await supabase
    .from("institutions")
    .insert({ name: trimmedInstitution })
    .select("id, name, created_at")
    .single();

  if (institutionError || !institution) {
    return { error: "שגיאה ביצירת מוסד" };
  }

  const createdAt = timestamp();
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    institution_id: institution.id,
    role: "teacher",
    full_name: trimmedFullName,
    email: trimmedEmail,
    created_at: createdAt,
    updated_at: createdAt,
  });

  if (profileError) {
    return { error: "שגיאה ביצירת פרופיל" };
  }

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

  if (isDemoMode()) {
    const profile = await findProfileByEmail(trimmedEmail);

    if (!profile || !verifyProfilePassword(profile.id, password)) {
      return { error: "אימייל או סיסמה שגויים" };
    }

    setDemoSession(profile.id, profile.role);

    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error) {
    return { error: "אימייל או סיסמה שגויים" };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signOut() {
  if (isDemoMode()) {
    clearDemoSession();
  } else {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

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

  const profile = isDemoMode() ? getDemoSessionProfile() : await getSessionProfile();

  if (!profile) {
    return { error: "נדרשת התחברות" };
  }

  if (profile.role !== "teacher" && profile.role !== "institution_admin") {
    return { error: "אין הרשאה ליצירת כיתות" };
  }

  const createdAt = timestamp();

  await addClass({
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
  return getClassByIdForTeacher(classId, teacherId);
}

export async function getClassStudents(classId: string): Promise<Student[]> {
  return getStudentsByClass(classId);
}

export async function addStudentToClass(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const classId = formData.get("classId") as string;
  const name = formData.get("name") as string;

  if (!classId || !name) {
    return { error: "שדה חסר" };
  }

  const profile = isDemoMode() ? getDemoSessionProfile() : await getSessionProfile();

  if (!profile) {
    return { error: "נדרשת התחברות" };
  }

  const classItem = await getClassByIdForTeacher(classId, profile.id);
  if (!classItem) {
    return { error: "כיתה לא קיימת" };
  }

  const createdAt = timestamp();
  await addStudent({
    id: generateId(),
    class_id: classId,
    institution_id: profile.institution_id,
    name: name.trim(),
    email: null,
    status: "active",
    created_at: createdAt,
    updated_at: createdAt,
  });

  revalidatePath(`/classes/${classId}`);
  return {};
}

export async function getStudentGrades(studentId: string): Promise<Grade[]> {
  return getGradesByStudent(studentId);
}

export async function getStudentAverage(studentId: string): Promise<number> {
  return calculateStudentAverage(studentId);
}

export async function getStudentRiskFlags(studentId: string): Promise<RiskFlag[]> {
  return getRiskFlagsByStudent(studentId);
}

export async function getClassAssignments(classId: string): Promise<Assignment[]> {
  return getAssignmentsByClass(classId);
}

export async function createAssignment(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const classId = formData.get("classId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const due_date = formData.get("due_date") as string;
  const difficulty = formData.get("difficulty") as "easy" | "medium" | "hard";
  const type = formData.get("type") as "homework" | "quiz" | "project" | "exam";

  if (!classId || !name || !due_date) {
    return { error: "חובה: שם משימה ותאריך הגשה" };
  }

  const profile = isDemoMode() ? getDemoSessionProfile() : await getSessionProfile();

  if (!profile) {
    return { error: "נדרשת התחברות" };
  }

  const classItem = await getClassByIdForTeacher(classId, profile.id);
  if (!classItem) {
    return { error: "כיתה לא קיימת" };
  }

  const createdAt = timestamp();
  await addAssignment({
    id: generateId(),
    class_id: classId,
    institution_id: profile.institution_id,
    name: name.trim(),
    description: description?.trim() || null,
    due_date,
    difficulty: difficulty || "medium",
    type: type || "homework",
    created_at: createdAt,
    updated_at: createdAt,
  });

  revalidatePath(`/classes/${classId}`);
  return {};
}

export async function submitAssignmentSolution(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const assignmentId = formData.get("assignmentId") as string;
  const studentId = formData.get("studentId") as string;
  const answer = formData.get("answer") as string;

  if (!assignmentId || !studentId || typeof answer !== "string") {
    return { error: "הנתונים שהוזנו אינם תקינים" };
  }

  const profile = isDemoMode() ? getDemoSessionProfile() : await getSessionProfile();

  if (!profile) {
    return { error: "נדרשת התחברות" };
  }

  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) {
    return { error: "המשימה לא נמצאה" };
  }

  const student = await getStudentById(studentId);
  if (!student || student.class_id !== assignment.class_id) {
    return { error: "לא ניתן להגיש משימה לתלמיד זה" };
  }

  const existingSubmission = await getSubmissionByStudentAndAssignment(
    studentId,
    assignmentId
  );
  const submittedAt = new Date().toISOString();
  const finalStatus =
    new Date(assignment.due_date) < new Date() ? "late" : "submitted";

  await upsertSubmission({
    id: existingSubmission?.id ?? generateId(),
    assignment_id: assignmentId,
    student_id: studentId,
    institution_id: profile.institution_id,
    answer: answer.trim(),
    submitted_at: submittedAt,
    status: finalStatus,
    created_at: submittedAt,
  });

  revalidatePath(`/classes/${assignment.class_id}`);
  revalidatePath(`/classes/${assignment.class_id}/assignments/${assignmentId}`);
  return {};
}

export async function getAssignmentSubmissions(
  assignmentId: string
): Promise<Submission[]> {
  return getSubmissionsByAssignment(assignmentId);
}
