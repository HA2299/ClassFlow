import { isDemoMode } from "@/lib/config";
import { ensureDemoStoreHydrated, saveDemoStore } from "@/lib/demo/hydrate.server";
import * as demo from "@/lib/demo/store";
import * as supabase from "@/lib/supabase/repository";
import type {
  AIInsight,
  Assignment,
  Class,
  Grade,
  Institution,
  Profile,
  RiskFlag,
  Student,
  Submission,
} from "@/types/database";

function hydrateDemo(): void {
  if (isDemoMode()) {
    ensureDemoStoreHydrated();
  }
}

export async function findProfileById(id: string): Promise<Profile | null> {
  hydrateDemo();
  if (isDemoMode()) return demo.findProfileById(id) ?? null;
  return supabase.findProfileById(id);
}

export async function findProfileByEmail(email: string): Promise<Profile | null> {
  hydrateDemo();
  if (isDemoMode()) return demo.findProfileByEmail(email) ?? null;
  return supabase.findProfileByEmail(email);
}

export function verifyProfilePassword(profileId: string, password: string): boolean {
  hydrateDemo();
  return demo.verifyProfilePassword(profileId, password);
}

export async function getClassesByTeacher(teacherId: string): Promise<Class[]> {
  hydrateDemo();
  if (isDemoMode()) return demo.getClassesByTeacher(teacherId);
  return supabase.getClassesByTeacher(teacherId);
}

export async function getRecentClassesByTeacher(
  teacherId: string,
  limit: number
): Promise<Class[]> {
  hydrateDemo();
  if (isDemoMode()) return demo.getRecentClassesByTeacher(teacherId, limit);
  return supabase.getRecentClassesByTeacher(teacherId, limit);
}

export async function getClassByIdForTeacher(
  classId: string,
  teacherId: string
): Promise<Class | null> {
  hydrateDemo();
  if (isDemoMode()) return demo.getClassByIdForTeacher(classId, teacherId) ?? null;
  return supabase.getClassByIdForTeacher(classId, teacherId);
}

export async function getClassById(classId: string): Promise<Class | null> {
  hydrateDemo();
  if (isDemoMode()) return demo.getClassById(classId) ?? null;
  return supabase.getClassById(classId);
}

export async function addInstitution(institution: Institution): Promise<void> {
  hydrateDemo();
  if (isDemoMode()) {
    demo.addInstitution(institution);
    saveDemoStore();
    return;
  }
  await supabase.addInstitution(institution);
}

export async function addProfile(profile: Profile): Promise<void> {
  hydrateDemo();
  if (isDemoMode()) {
    demo.addProfile(profile);
    saveDemoStore();
    return;
  }
  await supabase.addProfile(profile);
}

export async function addClass(classItem: Class): Promise<void> {
  hydrateDemo();
  if (isDemoMode()) {
    demo.addClass(classItem);
    saveDemoStore();
    return;
  }
  await supabase.addClass(classItem);
}

export async function countClassesByTeacher(teacherId: string): Promise<number> {
  hydrateDemo();
  if (isDemoMode()) return demo.countClassesByTeacher(teacherId);
  return supabase.countClassesByTeacher(teacherId);
}

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  hydrateDemo();
  if (isDemoMode()) return demo.getStudentsByClass(classId);
  return supabase.getStudentsByClass(classId);
}

export async function getStudentById(studentId: string): Promise<Student | null> {
  hydrateDemo();
  if (isDemoMode()) return demo.getStudentById(studentId) ?? null;
  return supabase.getStudentById(studentId);
}

export async function addStudent(student: Student): Promise<void> {
  hydrateDemo();
  if (isDemoMode()) {
    demo.addStudent(student);
    saveDemoStore();
    return;
  }
  await supabase.addStudent(student);
}

