"use server";

import { revalidatePath } from "next/cache";
import type { Assignment } from "@/types/database";
import { getSessionProfile } from "@/lib/auth/session";
import {
  deleteAssignment,
  getActiveAssignmentsForTeacher,
  getAssignmentsForTeacher,
  getClassByIdForTeacher,
  updateAssignment,
} from "@/lib/data/store";
import type { AuthActionState } from "@/app/actions/auth";

export async function getTeacherAssignmentsSummary(teacherId: string): Promise<{
  total: number;
  active: number;
  assignments: Assignment[];
}> {
  const assignments = await getAssignmentsForTeacher(teacherId);
  const active = await getActiveAssignmentsForTeacher(teacherId);
  return { total: assignments.length, active: active.length, assignments };
}

export async function getTeacherActiveAssignments(
  teacherId: string
): Promise<Assignment[]> {
  return getActiveAssignmentsForTeacher(teacherId);
}

export async function updateAssignmentAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const assignmentId = formData.get("assignmentId");
  const classId = formData.get("classId");
  const name = formData.get("name");
  const description = formData.get("description");
  const due_date = formData.get("due_date");
  const difficulty = formData.get("difficulty");
  const type = formData.get("type");

  if (
    typeof assignmentId !== "string" ||
    typeof classId !== "string" ||
    typeof name !== "string" ||
    typeof due_date !== "string"
  ) {
    return { error: "נתונים חסרים" };
  }

  const profile = await getSessionProfile();
  if (!profile) return { error: "נדרשת התחברות" };

  const classItem = await getClassByIdForTeacher(classId, profile.id);
  if (!classItem) return { error: "אין הרשאה" };

  const updated = await updateAssignment(assignmentId, {
    name: name.trim(),
    description:
      typeof description === "string" ? description.trim() || null : undefined,
    due_date,
    difficulty:
      difficulty === "easy" || difficulty === "medium" || difficulty === "hard"
        ? difficulty
        : undefined,
    type:
      type === "homework" ||
      type === "quiz" ||
      type === "project" ||
      type === "exam"
        ? type
        : undefined,
  });

  if (!updated) return { error: "משימה לא נמצאה" };

  revalidatePath(`/classes/${classId}`);
  return {};
}

export async function deleteAssignmentAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const assignmentId = formData.get("assignmentId");
  const classId = formData.get("classId");

  if (typeof assignmentId !== "string" || typeof classId !== "string") {
    return { error: "נתונים חסרים" };
  }

  const profile = await getSessionProfile();
  if (!profile) return { error: "נדרשת התחברות" };

  if (!(await getClassByIdForTeacher(classId, profile.id))) {
    return { error: "אין הרשאה" };
  }

  if (!(await deleteAssignment(assignmentId))) {
    return { error: "משימה לא נמצאה" };
  }

  revalidatePath(`/classes/${classId}`);
  revalidatePath("/assignments");
  return {};
}
