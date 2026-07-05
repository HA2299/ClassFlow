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
import {
  DEMO_PASSWORD,
  DEMO_STUDENT_EMAIL,
  DEMO_STUDENT_PROFILE_ID,
  DEMO_TEACHER_EMAIL,
  DEMO_TEACHER_ID,
} from "./constants";
import {
  createSeedStore,
  seedStudentProfile,
  seedTeacher,
  type DemoStore,
} from "./seed";

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

export function replaceStore(store: DemoStore): void {
  const globalStore = globalThis as typeof globalThis & {
    [STORE_KEY]?: DemoStore;
  };
  globalStore[STORE_KEY] = store;
}

export function getStore(): DemoStore {
  return getGlobalStore();
}

export function findProfileById(id: string): Profile | undefined {
  const profile = getStore().profiles.find((item) => item.id === id);
  if (profile) return profile;
  if (id === DEMO_TEACHER_ID) return structuredClone(seedTeacher);
  if (id === DEMO_STUDENT_PROFILE_ID) return structuredClone(seedStudentProfile);
  return undefined;
}

export function findProfileByEmail(email: string): Profile | undefined {
  const normalized = email.trim().toLowerCase();
  if (normalized === DEMO_TEACHER_EMAIL) return structuredClone(seedTeacher);
  if (normalized === DEMO_STUDENT_EMAIL) return structuredClone(seedStudentProfile);
  return getStore().profiles.find((profile) => profile.email === normalized);
}

export function verifyProfilePassword(
  profileId: string,
  password: string
): boolean {
  if (
    (profileId === DEMO_TEACHER_ID || profileId === DEMO_STUDENT_PROFILE_ID) &&
    password === DEMO_PASSWORD
  ) {
    return true;
  }
  return getStore().passwords[profileId] === password;
}

export function getStudentForProfile(profile: Profile): Student | undefined {
  if (!profile.linked_student_id) return undefined;
  return getStudentById(profile.linked_student_id);
}

