import type { Class, Institution, Profile, Student, Assignment, Submission, Grade, RiskFlag } from "@/types/database";
import { createSeedStore, type DemoStore } from "./seed";

const STORE_KEY = Symbol.for("classflow.demo.store");

function getGlobalStore(): DemoStore {
  const globalStore = globalThis as typeof globalThis & {
    [STORE_KEY]?: DemoStore;
  };

  if (!globalStore[STORE_KEY]) {
    globalStore[STORE_KEY] = createSeedStore();
  }

  return globalStore[STORE_KEY];
}

export function getStore(): DemoStore {
  return getGlobalStore();
}

export function findProfileById(id: string): Profile | undefined {
  return getStore().profiles.find((profile) => profile.id === id);
}

export function findProfileByEmail(email: string): Profile | undefined {
  const normalized = email.trim().toLowerCase();
  return getStore().profiles.find((profile) => profile.email === normalized);
}

export function getClassesByTeacher(teacherId: string): Class[] {
  return getStore()
    .classes.filter((classItem) => classItem.teacher_id === teacherId)
    .sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export function getRecentClassesByTeacher(
  teacherId: string,
  limit: number
): Class[] {
  return getStore()
    .classes.filter((classItem) => classItem.teacher_id === teacherId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
}

export function getClassByIdForTeacher(
  classId: string,
  teacherId: string
): Class | undefined {
  return getStore().classes.find(
    (classItem) => classItem.id === classId && classItem.teacher_id === teacherId
  );
}

export function addInstitution(institution: Institution): void {
  getStore().institutions.push(institution);
}

export function addProfile(profile: Profile): void {
  getStore().profiles.push(profile);
}

export function addClass(classItem: Class): void {
  getStore().classes.push(classItem);
}

export function setProfilePassword(profileId: string, password: string): void {
  getStore().passwords[profileId] = password;
}

export function verifyProfilePassword(
  profileId: string,
  password: string
): boolean {
  return getStore().passwords[profileId] === password;
}

export function countClassesByTeacher(teacherId: string): number {
  return getStore().classes.filter(
    (classItem) => classItem.teacher_id === teacherId
  ).length;
}

// Student functions
export function getStudentsByClass(classId: string): Student[] {
  return getStore()
    .students.filter((student) => student.class_id === classId)
    .sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export function getStudentById(studentId: string): Student | undefined {
  return getStore().students.find((student) => student.id === studentId);
}

export function addStudent(student: Student): void {
  getStore().students.push(student);
}

// Assignment functions
export function getAssignmentsByClass(classId: string): Assignment[] {
  return getStore()
    .assignments.filter((assignment) => assignment.class_id === classId)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
}

export function getAssignmentById(assignmentId: string): Assignment | undefined {
  return getStore().assignments.find((assignment) => assignment.id === assignmentId);
}

export function addAssignment(assignment: Assignment): void {
  getStore().assignments.push(assignment);
}

// Submission functions
export function getSubmissionsByAssignment(assignmentId: string): Submission[] {
  return getStore().submissions.filter(
    (submission) => submission.assignment_id === assignmentId
  );
}

export function getSubmissionByStudentAndAssignment(
  studentId: string,
  assignmentId: string
): Submission | undefined {
  return getStore().submissions.find(
    (submission) =>
      submission.student_id === studentId &&
      submission.assignment_id === assignmentId
  );
}

export function addSubmission(submission: Submission): void {
  getStore().submissions.push(submission);
}

// Grade functions
export function getGradesByStudent(studentId: string): Grade[] {
  return getStore()
    .grades.filter((grade) => grade.student_id === studentId)
    .sort((a, b) => new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime());
}

export function getGradeBySubmission(submissionId: string): Grade | undefined {
  return getStore().grades.find((grade) => grade.submission_id === submissionId);
}

export function addGrade(grade: Grade): void {
  getStore().grades.push(grade);
}

export function calculateStudentAverage(studentId: string): number {
  const grades = getGradesByStudent(studentId);
  if (grades.length === 0) return 0;
  const total = grades.reduce((sum, grade) => sum + grade.score, 0);
  return Math.round((total / (grades.length * 100)) * 100) / 100;
}

// Risk flag functions
export function getRiskFlagsByStudent(studentId: string): RiskFlag[] {
  return getStore().riskFlags.filter((flag) => flag.student_id === studentId);
}

export function addRiskFlag(flag: RiskFlag): void {
  getStore().riskFlags.push(flag);
}
