"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Class, Institution, Profile, Student, Grade, Assignment, Submission, RiskFlag } from "@/types/database";
import {
  clearDemoSession,
  getDemoSessionProfile,
  setDemoSession,
} from "@/lib/demo/session";
import { getHomePathForRole } from "@/lib/demo/constants";
import {
  ensureDemoStoreHydrated,
  saveDemoStore,
} from "@/lib/demo/hydrate.server";
import {
  addClass,
  addInstitution,
  addProfile,
  addStudent,
  addAssignment,
  addSubmission,
  countClassesByTeacher,
  findProfileByEmail,
  getClassByIdForTeacher,
  getClassesByTeacher,
  getRecentClassesByTeacher,
  getStudentsByClass,
  getStudentById,
  getStudentForProfile,
  getGradesByStudent,
  calculateStudentAverage,
  getRiskFlagsByStudent,
  getAssignmentsByClass,
  getAssignmentById,
  getSubmissionsByAssignment,
  getSubmissionByStudentAndAssignment,
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

function withHydratedStore<T>(fn: () => T): T {
  ensureDemoStoreHydrated();
  return fn();
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  withHydratedStore(() => undefined);

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
  setDemoSession(profileId, "teacher");
  saveDemoStore();

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  withHydratedStore(() => undefined);

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

  setDemoSession(profile.id, profile.role);

  revalidatePath("/dashboard");
  redirect(getHomePathForRole(profile.role));
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
  withHydratedStore(() => undefined);

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
  saveDemoStore();

  revalidatePath("/classes");
  revalidatePath("/dashboard");
  redirect("/classes");
}

export async function getTeacherClassCount(teacherId: string): Promise<number> {
  return withHydratedStore(() => countClassesByTeacher(teacherId));
}

export async function getTeacherRecentClasses(
  teacherId: string,
  limit: number
): Promise<Class[]> {
  return withHydratedStore(() => getRecentClassesByTeacher(teacherId, limit));
}

export async function getTeacherClasses(teacherId: string): Promise<Class[]> {
  return withHydratedStore(() => getClassesByTeacher(teacherId));
}

export async function getTeacherClassById(
  classId: string,
  teacherId: string
): Promise<Class | null> {
  return withHydratedStore(
    () => getClassByIdForTeacher(classId, teacherId) ?? null
  );
}

// Student actions
export async function getClassStudents(classId: string): Promise<Student[]> {
  return withHydratedStore(() => getStudentsByClass(classId));
}

export async function addStudentToClass(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  withHydratedStore(() => undefined);

  const classId = formData.get("classId") as string;
  const name = formData.get("name") as string;

  if (!classId || !name) {
    return { error: "שדה חסר" };
  }

  const profile = getDemoSessionProfile();
  if (!profile) {
    return { error: "נדרשת התחברות" };
  }

  const classItem = getClassByIdForTeacher(classId, profile.id);
  if (!classItem) {
    return { error: "כיתה לא קיימת" };
  }

  const createdAt = timestamp();
  addStudent({
    id: generateId(),
    class_id: classId,
    institution_id: profile.institution_id,
    name: name.trim(),
    email: undefined,
    status: "active",
    created_at: createdAt,
    updated_at: createdAt,
  });
  saveDemoStore();

  revalidatePath(`/classes/${classId}`);
  return {};
}

// Grades actions
export async function getStudentGrades(studentId: string): Promise<Grade[]> {
  return withHydratedStore(() => getGradesByStudent(studentId));
}

export async function getStudentAverage(studentId: string): Promise<number> {
  return withHydratedStore(() => calculateStudentAverage(studentId));
}

export async function getStudentRiskFlags(studentId: string): Promise<RiskFlag[]> {
  return withHydratedStore(() => getRiskFlagsByStudent(studentId));
}

// Assignment actions
export async function getClassAssignments(classId: string): Promise<Assignment[]> {
  return withHydratedStore(() => getAssignmentsByClass(classId));
}

export async function createAssignment(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  withHydratedStore(() => undefined);

  const classId = formData.get("classId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const due_date = formData.get("due_date") as string;
  const difficulty = formData.get("difficulty") as "easy" | "medium" | "hard";
  const type = formData.get("type") as "homework" | "quiz" | "project" | "exam";

  if (!classId || !name || !due_date) {
    return { error: "חובה: שם משימה ותאריך הגשה" };
  }

  const profile = getDemoSessionProfile();
  if (!profile) {
    return { error: "נדרשת התחברות" };
  }

  const classItem = getClassByIdForTeacher(classId, profile.id);
  if (!classItem) {
    return { error: "כיתה לא קיימת" };
  }

  const createdAt = timestamp();
  addAssignment({
    id: generateId(),
    class_id: classId,
    institution_id: profile.institution_id,
    name: name.trim(),
    description: description?.trim() || undefined,
    due_date,
    difficulty: difficulty || "medium",
    type: type || "homework",
    created_at: createdAt,
    updated_at: createdAt,
  });
  saveDemoStore();

  revalidatePath(`/classes/${classId}`);
  return {};
}

export async function submitAssignmentSolution(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  withHydratedStore(() => undefined);

  const assignmentId = formData.get("assignmentId") as string;
  const studentId = formData.get("studentId") as string;
  const answer = formData.get("answer") as string;

  if (!assignmentId || !studentId || typeof answer !== "string") {
    return { error: "הנתונים שהוזנו אינם תקינים" };
  }

  const profile = getDemoSessionProfile();
  if (!profile) {
    return { error: "נדרשת התחברות" };
  }

  let student = getStudentById(studentId);
  if (profile.role === "student") {
    const linked = getStudentForProfile(profile);
    if (!linked || linked.id !== studentId) {
      return { error: "אין הרשאה להגיש משימה זו" };
    }
    student = linked;
  }

  const assignment = getAssignmentById(assignmentId);
  if (!assignment) {
    return { error: "המשימה לא נמצאה" };
  }

  if (!student || student.class_id !== assignment.class_id) {
    return { error: "לא ניתן להגיש משימה לתלמיד זה" };
  }

  const existingSubmission = getSubmissionByStudentAndAssignment(studentId, assignmentId);
  const submittedAt = new Date().toISOString();
  const finalStatus = new Date(assignment.due_date) < new Date() ? "late" : "submitted";

  if (existingSubmission) {
    existingSubmission.answer = answer.trim();
    existingSubmission.submitted_at = submittedAt;
    existingSubmission.status = finalStatus;
    existingSubmission.created_at = submittedAt;
  } else {
    addSubmission({
      id: generateId(),
      assignment_id: assignmentId,
      student_id: studentId,
      institution_id: profile.institution_id,
      answer: answer.trim(),
      submitted_at: submittedAt,
      status: finalStatus,
      created_at: submittedAt,
    });
  }
  saveDemoStore();

  revalidatePath(`/classes/${assignment.class_id}`);
  revalidatePath(`/classes/${assignment.class_id}/assignments/${assignmentId}`);
  return {};
}

export async function getAssignmentSubmissions(assignmentId: string): Promise<Submission[]> {
  return withHydratedStore(() => getSubmissionsByAssignment(assignmentId));
}