export async function updateStudent(
  studentId: string,
  updates: Partial<Pick<Student, "name" | "status" | "email">>
): Promise<Student | null> {
  hydrateDemo();
  if (isDemoMode()) {
    const updated = demo.updateStudent(studentId, updates) ?? null;
    if (updated) saveDemoStore();
    return updated;
  }
  return supabase.updateStudent(studentId, updates);
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  hydrateDemo();
  if (isDemoMode()) {
    const ok = demo.deleteStudent(studentId);
    if (ok) saveDemoStore();
    return ok;
  }
  return supabase.deleteStudent(studentId);
}

export async function getAssignmentsByClass(classId: string): Promise<Assignment[]> {
  hydrateDemo();
  if (isDemoMode()) return demo.getAssignmentsByClass(classId);
  return supabase.getAssignmentsByClass(classId);
}

export async function getAssignmentsForTeacher(
  teacherId: string
): Promise<Assignment[]> {
  hydrateDemo();
  if (isDemoMode()) return demo.getAssignmentsForTeacher(teacherId);
  return supabase.getAssignmentsForTeacher(teacherId);
}

export async function getActiveAssignmentsForTeacher(
  teacherId: string
): Promise<Assignment[]> {
  hydrateDemo();
  if (isDemoMode()) return demo.getActiveAssignmentsForTeacher(teacherId);
  return supabase.getActiveAssignmentsForTeacher(teacherId);
}

export async function getAssignmentById(
  assignmentId: string
): Promise<Assignment | null> {
  hydrateDemo();
  if (isDemoMode()) return demo.getAssignmentById(assignmentId) ?? null;
  return supabase.getAssignmentById(assignmentId);
}

export async function addAssignment(assignment: Assignment): Promise<void> {
  hydrateDemo();
  if (isDemoMode()) {
    demo.addAssignment(assignment);
    saveDemoStore();
    return;
  }
  await supabase.addAssignment(assignment);
}

export async function updateAssignment(
  assignmentId: string,
  updates: Partial<
    Pick<Assignment, "name" | "description" | "due_date" | "difficulty" | "type">
  >
): Promise<Assignment | null> {
  hydrateDemo();
  if (isDemoMode()) {
    const updated = demo.updateAssignment(assignmentId, updates) ?? null;
    if (updated) saveDemoStore();
    return updated;
  }
  return supabase.updateAssignment(assignmentId, updates);
}

export async function deleteAssignment(assignmentId: string): Promise<boolean> {
  hydrateDemo();
  if (isDemoMode()) {
    const ok = demo.deleteAssignment(assignmentId);
    if (ok) saveDemoStore();
    return ok;
  }
  return supabase.deleteAssignment(assignmentId);
}

export async function getSubmissionsByAssignment(
  assignmentId: string
): Promise<Submission[]> {
  hydrateDemo();
  if (isDemoMode()) return demo.getSubmissionsByAssignment(assignmentId);
  return supabase.getSubmissionsByAssignment(assignmentId);
}

export async function getSubmissionByStudentAndAssignment(
  studentId: string,
  assignmentId: string
): Promise<Submission | null> {
  hydrateDemo();
  if (isDemoMode()) {
    return demo.getSubmissionByStudentAndAssignment(studentId, assignmentId) ?? null;
  }
  return supabase.getSubmissionByStudentAndAssignment(studentId, assignmentId);
}

export async function getSubmissionById(
  submissionId: string
): Promise<Submission | null> {
  hydrateDemo();
  if (isDemoMode()) return demo.getSubmissionById(submissionId) ?? null;
  return supabase.getSubmissionById(submissionId);
}

export async function upsertSubmission(submission: Submission): Promise<void> {
  hydrateDemo();
  if (isDemoMode()) {
    const existing = demo.getSubmissionByStudentAndAssignment(
      submission.student_id,
      submission.assignment_id
    );
    if (existing) {
      existing.answer = submission.answer;
      existing.submitted_at = submission.submitted_at;
      existing.status = submission.status;
      existing.created_at = submission.created_at;
    } else {
      demo.addSubmission(submission);
    }
    saveDemoStore();
    return;
  }
  await supabase.upsertSubmission(submission);
}

