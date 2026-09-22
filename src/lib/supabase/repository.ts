import { createClient ,createAdminClient} from "@/lib/supabase/server";
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

function mapProfile(row: Profile): Profile {
  return row;
}

function mapStudent(row: Student): Student {
  return row;
}

function mapAssignment(row: Assignment): Assignment {
  return row;
}

function mapSubmission(row: Submission): Submission {
  return row;
}

function mapGrade(row: Grade): Grade {
  return {
    ...row,
    score: Number(row.score),
    max_score: Number(row.max_score),
  };
}

export async function findProfileById(id: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapProfile(data);
}

export async function findProfileByEmail(email: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error || !data) return null;
  return mapProfile(data);
}

export async function findProfileByIdentityNumber(identityNumber: string): Promise<Profile | null> {
  const supabase = createClient();
  const normalizedIdentity = identityNumber.trim().replace(/\D/g, "");
  if (!normalizedIdentity) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("identity_number", normalizedIdentity)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST204" && error.message?.includes("identity_number")) {
      return null;
    }
    return null;
  }
  if (!data) return null;
  return mapProfile(data);
}

export async function findStudentByIdentityNumber(
  identityNumber: string
): Promise<Student | null> {
  const supabase = createAdminClient();

  if (!supabase) {
    console.error("Supabase admin client is not configured");
    return null;
  }

  const normalizedIdentity = identityNumber
    .trim()
    .replace(/\D/g, "");

  if (!normalizedIdentity) {
    return null;
  }

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("identity_number", normalizedIdentity)
    .maybeSingle();

  if (error) {
    return null;
  }

  if (!data) {
    return null;
  }

  return mapStudent(data);
}

export async function getClassesByTeacher(teacherId: string): Promise<Class[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("name");
  if (error || !data) return [];
  return data.sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export async function getClassesByInstitution(institutionId: string): Promise<Class[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("institution_id", institutionId)
    .order("name");
  if (error || !data) return [];
  return data.sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export async function getRecentClassesByTeacher(
  teacherId: string,
  limit: number
): Promise<Class[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data;
}

export async function getClassByIdForTeacher(
  classId: string,
  teacherId: string
): Promise<Class | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .eq("teacher_id", teacherId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function getClassById(classId: string): Promise<Class | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function addInstitution(
  institution: Institution
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("institutions").insert(institution);
  return !error;
}

export async function addProfile(profile: Profile): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("profiles").insert(profile);
  return !error;
}

export async function addClass(classItem: Class): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("classes").insert(classItem);
  return !error;
}

export async function countClassesByTeacher(teacherId: string): Promise<number> {
  const classes = await getClassesByTeacher(teacherId);
  return classes.length;
}

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  const supabase = createClient();
  let query = supabase.from("students").select("*");

  if (classId !== "__all__") {
    query = query.eq("class_id", classId);
  }

  const { data, error } = await query.order("name");
  if (error || !data) return [];
  return data.map(mapStudent).sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export async function getStudentById(studentId: string): Promise<Student | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();
  if (error || !data) return null;
  return mapStudent(data);
}

export async function addStudent(student: Student): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("students")
    .insert(student);

  if (error) {
    console.error("Student Creation Error Details:", {
      error,
      student,
    });

    return false;
  }

  return true;
}

