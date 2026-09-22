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


export async function findProfileById(id: string): Promise<Profile | null> {
  return supabase.findProfileById(id);
}

export async function findProfileByEmail(email: string): Promise<Profile | null> {
  return supabase.findProfileByEmail(email);
}

export async function findProfileByIdentityNumber(identityNumber: string): Promise<Profile | null> {
  return supabase.findProfileByIdentityNumber(identityNumber);
}

export async function findStudentByIdentityNumber(
  identityNumber: string
): Promise<Student | null> {
  return supabase.findStudentByIdentityNumber(identityNumber);
}

export async function getClassesByTeacher(teacherId: string): Promise<Class[]> {
  return supabase.getClassesByTeacher(teacherId);
}

export async function getClassesByInstitution(institutionId: string): Promise<Class[]> {
  return supabase.getClassesByInstitution(institutionId);
}

export async function getRecentClassesByTeacher(
  teacherId: string,
  limit: number
): Promise<Class[]> {
  return supabase.getRecentClassesByTeacher(teacherId, limit);
}

export async function getClassByIdForTeacher(
  classId: string,
  teacherId: string
): Promise<Class | null> {
  return supabase.getClassByIdForTeacher(classId, teacherId);
}

export async function getClassById(classId: string): Promise<Class | null> {
  return supabase.getClassById(classId);
}

export async function addInstitution(institution: Institution): Promise<void> {
  await supabase.addInstitution(institution);
}

export async function addProfile(profile: Profile): Promise<void> {
  await supabase.addProfile(profile);
}

export async function addClass(classItem: Class): Promise<void> {
  await supabase.addClass(classItem);
}

export async function countClassesByTeacher(teacherId: string): Promise<number> {
  return supabase.countClassesByTeacher(teacherId);
}

export async function getStudentsByClass(
  classId: string
): Promise<Student[]> {
  return supabase.getStudentsByClass(classId);
}

export async function getStudentById(studentId: string): Promise<Student | null> {
  return supabase.getStudentById(studentId);
}

export async function getSubmissionRateForTeacher(teacherId: string): Promise<number> {
  return supabase.getSubmissionRateForTeacher(teacherId);
}

export async function addStudent(student: Student): Promise<boolean> {
  return supabase.addStudent(student);
}

export async function ensureStudentRecordForProfile(profile: Profile): Promise<Student | null> {
  return supabase.ensureStudentRecordForProfile(profile);
}

export async function updateStudent(
  studentId: string,
  updates: Partial<Pick<Student, "name" | "status" | "email">>
): Promise<Student | null> {
  return supabase.updateStudent(studentId, updates);
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  return supabase.deleteStudent(studentId);
}

export async function getAssignmentsByClass(classId: string): Promise<Assignment[]> {
  return supabase.getAssignmentsByClass(classId);
}

export async function getAssignmentsForTeacher(
  teacherId: string
): Promise<Assignment[]> {
  return supabase.getAssignmentsForTeacher(teacherId);
}

export async function getActiveAssignmentsForTeacher(
  teacherId: string
): Promise<Assignment[]> {
  return supabase.getActiveAssignmentsForTeacher(teacherId);
}

export async function getAssignmentById(
  assignmentId: string
): Promise<Assignment | null> {
  return supabase.getAssignmentById(assignmentId);
}

export async function addAssignment(assignment: Assignment): Promise<void> {
  await supabase.addAssignment(assignment);
}

export async function updateAssignment(
  assignmentId: string,
  updates: Partial<
    Pick<Assignment, "name" | "description" | "due_date" | "difficulty" | "type">
  >
): Promise<Assignment | null> {
  return supabase.updateAssignment(assignmentId, updates);
}

export async function deleteAssignment(assignmentId: string): Promise<boolean> {
  return supabase.deleteAssignment(assignmentId);
}

export async function getSubmissionsByAssignment(
  assignmentId: string
): Promise<Submission[]> {
  return supabase.getSubmissionsByAssignment(assignmentId);
}

export async function getSubmissionByStudentAndAssignment(
  studentId: string,
  assignmentId: string
): Promise<Submission | null> {
  return supabase.getSubmissionByStudentAndAssignment(studentId, assignmentId);
}

export async function getSubmissionById(
  submissionId: string
): Promise<Submission | null> {
  return supabase.getSubmissionById(submissionId);
}

export async function upsertSubmission(submission: Submission): Promise<void> {
  await supabase.upsertSubmission(submission);
}

export async function getGradesByStudent(studentId: string): Promise<Grade[]> {
  return supabase.getGradesByStudent(studentId);
}

export async function getGradeBySubmission(
  submissionId: string
): Promise<Grade | null> {
  return supabase.getGradeBySubmission(submissionId);
}

export async function upsertGrade(grade: Grade): Promise<Grade | null> {
  return supabase.upsertGrade(grade);
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: Submission["status"]
): Promise<void> {
  await supabase.updateSubmissionStatus(submissionId, status);
}

export async function calculateStudentAverage(studentId: string): Promise<number> {
  return supabase.calculateStudentAverage(studentId);
}

export async function getRiskFlagsByStudent(
  studentId: string
): Promise<RiskFlag[]> {
  return supabase.getRiskFlagsByStudent(studentId);
}

export async function getAtRiskStudentsForTeacher(
  teacherId: string
): Promise<Student[]> {
  return supabase.getAtRiskStudentsForTeacher(teacherId);
}

export async function addRiskFlag(flag: RiskFlag): Promise<void> {
  await supabase.addRiskFlag(flag);
}

export async function getAIInsightsForClass(classId: string): Promise<AIInsight[]> {
  return supabase.getAIInsightsForClass(classId);
}

export async function getRecentSubmissionsForTeacher(
  teacherId: string,
  days = 7
): Promise<Array<Submission & { assignment?: Assignment; student?: Student }>> {
  return supabase.getRecentSubmissionsForTeacher(teacherId, days);
}

export async function getClassSubmissionStats(classId: string) {
  return supabase.getClassSubmissionStats(classId);
}

export async function getClassAnalytics(classId: string) {
  return supabase.getClassAnalytics(classId);
}

export async function detectRiskFlagsForTeacher(
  teacherId: string
): Promise<RiskFlag[]> {
  return supabase.detectRiskFlagsForTeacher(teacherId);
}

export async function getStudentForProfile(
  profile: Profile
): Promise<Student | null> {
  return supabase.getStudentForProfile(profile);
}

export async function riskFlagExists(id: string): Promise<boolean> {
  return supabase.riskFlagExists(id);
}

export async function getInstitutionStats(institutionId: string): Promise<{
  classCount: number;
  studentCount: number;
  teacherCount: number;
  assignmentCount: number;
}> {
  return supabase.getInstitutionStats(institutionId);
}