export async function getGradesByStudent(studentId: string): Promise<Grade[]> {
  hydrateDemo();
  if (isDemoMode()) return demo.getGradesByStudent(studentId);
  return supabase.getGradesByStudent(studentId);
}

export async function getGradeBySubmission(
  submissionId: string
): Promise<Grade | null> {
  hydrateDemo();
  if (isDemoMode()) return demo.getGradeBySubmission(submissionId) ?? null;
  return supabase.getGradeBySubmission(submissionId);
}

export async function upsertGrade(grade: Grade): Promise<Grade | null> {
  hydrateDemo();
  if (isDemoMode()) {
    const result = demo.upsertGrade(grade);
    saveDemoStore();
    return result;
  }
  return supabase.upsertGrade(grade);
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: Submission["status"]
): Promise<void> {
  hydrateDemo();
  if (isDemoMode()) {
    const submission = demo.getSubmissionById(submissionId);
    if (submission) {
      submission.status = status;
      saveDemoStore();
    }
    return;
  }
  await supabase.updateSubmissionStatus(submissionId, status);
}

export async function calculateStudentAverage(studentId: string): Promise<number> {
  hydrateDemo();
  if (isDemoMode()) return demo.calculateStudentAverage(studentId);
  return supabase.calculateStudentAverage(studentId);
}

export async function getRiskFlagsByStudent(
  studentId: string
): Promise<RiskFlag[]> {
  hydrateDemo();
  if (isDemoMode()) return demo.getRiskFlagsByStudent(studentId);
  return supabase.getRiskFlagsByStudent(studentId);
}

export async function getAtRiskStudentsForTeacher(
  teacherId: string
): Promise<Student[]> {
  hydrateDemo();
  if (isDemoMode()) return demo.getAtRiskStudentsForTeacher(teacherId);
  return supabase.getAtRiskStudentsForTeacher(teacherId);
}

export async function addRiskFlag(flag: RiskFlag): Promise<void> {
  hydrateDemo();
  if (isDemoMode()) {
    demo.addRiskFlag(flag);
    saveDemoStore();
    return;
  }
  await supabase.addRiskFlag(flag);
}

export async function getAIInsightsForClass(classId: string): Promise<AIInsight[]> {
  hydrateDemo();
  if (isDemoMode()) return demo.getAIInsightsForClass(classId);
  return supabase.getAIInsightsForClass(classId);
}

export async function getRecentSubmissionsForTeacher(
  teacherId: string,
  days = 7
): Promise<Array<Submission & { assignment?: Assignment; student?: Student }>> {
  hydrateDemo();
  if (isDemoMode()) return demo.getRecentSubmissionsForTeacher(teacherId, days);
  return supabase.getRecentSubmissionsForTeacher(teacherId, days);
}

export async function getClassSubmissionStats(classId: string) {
  hydrateDemo();
  if (isDemoMode()) return demo.getClassSubmissionStats(classId);
  return supabase.getClassSubmissionStats(classId);
}

export async function getClassAnalytics(classId: string) {
  hydrateDemo();
  if (isDemoMode()) return demo.getClassAnalytics(classId);
  return supabase.getClassAnalytics(classId);
}

export async function detectRiskFlagsForTeacher(
  teacherId: string
): Promise<RiskFlag[]> {
  hydrateDemo();
  if (isDemoMode()) return demo.detectRiskFlagsForTeacher(teacherId);
  return supabase.detectRiskFlagsForTeacher(teacherId);
}

export async function getStudentForProfile(
  profile: Profile
): Promise<Student | null> {
  hydrateDemo();
  if (isDemoMode()) return demo.getStudentForProfile(profile) ?? null;
  return supabase.getStudentForProfile(profile);
}

export async function riskFlagExists(id: string): Promise<boolean> {
  hydrateDemo();
  if (isDemoMode()) return demo.getStore().riskFlags.some((f) => f.id === id);
  return supabase.riskFlagExists(id);
}

export function setProfilePassword(profileId: string, password: string): void {
  hydrateDemo();
  demo.setProfilePassword(profileId, password);
  saveDemoStore();
}