export async function ensureStudentRecordForProfile(profile: Profile): Promise<Student | null> {
  const existingProfile = await findProfileById(profile.id);
  if (!existingProfile) return null;

  if (existingProfile.linked_student_id) {
    const linkedStudent = await getStudentById(existingProfile.linked_student_id);
    if (linkedStudent) {
      return linkedStudent;
    }

    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ linked_student_id: null, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
  }

  const normalizedIdentity = profile.identity_number?.trim().replace(/\D/g, "") ?? null;
  const normalizedName = profile.full_name.trim().toLowerCase();
  const normalizedEmail = profile.email.trim().toLowerCase();
  const existingStudents = await getStudentsByClass("__all__");

  const matchingStudent = existingStudents.find((student) => {
    if (student.institution_id !== profile.institution_id) return false;

    const normalizedStudentIdentity = student.identity_number?.trim().replace(/\D/g, "") ?? null;
    if (normalizedIdentity && normalizedStudentIdentity === normalizedIdentity) {
      return true;
    }
    if (normalizedEmail && student.email && student.email.trim().toLowerCase() === normalizedEmail) {
      return true;
    }
    return student.name.trim().toLowerCase() === normalizedName;
  });

  if (matchingStudent) {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        linked_student_id: matchingStudent.id,
        identity_number: existingProfile.identity_number ?? profile.identity_number ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    return matchingStudent;
  }

  const now = new Date().toISOString();
  let classItem = (await getClassesByInstitution(profile.institution_id))[0] ?? null;
  if (!classItem) {
    const newClass: Class = {
      id: crypto.randomUUID(),
      institution_id: profile.institution_id,
      name: "כיתה ראשית",
      teacher_id: profile.id,
      created_at: now,
      updated_at: now,
    };
    const created = await addClass(newClass);
    if (!created) return null;
    classItem = newClass;
  }

  const student: Student = {
    id: crypto.randomUUID(),
    class_id: classItem.id,
    institution_id: profile.institution_id,
    name: profile.full_name,
    email: profile.email,
    identity_number: profile.identity_number ?? null,
    status: "active",
    created_at: now,
    updated_at: now,
  };

  const inserted = await addStudent(student);
  if (!inserted) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ linked_student_id: student.id, updated_at: now })
    .eq("id", profile.id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return student;
  }

  return mapStudent(student);
}

export async function updateStudent(
  studentId: string,
  updates: Partial<Pick<Student, "name" | "status" | "email">>
): Promise<Student | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .update(updates)
    .eq("id", studentId)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return mapStudent(data);
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("students").delete().eq("id", studentId);
  return !error;
}

export async function getAssignmentsByClass(classId: string): Promise<Assignment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("class_id", classId)
    .order("due_date");
  if (error || !data) return [];
  return data.map(mapAssignment);
}

export async function getAssignmentsForTeacher(
  teacherId: string
): Promise<Assignment[]> {
  const classes = await getClassesByTeacher(teacherId);
  const classIds = classes.map((c) => c.id);
  if (classIds.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .in("class_id", classIds)
    .order("due_date");
  if (error || !data) return [];
  return data.map(mapAssignment);
}

export async function getActiveAssignmentsForTeacher(
  teacherId: string
): Promise<Assignment[]> {
  const now = new Date().toISOString();
  const assignments = await getAssignmentsForTeacher(teacherId);
  return assignments.filter((a) => a.due_date >= now);
}

export async function getSubmissionRateForTeacher(teacherId: string): Promise<number> {
  const classes = await getClassesByTeacher(teacherId);
  const classIds = classes.map((classItem) => classItem.id);
  if (classIds.length === 0) return 0;

  const assignments = await getAssignmentsForTeacher(teacherId);
  const students = await getStudentsForClasses(classIds);
  const totalPossible = students.length * assignments.length;
  if (totalPossible === 0 || assignments.length === 0) return 0;

  const supabase = createClient();
  const { data } = await supabase
    .from("submissions")
    .select("answer, attachment_urls")
    .in("assignment_id", assignments.map((assignment) => assignment.id));

  const submitted = (data ?? []).filter(
    (submission) => Boolean(submission.answer?.trim()) || (submission.attachment_urls?.length ?? 0) > 0
  ).length;
  return Math.round((submitted / totalPossible) * 100);
}

async function getSubmissionsForAssignments(assignmentIds: string[]): Promise<Submission[]> {
  if (assignmentIds.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .in("assignment_id", assignmentIds);
  if (error || !data) return [];
  return data.map(mapSubmission);
}

async function getStudentsForClasses(classIds: string[]): Promise<Student[]> {
  if (classIds.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .in("class_id", classIds);
  if (error || !data) return [];
  return data.map(mapStudent);
}

export async function getAssignmentById(
  assignmentId: string
): Promise<Assignment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", assignmentId)
    .maybeSingle();
  if (error || !data) return null;
  return mapAssignment(data);
}

export async function addAssignment(assignment: Assignment): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("assignments").insert(assignment);
  return !error;
}

export async function updateAssignment(
  assignmentId: string,
  updates: Partial<
    Pick<Assignment, "name" | "description" | "due_date" | "difficulty" | "type">
  >
): Promise<Assignment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assignments")
    .update(updates)
    .eq("id", assignmentId)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return mapAssignment(data);
}

