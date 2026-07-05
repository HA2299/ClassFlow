"use server";

import { revalidatePath } from "next/cache";
import type { Grade } from "@/types/database";
import { getDemoSessionProfile } from "@/lib/demo/session";
import { ensureDemoStoreHydrated, saveDemoStore } from "@/lib/demo/hydrate.server";
import {
  deleteStudent,
  getAssignmentById,
  getClassByIdForTeacher,
  getGradeBySubmission,
  getStudentById,
  getSubmissionById,
  updateStudent,
  upsertGrade,
} from "@/lib/demo/store";
import type { AuthActionState } from "@/app/actions/auth";

function hydrate(): void {
  ensureDemoStoreHydrated();
}

export async function gradeSubmission(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  hydrate();
  const submissionId = formData.get("submissionId");
  const assignmentId = formData.get("assignmentId");
  const classId = formData.get("classId");
  const score = formData.get("score");
  const feedback = formData.get("feedback");

  if (
    typeof submissionId !== "string" ||
    typeof assignmentId !== "string" ||
    typeof classId !== "string" ||
    typeof score !== "string"
  ) {
    return { error: "נתונים חסרים" };
  }

  const profile = getDemoSessionProfile();
  if (!profile) return { error: "נדרשת התחברות" };

  if (!getClassByIdForTeacher(classId, profile.id)) {
    return { error: "אין הרשאה" };
  }

  const assignment = getAssignmentById(assignmentId);
  if (!assignment) return { error: "משימה לא נמצאה" };

  const submission = getSubmissionById(submissionId);
  if (!submission) return { error: "הגשה לא נמצאה" };

  const parsedScore = Number(score);
  if (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
    return { error: "ציון לא תקין (0-100)" };
  }

  const grade: Grade = {
    id: getGradeBySubmission(submissionId)?.id ?? crypto.randomUUID(),
    submission_id: submissionId,
    student_id: submission.student_id,
    assignment_id: assignmentId,
    institution_id: profile.institution_id,
    score: parsedScore,
    max_score: 100,
    feedback: typeof feedback === "string" ? feedback.trim() : undefined,
    graded_at: new Date().toISOString(),
    graded_by: profile.id,
    created_at: new Date().toISOString(),
  };

  upsertGrade(grade);
  submission.status = "graded";

  saveDemoStore();
  revalidatePath(`/classes/${classId}/assignments/${assignmentId}`);
  revalidatePath(`/classes/${classId}/students/${submission.student_id}`);
  return {};
}

export async function updateStudentStatus(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  hydrate();
  const studentId = formData.get("studentId");
  const classId = formData.get("classId");
  const status = formData.get("status");

  if (
    typeof studentId !== "string" ||
    typeof classId !== "string" ||
    (status !== "active" && status !== "at_risk" && status !== "inactive")
  ) {
    return { error: "נתונים לא תקינים" };
  }

  const profile = getDemoSessionProfile();
  if (!profile || !getClassByIdForTeacher(classId, profile.id)) {
    return { error: "אין הרשאה" };
  }

  const student = getStudentById(studentId);
  if (!student || student.class_id !== classId) {
    return { error: "תלמיד לא נמצא" };
  }

  updateStudent(studentId, { status });
  saveDemoStore();
  revalidatePath(`/classes/${classId}/students/${studentId}`);
  revalidatePath(`/classes/${classId}`);
  return {};
}

export async function updateStudentAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  hydrate();
  const studentId = formData.get("studentId");
  const classId = formData.get("classId");
  const name = formData.get("name");

  if (typeof studentId !== "string" || typeof classId !== "string" || typeof name !== "string") {
    return { error: "נתונים חסרים" };
  }

  const profile = getDemoSessionProfile();
  if (!profile || !getClassByIdForTeacher(classId, profile.id)) {
    return { error: "אין הרשאה" };
  }

  if (!updateStudent(studentId, { name: name.trim() })) {
    return { error: "תלמיד לא נמצא" };
  }

  saveDemoStore();
  revalidatePath(`/classes/${classId}`);
  return {};
}

export async function deleteStudentAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  hydrate();
  const studentId = formData.get("studentId");
  const classId = formData.get("classId");

  if (typeof studentId !== "string" || typeof classId !== "string") {
    return { error: "נתונים חסרים" };
  }

  const profile = getDemoSessionProfile();
  if (!profile || !getClassByIdForTeacher(classId, profile.id)) {
    return { error: "אין הרשאה" };
  }

  if (!deleteStudent(studentId)) {
    return { error: "תלמיד לא נמצא" };
  }

  saveDemoStore();
  revalidatePath(`/classes/${classId}`);
  return {};
}

export async function getLinkedStudentRecord(profileId: string) {
  hydrate();
  const { findProfileById, getStudentForProfile } = await import(
    "@/lib/demo/store"
  );
  const profile = findProfileById(profileId);
  if (!profile) return null;
  return getStudentForProfile(profile) ?? null;
}
