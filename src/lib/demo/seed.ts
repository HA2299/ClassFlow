import type { Class, Institution, Profile, Student, Assignment, Submission, Grade, RiskFlag } from "@/types/database";
import {
  DEMO_CLASS_A_ID,
  DEMO_CLASS_B_ID,
  DEMO_CLASS_C_ID,
  DEMO_INSTITUTION_ID,
  DEMO_TEACHER_EMAIL,
  DEMO_TEACHER_ID,
  DEMO_PASSWORD,
} from "./constants";

const now = "2026-01-15T10:00:00.000Z";
const weekAgo = "2026-01-08T10:00:00.000Z";
const twoWeeksAgo = "2026-01-01T10:00:00.000Z";

export const seedInstitution: Institution = {
  id: DEMO_INSTITUTION_ID,
  name: "בית ספר הדגמה",
  created_at: twoWeeksAgo,
};

export const seedTeacher: Profile = {
  id: DEMO_TEACHER_ID,
  institution_id: DEMO_INSTITUTION_ID,
  role: "teacher",
  full_name: "שרה לוי",
  email: DEMO_TEACHER_EMAIL,
  created_at: twoWeeksAgo,
  updated_at: now,
};

export const seedClasses: Class[] = [
  {
    id: DEMO_CLASS_A_ID,
    institution_id: DEMO_INSTITUTION_ID,
    name: "כיתה א׳",
    teacher_id: DEMO_TEACHER_ID,
    created_at: weekAgo,
    updated_at: now,
  },
  {
    id: DEMO_CLASS_B_ID,
    institution_id: DEMO_INSTITUTION_ID,
    name: "כיתה ב׳",
    teacher_id: DEMO_TEACHER_ID,
    created_at: weekAgo,
    updated_at: now,
  },
  {
    id: DEMO_CLASS_C_ID,
    institution_id: DEMO_INSTITUTION_ID,
    name: "מתמטיקה מתקדמת",
    teacher_id: DEMO_TEACHER_ID,
    created_at: twoWeeksAgo,
    updated_at: weekAgo,
  },
];

// Student seeds
const DEMO_STUDENTS = [
  // Class A
  { id: "student-1", name: "אלעד כהן", class_id: DEMO_CLASS_A_ID },
  { id: "student-2", name: "נועה רוזנברג", class_id: DEMO_CLASS_A_ID },
  { id: "student-3", name: "יונתן מזרחי", class_id: DEMO_CLASS_A_ID },
  { id: "student-4", name: "ליאור גולדשטיין", class_id: DEMO_CLASS_A_ID },
  // Class B
  { id: "student-5", name: "שלומי בר", class_id: DEMO_CLASS_B_ID },
  { id: "student-6", name: "יום טוב", class_id: DEMO_CLASS_B_ID },
  { id: "student-7", name: "רות מנדלביץ'", class_id: DEMO_CLASS_B_ID },
];

export const seedStudents: Student[] = DEMO_STUDENTS.map((s) => ({
  id: s.id,
  class_id: s.class_id,
  institution_id: DEMO_INSTITUTION_ID,
  name: s.name,
  email: undefined,
  status: s.id === "student-4" ? "at_risk" : "active",
  created_at: weekAgo,
  updated_at: now,
}));

// Assignment seeds
export const seedAssignments: Assignment[] = [
  {
    id: "assignment-1",
    class_id: DEMO_CLASS_A_ID,
    institution_id: DEMO_INSTITUTION_ID,
    name: "שיעורי בית: משוואות ממדרגה ראשונה",
    description: "פתרו 20 משוואות",
    due_date: "2026-01-20T23:59:59.000Z",
    difficulty: "easy",
    type: "homework",
    created_at: weekAgo,
    updated_at: now,
  },
  {
    id: "assignment-2",
    class_id: DEMO_CLASS_A_ID,
    institution_id: DEMO_INSTITUTION_ID,
    name: "בחינה קטנה: גיאומטריה",
    description: "בחינה בנושא משולשים",
    due_date: "2026-01-22T23:59:59.000Z",
    difficulty: "medium",
    type: "quiz",
    created_at: twoWeeksAgo,
    updated_at: weekAgo,
  },
];

// Submission seeds
export const seedSubmissions: Submission[] = [
  {
    id: "submission-1",
    assignment_id: "assignment-1",
    student_id: "student-1",
    institution_id: DEMO_INSTITUTION_ID,
    answer: "פתרתי את כל המשוואות",
    submitted_at: "2026-01-19T15:30:00.000Z",
    status: "graded",
    created_at: "2026-01-19T15:30:00.000Z",
  },
  {
    id: "submission-2",
    assignment_id: "assignment-1",
    student_id: "student-2",
    institution_id: DEMO_INSTITUTION_ID,
    answer: "פתרתי 18 משוואות",
    submitted_at: "2026-01-19T10:00:00.000Z",
    status: "graded",
    created_at: "2026-01-19T10:00:00.000Z",
  },
  {
    id: "submission-3",
    assignment_id: "assignment-1",
    student_id: "student-4",
    institution_id: DEMO_INSTITUTION_ID,
    answer: "",
    submitted_at: "",
    status: "submitted",
    created_at: now,
  },
];

// Grade seeds
export const seedGrades: Grade[] = [
  {
    id: "grade-1",
    submission_id: "submission-1",
    student_id: "student-1",
    assignment_id: "assignment-1",
    institution_id: DEMO_INSTITUTION_ID,
    score: 100,
    max_score: 100,
    feedback: "מעולה! פתרון נכון ונקי",
    graded_at: "2026-01-19T18:00:00.000Z",
    graded_by: DEMO_TEACHER_ID,
    created_at: "2026-01-19T18:00:00.000Z",
  },
  {
    id: "grade-2",
    submission_id: "submission-2",
    student_id: "student-2",
    assignment_id: "assignment-1",
    institution_id: DEMO_INSTITUTION_ID,
    score: 90,
    max_score: 100,
    feedback: "טוב מאוד, אבל חיברתם 2 משוואות שלא נכונות",
    graded_at: "2026-01-19T18:30:00.000Z",
    graded_by: DEMO_TEACHER_ID,
    created_at: "2026-01-19T18:30:00.000Z",
  },
];

// Risk flags
export const seedRiskFlags: RiskFlag[] = [
  {
    id: "risk-1",
    student_id: "student-4",
    class_id: DEMO_CLASS_A_ID,
    institution_id: DEMO_INSTITUTION_ID,
    flag_type: "missing_submissions",
    severity: "high",
    description: "לא הגיש את המשימה האחרונה",
    flagged_at: now,
    resolved: false,
  },
];

export interface DemoStore {
  institutions: Institution[];
  profiles: Profile[];
  classes: Class[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  grades: Grade[];
  riskFlags: RiskFlag[];
  passwords: Record<string, string>;
}

export function createSeedStore(): DemoStore {
  return {
    institutions: [structuredClone(seedInstitution)],
    profiles: [structuredClone(seedTeacher)],
    classes: structuredClone(seedClasses),
    students: structuredClone(seedStudents),
    assignments: structuredClone(seedAssignments),
    submissions: structuredClone(seedSubmissions),
    grades: structuredClone(seedGrades),
    riskFlags: structuredClone(seedRiskFlags),
    passwords: { [DEMO_TEACHER_ID]: DEMO_PASSWORD },
  };
}
