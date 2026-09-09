"use server";

import { revalidatePath } from "next/cache";
import type { Grade } from "@/types/database";
import { getSessionProfile } from "@/lib/auth/session";
import {
  deleteStudent,
  ensureStudentRecordForProfile,
  getAssignmentById,
  getClassByIdForTeacher,
  getGradeBySubmission,
  getStudentById,
  getSubmissionById,
  updateStudent,
  upsertGrade,
  updateSubmissionStatus,
} from "@/lib/data/store";
import type { AuthActionState } from "@/app/actions/auth";
import { notifyStudentAboutGrade } from "@/app/actions/notifications";

export async function gradeSubmission(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
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

  const profile = await getSessionProfile();
  if (!profile) return { error: "נדרשת התחברות" };

  if (!(await getClassByIdForTeacher(classId, profile.id))) {
    return { error: "אין הרשאה" };
  }

  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) return { error: "משימה לא נמצאה" };

  const submission = await getSubmissionById(submissionId);
  if (!submission) return { error: "הגשה לא נמצאה" };

  const parsedScore = Number(score);
  if (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
    return { error: "ציון לא תקין (0-100)" };
  }

  const existingGrade = await getGradeBySubmission(submissionId);
  const grade: Grade = {
    id: existingGrade?.id ?? crypto.randomUUID(),
    submission_id: submissionId,
    student_id: submission.student_id,
    assignment_id: assignmentId,
    institution_id: profile.institution_id,
    score: parsedScore,
    max_score: 100,
    feedback: typeof feedback === "string" ? feedback.trim() : null,
    graded_at: new Date().toISOString(),
    graded_by: profile.id,
    created_at: new Date().toISOString(),
  };

  await upsertGrade(grade);
  await updateSubmissionStatus(submissionId, "graded");

  if (!existingGrade) {
    await notifyStudentAboutGrade({
      institutionId: profile.institution_id,
      studentId: submission.student_id,
      assignmentName: assignment.name,
      score: parsedScore,
    });
  }

  revalidatePath(`/classes/${classId}/assignments/${assignmentId}`);
  revalidatePath(`/classes/${classId}/students/${submission.student_id}`);
  return {};
}

export async function updateStudentStatus(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
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

  const profile = await getSessionProfile();
  if (!profile || !(await getClassByIdForTeacher(classId, profile.id))) {
    return { error: "אין הרשאה" };
  }

  const student = await getStudentById(studentId);
  if (!student || student.class_id !== classId) {
    return { error: "תלמיד לא נמצא" };
  }

  await updateStudent(studentId, { status });
  revalidatePath(`/classes/${classId}/students/${studentId}`);
  revalidatePath(`/classes/${classId}`);
  return {};
}

export async function updateStudentAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const studentId = formData.get("studentId");
  const classId = formData.get("classId");
  const name = formData.get("name");

  if (typeof studentId !== "string" || typeof classId !== "string" || typeof name !== "string") {
    return { error: "נתונים חסרים" };
  }

  const profile = await getSessionProfile();
  if (!profile || !(await getClassByIdForTeacher(classId, profile.id))) {
    return { error: "אין הרשאה" };
  }

  if (!(await updateStudent(studentId, { name: name.trim() }))) {
    return { error: "תלמיד לא נמצא" };
  }

  revalidatePath(`/classes/${classId}`);
  return {};
}

export async function deleteStudentAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const studentId = formData.get("studentId");
  const classId = formData.get("classId");

  if (typeof studentId !== "string" || typeof classId !== "string") {
    return { error: "נתונים חסרים" };
  }

  const profile = await getSessionProfile();
  if (!profile || !(await getClassByIdForTeacher(classId, profile.id))) {
    return { error: "אין הרשאה" };
  }

  if (!(await deleteStudent(studentId))) {
    return { error: "תלמיד לא נמצא" };
  }

  revalidatePath(`/classes/${classId}`);
  return {};
}

export async function getLinkedStudentRecord(profileId: string) {
  const { findProfileById } = await import("@/lib/data/store");
  const profile = await findProfileById(profileId);
  if (!profile) return null;
  if (profile.role !== "student") return null;
  return ensureStudentRecordForProfile(profile);
}