export function getClassesByTeacher(teacherId: string): Class[] {
  return getStore()
    .classes.filter((c) => c.teacher_id === teacherId)
    .sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export function getRecentClassesByTeacher(teacherId: string, limit: number): Class[] {
  return getStore()
    .classes.filter((c) => c.teacher_id === teacherId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function getClassByIdForTeacher(
  classId: string,
  teacherId: string
): Class | undefined {
  return getStore().classes.find(
    (c) => c.id === classId && c.teacher_id === teacherId
  );
}

export function getClassById(classId: string): Class | undefined {
  return getStore().classes.find((c) => c.id === classId);
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

export function countClassesByTeacher(teacherId: string): number {
  return getStore().classes.filter((c) => c.teacher_id === teacherId).length;
}

export function getStudentsByClass(classId: string): Student[] {
  return getStore()
    .students.filter((s) => s.class_id === classId)
    .sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export function getStudentById(studentId: string): Student | undefined {
  return getStore().students.find((s) => s.id === studentId);
}

export function addStudent(student: Student): void {
  getStore().students.push(student);
}

export function updateStudent(
  studentId: string,
  updates: Partial<Pick<Student, "name" | "status" | "email">>
): Student | undefined {
  const student = getStudentById(studentId);
  if (!student) return undefined;
  Object.assign(student, updates, { updated_at: new Date().toISOString() });
  return student;
}

export function deleteStudent(studentId: string): boolean {
  const store = getStore();
  const idx = store.students.findIndex((s) => s.id === studentId);
  if (idx === -1) return false;
  store.students.splice(idx, 1);
  store.submissions = store.submissions.filter((s) => s.student_id !== studentId);
  store.grades = store.grades.filter((g) => g.student_id !== studentId);
  store.riskFlags = store.riskFlags.filter((f) => f.student_id !== studentId);
  return true;
}

export function getAssignmentsByClass(classId: string): Assignment[] {
  return getStore()
    .assignments.filter((a) => a.class_id === classId)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
}

export function getAssignmentsForTeacher(teacherId: string): Assignment[] {
  const classIds = new Set(getClassesByTeacher(teacherId).map((c) => c.id));
  return getStore()
    .assignments.filter((a) => classIds.has(a.class_id))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
}

export function getActiveAssignmentsForTeacher(teacherId: string): Assignment[] {
  const now = Date.now();
  return getAssignmentsForTeacher(teacherId).filter(
    (a) => new Date(a.due_date).getTime() >= now
  );
}

export function getAssignmentById(assignmentId: string): Assignment | undefined {
  return getStore().assignments.find((a) => a.id === assignmentId);
}

export function addAssignment(assignment: Assignment): void {
  getStore().assignments.push(assignment);
}

export function updateAssignment(
  assignmentId: string,
  updates: Partial<
    Pick<
      Assignment,
      "name" | "description" | "due_date" | "difficulty" | "type"
    >
  >
): Assignment | undefined {
  const assignment = getAssignmentById(assignmentId);
  if (!assignment) return undefined;
  Object.assign(assignment, updates, { updated_at: new Date().toISOString() });
  return assignment;
}

export function deleteAssignment(assignmentId: string): boolean {
  const store = getStore();
  const idx = store.assignments.findIndex((a) => a.id === assignmentId);
  if (idx === -1) return false;
  store.assignments.splice(idx, 1);
  store.submissions = store.submissions.filter((s) => s.assignment_id !== assignmentId);
  store.grades = store.grades.filter((g) => g.assignment_id !== assignmentId);
  return true;
}

export function getSubmissionsByAssignment(assignmentId: string): Submission[] {
  return getStore().submissions.filter((s) => s.assignment_id === assignmentId);
}

export function getSubmissionByStudentAndAssignment(
  studentId: string,
  assignmentId: string
): Submission | undefined {
  return getStore().submissions.find(
    (s) => s.student_id === studentId && s.assignment_id === assignmentId
  );
}

export function getRecentSubmissionsForTeacher(
  teacherId: string,
  days = 7
): Array<Submission & { assignment?: Assignment; student?: Student }> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const classIds = new Set(getClassesByTeacher(teacherId).map((c) => c.id));
  const assignmentIds = new Set(
    getStore()
      .assignments.filter((a) => classIds.has(a.class_id))
      .map((a) => a.id)
  );

  return getStore()
    .submissions.filter((s) => {
      if (!assignmentIds.has(s.assignment_id)) return false;
      const t = new Date(s.submitted_at || s.created_at).getTime();
      return t >= cutoff && Boolean(s.answer?.trim());
    })
    .sort(
      (a, b) =>
        new Date(b.submitted_at || b.created_at).getTime() -
        new Date(a.submitted_at || a.created_at).getTime()
    )
    .map((s) => ({
      ...s,
      assignment: getAssignmentById(s.assignment_id),
      student: getStudentById(s.student_id),
    }));
}

export function getSubmissionById(submissionId: string): Submission | undefined {
  return getStore().submissions.find((s) => s.id === submissionId);
}

export function addSubmission(submission: Submission): void {
  getStore().submissions.push(submission);
}

export function getGradesByStudent(studentId: string): Grade[] {
  return getStore()
    .grades.filter((g) => g.student_id === studentId)
    .sort((a, b) => new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime());
}

export function getGradeBySubmission(submissionId: string): Grade | undefined {
  return getStore().grades.find((g) => g.submission_id === submissionId);
}

export function addGrade(grade: Grade): void {
  getStore().grades.push(grade);
}

export function upsertGrade(grade: Grade): Grade {
  const store = getStore();
  const idx = store.grades.findIndex((g) => g.submission_id === grade.submission_id);
  if (idx >= 0) {
    store.grades[idx] = grade;
    return grade;
  }
  store.grades.push(grade);
  return grade;
}

export function calculateStudentAverage(studentId: string): number {
  const grades = getGradesByStudent(studentId);
  if (grades.length === 0) return 0;
  const total = grades.reduce((sum, g) => sum + g.score, 0);
  return Math.round((total / (grades.length * 100)) * 100);
}

export function getRiskFlagsByStudent(studentId: string): RiskFlag[] {
  return getStore().riskFlags.filter((f) => f.student_id === studentId);
}

export function getAtRiskStudentsForTeacher(teacherId: string): Student[] {
  const classIds = getClassesByTeacher(teacherId).map((c) => c.id);
  return getStore().students.filter(
    (s) => classIds.includes(s.class_id) && s.status === "at_risk"
  );
}

export function addRiskFlag(flag: RiskFlag): void {
  getStore().riskFlags.push(flag);
}

export function getAIInsightsForClass(classId: string): AIInsight[] {
  return getStore().aiInsights.filter((i) => i.class_id === classId);
}

export function getClassSubmissionStats(classId: string): {
  totalStudents: number;
  assignmentStats: Array<{
    assignment: Assignment;
    submitted: number;
    total: number;
  }>;
} {
  const students = getStudentsByClass(classId);
  const assignments = getAssignmentsByClass(classId);
  return {
    totalStudents: students.length,
    assignmentStats: assignments.map((assignment) => {
      const submitted = getSubmissionsByAssignment(assignment.id).filter(
        (s) => s.answer?.trim()
      ).length;
      return { assignment, submitted, total: students.length };
    }),
  };
}

export function getClassAnalytics(classId: string): {
  averageGrade: number;
  submissionRate: number;
  atRiskCount: number;
  studentCount: number;
} {
  const students = getStudentsByClass(classId);
  const assignments = getAssignmentsByClass(classId);
  const grades = getStore().grades.filter((g) =>
    students.some((s) => s.id === g.student_id)
  );
  const averageGrade =
    grades.length > 0
      ? Math.round(grades.reduce((s, g) => s + g.score, 0) / grades.length)
      : 0;

  let totalPossible = students.length * assignments.length;
  let totalSubmitted = 0;
  for (const a of assignments) {
    totalSubmitted += getSubmissionsByAssignment(a.id).filter((s) =>
      s.answer?.trim()
    ).length;
  }

  return {
    averageGrade,
    submissionRate:
      totalPossible > 0 ? Math.round((totalSubmitted / totalPossible) * 100) : 0,
    atRiskCount: students.filter((s) => s.status === "at_risk").length,
    studentCount: students.length,
  };
}

export function detectRiskFlagsForTeacher(teacherId: string): RiskFlag[] {
  const newFlags: RiskFlag[] = [];
  const classes = getClassesByTeacher(teacherId);

  for (const classItem of classes) {
    const students = getStudentsByClass(classItem.id);
    for (const student of students) {
      const avg = calculateStudentAverage(student.id);
      const assignments = getAssignmentsByClass(classItem.id);
      const missing = assignments.filter(
        (a) => !getSubmissionByStudentAndAssignment(student.id, a.id)?.answer?.trim()
      );

      if (avg > 0 && avg < 60) {
        newFlags.push({
          id: `auto-risk-${student.id}-grades`,
          student_id: student.id,
          class_id: classItem.id,
          institution_id: classItem.institution_id,
          flag_type: "low_grades",
          severity: "high",
          description: `ממוצע ציונים נמוך: ${avg}%`,
          flagged_at: new Date().toISOString(),
          resolved: false,
        });
        updateStudent(student.id, { status: "at_risk" });
      }

      if (missing.length >= 2) {
        newFlags.push({
          id: `auto-risk-${student.id}-missing`,
          student_id: student.id,
          class_id: classItem.id,
          institution_id: classItem.institution_id,
          flag_type: "missing_submissions",
          severity: "medium",
          description: `${missing.length} משימות לא הוגשו`,
          flagged_at: new Date().toISOString(),
          resolved: false,
        });
      }
    }
  }

  return newFlags;
}