export async function deleteAssignment(assignmentId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", assignmentId);
  return !error;
}

export async function getSubmissionsByAssignment(
  assignmentId: string
): Promise<Submission[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignment_id", assignmentId);
  if (error || !data) return [];
  return data.map(mapSubmission);
}

export async function getSubmissionByStudentAndAssignment(
  studentId: string,
  assignmentId: string
): Promise<Submission | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("student_id", studentId)
    .eq("assignment_id", assignmentId)
    .maybeSingle();
  if (error || !data) return null;
  return mapSubmission(data);
}

export async function getSubmissionById(
  submissionId: string
): Promise<Submission | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();
  if (error || !data) return null;
  return mapSubmission(data);
}

export async function upsertSubmission(submission: Submission): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("submissions").upsert(submission, {
    onConflict: "assignment_id,student_id",
  });
  return !error;
}

export async function getGradesByStudent(studentId: string): Promise<Grade[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("grades")
    .select("*")
    .eq("student_id", studentId)
    .order("graded_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapGrade);
}

export async function getGradeBySubmission(
  submissionId: string
): Promise<Grade | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("grades")
    .select("*")
    .eq("submission_id", submissionId)
    .maybeSingle();
  if (error || !data) return null;
  return mapGrade(data);
}

export async function upsertGrade(grade: Grade): Promise<Grade | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("grades")
    .upsert(grade, { onConflict: "submission_id" })
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return mapGrade(data);
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: Submission["status"]
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("submissions")
    .update({ status })
    .eq("id", submissionId);
  return !error;
}

export async function calculateStudentAverage(studentId: string): Promise<number> {
  const grades = await getGradesByStudent(studentId);
  if (grades.length === 0) return 0;
  const total = grades.reduce((sum, g) => sum + g.score, 0);
  return Math.round((total / (grades.length * 100)) * 100);
}

export async function getRiskFlagsByStudent(
  studentId: string
): Promise<RiskFlag[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("risk_flags")
    .select("*")
    .eq("student_id", studentId);
  if (error || !data) return [];
  return data;
}

export async function getAtRiskStudentsForTeacher(
  teacherId: string
): Promise<Student[]> {
  const classes = await getClassesByTeacher(teacherId);
  const classIds = classes.map((c) => c.id);
  if (classIds.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .in("class_id", classIds)
    .eq("status", "at_risk");
  if (error || !data) return [];
  return data.map(mapStudent);
}

export async function addRiskFlag(flag: RiskFlag): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("risk_flags").insert(flag);
  return !error;
}

export async function getAIInsightsForClass(classId: string): Promise<AIInsight[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("class_id", classId);
  if (error || !data) return [];
  return data;
}

export async function getRecentSubmissionsForTeacher(
  teacherId: string,
  days = 7
): Promise<Array<Submission & { assignment?: Assignment; student?: Student }>> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const assignments = await getAssignmentsForTeacher(teacherId);
  const assignmentIds = assignments.map((a) => a.id);
  if (assignmentIds.length === 0) return [];

  const submissions = await getSubmissionsForAssignments(assignmentIds);

  const results: Array<Submission & { assignment?: Assignment; student?: Student }> =
    [];
  const students = await getStudentsForClasses(
    assignments.map((assignment) => assignment.class_id)
  );
  const studentsById = new Map(students.map((student) => [student.id, student]));

  for (const submission of submissions) {
    const submittedAt = submission.submitted_at || submission.created_at;
    if (
      new Date(submittedAt).getTime() < cutoff ||
      (!submission.answer.trim() && (submission.attachment_urls?.length ?? 0) === 0)
    ) {
      continue;
    }
    results.push({
      ...submission,
      assignment: assignments.find((a) => a.id === submission.assignment_id),
      student: studentsById.get(submission.student_id),
    });
  }

  return results.sort(
    (a, b) =>
      new Date(b.submitted_at || b.created_at).getTime() -
      new Date(a.submitted_at || a.created_at).getTime()
  );
}

export async function getClassSubmissionStats(classId: string): Promise<{
  totalStudents: number;
  assignmentStats: Array<{
    assignment: Assignment;
    submitted: number;
    total: number;
  }>;
}> {
  const students = await getStudentsByClass(classId);
  const assignments = await getAssignmentsByClass(classId);
  const submissions = await getSubmissionsForAssignments(assignments.map((assignment) => assignment.id));
  const submissionsByAssignment = new Map<string, Submission[]>();
  for (const submission of submissions) {
    const assignmentSubmissions = submissionsByAssignment.get(submission.assignment_id) ?? [];
    assignmentSubmissions.push(submission);
    submissionsByAssignment.set(submission.assignment_id, assignmentSubmissions);
  }
  const stats = assignments.map((assignment) => ({
    assignment,
    submitted: (submissionsByAssignment.get(assignment.id) ?? []).filter(
      (submission) => Boolean(submission.answer.trim()) || (submission.attachment_urls?.length ?? 0) > 0
    ).length,
    total: students.length,
  }));
  return { totalStudents: students.length, assignmentStats: stats };
}

export async function getClassAnalytics(classId: string): Promise<{
  averageGrade: number;
  submissionRate: number;
  atRiskCount: number;
  studentCount: number;
}> {
  const students = await getStudentsByClass(classId);
  const assignments = await getAssignmentsByClass(classId);
  const studentIds = students.map((s) => s.id);

  const supabase = createClient();
  const { data: gradesData } = await supabase
    .from("grades")
    .select("*")
    .in("student_id", studentIds.length > 0 ? studentIds : ["00000000-0000-0000-0000-000000000000"]);
  const grades = (gradesData ?? []).map(mapGrade);

  const averageGrade =
    grades.length > 0
      ? Math.round(grades.reduce((s, g) => s + g.score, 0) / grades.length)
      : 0;

  const totalPossible = students.length * assignments.length;
  const submissions = await getSubmissionsForAssignments(assignments.map((assignment) => assignment.id));
  const totalSubmitted = submissions.filter(
    (submission) => Boolean(submission.answer.trim()) || (submission.attachment_urls?.length ?? 0) > 0
  ).length;

  return {
    averageGrade,
    submissionRate:
      totalPossible > 0 ? Math.round((totalSubmitted / totalPossible) * 100) : 0,
    atRiskCount: students.filter((s) => s.status === "at_risk").length,
    studentCount: students.length,
  };
}

export async function detectRiskFlagsForTeacher(
  teacherId: string
): Promise<RiskFlag[]> {
  const newFlags: RiskFlag[] = [];
  const classes = await getClassesByTeacher(teacherId);

  for (const classItem of classes) {
    const students = await getStudentsByClass(classItem.id);
    for (const student of students) {
      const avg = await calculateStudentAverage(student.id);
      const assignments = await getAssignmentsByClass(classItem.id);
      const missing = (
        await Promise.all(
          assignments.map(async (a) => {
            const sub = await getSubmissionByStudentAndAssignment(student.id, a.id);
            return sub?.answer?.trim() ? null : a;
          })
        )
      ).filter((a): a is Assignment => a !== null);

      if (avg > 0 && avg < 60) {
        newFlags.push({
          id: crypto.randomUUID(),
          student_id: student.id,
          class_id: classItem.id,
          institution_id: classItem.institution_id,
          flag_type: "low_grades",
          severity: "high",
          description: `ממוצע ציונים נמוך: ${avg}%`,
          flagged_at: new Date().toISOString(),
          resolved: false,
        });
        await updateStudent(student.id, { status: "at_risk" });
      }

      if (missing.length >= 2) {
        newFlags.push({
          id: crypto.randomUUID(),
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

export async function getStudentForProfile(
  profile: Profile
): Promise<Student | null> {
  if (!profile.linked_student_id) return null;
  return getStudentById(profile.linked_student_id);
}

export async function riskFlagExists(id: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("risk_flags")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  return Boolean(data);
}

export async function getInstitutionStats(institutionId: string): Promise<{
  classCount: number;
  studentCount: number;
  teacherCount: number;
  assignmentCount: number;
}> {
  const supabase = createClient();
  const [
    { count: classCount },
    { count: studentCount },
    { count: teacherCount },
    { count: assignmentCount },
  ] = await Promise.all([
    supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", institutionId),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", institutionId),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", institutionId)
      .eq("role", "teacher"),
    supabase
      .from("assignments")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", institutionId),
  ]);

  return {
    classCount: classCount ?? 0,
    studentCount: studentCount ?? 0,
    teacherCount: teacherCount ?? 0,
    assignmentCount: assignmentCount ?? 0,
  };
}
