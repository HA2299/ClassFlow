"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Class, Student, Grade, Assignment, Submission, RiskFlag, UserRole } from "@/types/database";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  addClass,
  addStudent,
  addAssignment,
  countClassesByTeacher,
  ensureStudentRecordForProfile,
  findProfileByEmail,
  findProfileByIdentityNumber,
  findStudentByIdentityNumber,
  getClassByIdForTeacher,
  getClassById,
  getClassesByTeacher,
  getRecentClassesByTeacher,
  getStudentsByClass,
  getStudentById,
  getGradesByStudent,
  calculateStudentAverage,
  getRiskFlagsByStudent,
  getAssignmentsByClass,
  getAssignmentById,
  getSubmissionsByAssignment,
  getSubmissionByStudentAndAssignment,
  upsertSubmission,
} from "@/lib/data/store";
import {
  notifyStudentsAboutAssignment,
  notifyTeacherAboutSubmission,
  sendNewAssignmentEmailsToClass,
} from "@/app/actions/notifications";

export type AuthActionState = {
  error?: string;
  success?: string;
  sent?: number;
  skipped?: number;
};

const SUBMISSION_BUCKET_NAME = "submission-files";
const SUBMISSION_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
] as const;

function generateId(): string {
  return crypto.randomUUID();
}

function timestamp(): string {
  return new Date().toISOString();
}

async function ensureSubmissionBucket(adminClient: NonNullable<ReturnType<typeof createAdminClient>>) {
  const bucketResponse = await adminClient.storage.getBucket(SUBMISSION_BUCKET_NAME);
  const bucketMissing =
    Boolean(bucketResponse.error) &&
    typeof (bucketResponse.error as { statusCode?: number } | null)?.statusCode === "number" &&
    (bucketResponse.error as { statusCode?: number }).statusCode === 404;

  if (bucketMissing) {
    const createdBucket = await adminClient.storage.createBucket(SUBMISSION_BUCKET_NAME, {
      public: false,
      allowedMimeTypes: [...SUBMISSION_ALLOWED_MIME_TYPES],
      fileSizeLimit: "20MB",
    });

    if (createdBucket.error) {
      throw new Error(createdBucket.error.message || "לא ניתן ליצור bucket לקבצי הגשה");
    }

    return;
  }

  if (bucketResponse.data && bucketResponse.data.public === true) {
    const updatedBucket = await adminClient.storage.updateBucket(SUBMISSION_BUCKET_NAME, { public: false });
    if (updatedBucket.error) {
      throw new Error(updatedBucket.error.message || "לא ניתן להפוך את ה-bucket לפרטי");
    }

    return;
  }

  if (bucketResponse.error) {
    throw new Error(bucketResponse.error.message || "לא ניתן לגשת ל-bucket של הקבצים");
  }
}

async function uploadSubmissionFiles({
  assignmentId,
  studentId,
  institutionId,
  files,
}: {
  assignmentId: string;
  studentId: string;
  institutionId: string;
  files: File[];
}): Promise<{ paths: string[]; names: string[] }> {
  const adminClient = createAdminClient();

  if (!adminClient) {
    throw new Error("לא הוגדר Supabase Storage. הוסף SUPABASE_SERVICE_ROLE_KEY לסביבה.");
  }

  await ensureSubmissionBucket(adminClient);

  const paths: string[] = [];
  const names: string[] = [];

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectPath = `${institutionId}/${assignmentId}/${studentId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    const { data, error } = await adminClient.storage.from(SUBMISSION_BUCKET_NAME).upload(objectPath, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

    if (error || !data) {
      throw new Error(error?.message || "העלאת הקובץ נכשלה");
    }

    paths.push(data.path);
    names.push(file.name);
  }

  return { paths, names };
}

function getSiteUrl(): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.trim() ?? process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

function normalizeIdentityNumber(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const digits = value.trim().replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

async function createTeacherProfileForUser({
  institutionName,
  fullName,
  email,
  userId,
  role = "teacher",
  identityNumber,
}: {
  institutionName: string;
  fullName: string;
  email: string;
  userId?: string;
  role?: "teacher" | "student";
  identityNumber?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const normalizedEmail = email.trim().toLowerCase();

  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      return {
        ok: false,
        error: userError?.message || "לא ניתן לאמת את המשתמש",
      };
    }

    resolvedUserId = user.id;
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!existingProfileError && existingProfile) {
    return { ok: true };
  }

  const createdAt = timestamp();
  const institutionId = generateId();

  const { error: institutionError } = await supabase.from("institutions").insert({
    id: institutionId,
    name: institutionName,
    created_at: createdAt,
  });

  if (institutionError) {
    console.error("Institution Creation Error Details:", institutionError);
    return { ok: false, error: institutionError.message };
  }

const profilePayload: {
  id: string;
  institution_id: string;
  role: UserRole;
  full_name: string;
  email: string;
  identity_number?: string | null;
  created_at: string;
  updated_at: string;
} = {
  id: resolvedUserId,
  institution_id: institutionId,
  role,
  full_name: fullName,
  email: normalizedEmail,
  created_at: createdAt,
  updated_at: createdAt,
};

  if (identityNumber !== null) {
    profilePayload.identity_number = identityNumber;
  }

  let { error: profileError } = await supabase.from("profiles").insert(profilePayload);

  if (
    profileError &&
    profileError.code === "PGRST204" &&
    profileError.message?.includes("identity_number")
  ) {
    delete profilePayload.identity_number;
    const retry = await supabase.from("profiles").insert(profilePayload);
    profileError = retry.error;
  }

  if (profileError) {
    console.error("Profile Creation Error Details:", profileError);
    return { ok: false, error: profileError.message };
  }

  return { ok: true };
}

async function createStudentProfileForExistingStudent({
  institutionId,
  studentId,
  fullName,
  email,
  userId,
  identityNumber,
}: {
  institutionId: string;
  studentId: string;
  fullName: string;
  email: string;
  userId: string;
  identityNumber?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const normalizedEmail = email.trim().toLowerCase();
  const createdAt = timestamp();

  const profilePayload = {
    id: userId,
    institution_id: institutionId,
    role: "student" as const,
    full_name: fullName,
    email: normalizedEmail,
    identity_number: identityNumber ?? null,
    linked_student_id: studentId,
    created_at: createdAt,
    updated_at: createdAt,
  };

  const { error } = await supabase.from("profiles").insert(profilePayload);
  if (error) {
    console.error("Student Profile Creation Error Details:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const fullName = formData.get("fullName");
  const institutionName = formData.get("institutionName");
  const email = formData.get("email");
  const password = formData.get("password");
  const role = formData.get("role");
  const identityNumber = normalizeIdentityNumber(
    formData.get("identityNumber")
  );

  if (
    typeof fullName !== "string" ||
    typeof institutionName !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof role !== "string"
  ) {
    return { error: "כל השדות נדרשים" };
  }

  const trimmedFullName = fullName.trim();
  const trimmedInstitution = institutionName.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const normalizedRole = role.trim().toLowerCase();

  if (
    !trimmedFullName ||
    !trimmedInstitution ||
    !trimmedEmail ||
    !password
  ) {
    return { error: "כל השדות נדרשים" };
  }

  if (password.length < 8) {
    return { error: "הסיסמה חייבת להכיל לפחות 8 תווים" };
  }

  if (normalizedRole !== "teacher" && normalizedRole !== "student") {
    return { error: "בחר סוג חשבון תקין" };
  }

  if (normalizedRole === "student" && !identityNumber) {
    return { error: "תעודת זהות נדרשת לחשבון תלמיד" };
  }

  const existingProfile = await findProfileByEmail(trimmedEmail);

  if (existingProfile) {
    return { error: "אימייל כבר רשום במערכת" };
  }

  /*
   * תלמיד חייב להיות תלמיד שכבר הוזן על ידי מורה.
   * לכן בודקים את תעודת הזהות לפני יצירת חשבון Auth.
   */
  let matchingStudent = null;

  if (normalizedRole === "student") {
    matchingStudent = await findStudentByIdentityNumber(identityNumber!);

    if (!matchingStudent) {
      return {
        error:
          "לא נמצא תלמיד עם תעודת הזהות הזו במערכת. בקש מהמורה להוסיף אותך לכיתה.",
      };
    }
  }

  const supabase = createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: trimmedFullName,
          institution_name: trimmedInstitution,
          role: normalizedRole,
          identity_number: identityNumber,
        },
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

  if (authError) {
    const normalizedMessage = authError.message?.toLowerCase() ?? "";

    if (
      normalizedMessage.includes("user already registered") ||
      normalizedMessage.includes("already registered")
    ) {
      return {
        error: "אימייל כבר רשום במערכת",
      };
    }

    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "שגיאה בהרשמה" };
  }

  /*
   * אם Supabase דורש אימות אימייל,
   * אין עדיין session ולכן לא יוצרים profile.
   *
   * ה-profile ייווצר לאחר שהמשתמש יאמת את האימייל
   * וייכנס דרך signIn.
   */
  if (!authData.session) {
    return {
      error:
        "נשלח אליך אימייל לאימות. לאחר אישור האימייל ניתן להתחבר למערכת.",
    };
  }

  /*
   * אם יש session מיד לאחר ההרשמה,
   * אפשר ליצור את ה-profile עכשיו.
   */

  if (normalizedRole === "student") {
    const creation = await createStudentProfileForExistingStudent({
      institutionId: matchingStudent!.institution_id,
      studentId: matchingStudent!.id,
      fullName: trimmedFullName,
      email: trimmedEmail,
      userId: authData.user.id,
      identityNumber,
    });

    if (!creation.ok) {
      return {
        error: creation.error || "שגיאה ביצירת פרופיל תלמיד",
      };
    }
  } else {
    const creation = await createTeacherProfileForUser({
      institutionName: trimmedInstitution,
      fullName: trimmedFullName,
      email: trimmedEmail,
      userId: authData.user.id,
      role: "teacher",
      identityNumber: null,
    });

    if (!creation.ok) {
      return {
        error: creation.error || "שגיאה ביצירת פרופיל מורה",
      };
    }
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "אימייל וסיסמה נדרשים" };
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail || !password) {
    return { error: "אימייל וסיסמה נדרשים" };
  }

  const supabase = createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error) {
    console.error("Supabase sign-in failed", {
      email: trimmedEmail,
      status: error.status,
      code: error.code,
      message: error.message,
    });
    if (error.code === "unexpected_failure" || error.status === 500) {
      return {
        error: "שירות ההתחברות של Supabase אינו מצליח לקרוא את חשבון המשתמש. יש למחוק וליצור אותו מחדש ב-Supabase Authentication.",
      };
    }
    return { error: "אימייל או סיסמה שגויים" };
  }

  const user = signInData.user;
  if (user) {
    const profile = await findProfileByEmail(trimmedEmail);
    const metadataIdentityNumber =
      typeof user.user_metadata?.identity_number === "string"
        ? normalizeIdentityNumber(user.user_metadata.identity_number)
        : null;
    const userFullName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : trimmedEmail.split("@")[0];
    const metadataRole =
      typeof user.user_metadata?.role === "string" &&
      (user.user_metadata.role === "teacher" || user.user_metadata.role === "student")
        ? user.user_metadata.role
        : null;
    const userRole = profile?.role === "student" ? "student" : metadataRole ?? "teacher";

 if (!profile) {
  let creation;

  if (userRole === "student") {
    if (!metadataIdentityNumber) {
      return {
        error: "לא נמצאה תעודת זהות בחשבון התלמיד.",
      };
    }

    const matchingStudent =
      await findStudentByIdentityNumber(metadataIdentityNumber);

    if (!matchingStudent) {
      return {
        error:
          "לא נמצא תלמיד מקושר לחשבון. ודא שהמורה הוסיף אותך למערכת עם תעודת הזהות הנכונה.",
      };
    }

    creation = await createStudentProfileForExistingStudent({
      institutionId: matchingStudent.institution_id,
      studentId: matchingStudent.id,
      fullName: userFullName,
      email: trimmedEmail,
      userId: user.id,
      identityNumber: metadataIdentityNumber,
    });
  } else {
    const institutionName =
      typeof user.user_metadata?.institution_name === "string"
        ? user.user_metadata.institution_name
        : "מוסד חדש";

    creation = await createTeacherProfileForUser({
      institutionName,
      fullName: userFullName,
      email: trimmedEmail,
      userId: user.id,
      role: "teacher",
      identityNumber: null,
    });
  }

  if (!creation.ok) {
    return {
      error:
        "חשבון קיים אך פרופיל לא הושלם. פנה למנהל המערכת.",
    };
  }
}else if (userRole === "student" && profile.role !== "student") {
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({
          role: "student",
          identity_number: metadataIdentityNumber ?? profile.identity_number,
          updated_at: timestamp(),
        })
        .eq("id", profile.id);
      await ensureStudentRecordForProfile({
        ...profile,
        role: "student",
        identity_number: metadataIdentityNumber ?? profile.identity_number,
      });
    } else if (profile.role === "student") {
      await ensureStudentRecordForProfile(profile);
    }
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function createClass(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const name = formData.get("name");

  if (typeof name !== "string") {
    return { error: "שם כיתה נדרש" };
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    return { error: "שם כיתה נדרש" };
  }

  const profile = await getSessionProfile();

  if (!profile) {
    return { error: "נדרשת התחברות" };
  }

  if (profile.role !== "teacher" && profile.role !== "institution_admin") {
    return { error: "אין הרשאה ליצירת כיתות" };
  }

  const createdAt = timestamp();

  await addClass({
    id: generateId(),
    name: trimmedName,
    institution_id: profile.institution_id,
    teacher_id: profile.id,
    created_at: createdAt,
    updated_at: createdAt,
  });

  revalidatePath("/classes");
  revalidatePath("/dashboard");
  redirect("/classes");
}

export async function getTeacherClassCount(teacherId: string): Promise<number> {
  return countClassesByTeacher(teacherId);
}

export async function getTeacherRecentClasses(
  teacherId: string,
  limit: number
): Promise<Class[]> {
  return getRecentClassesByTeacher(teacherId, limit);
}

export async function getTeacherClasses(teacherId: string): Promise<Class[]> {
  return getClassesByTeacher(teacherId);
}

export async function getTeacherClassById(
  classId: string,
  teacherId: string
): Promise<Class | null> {
  return getClassByIdForTeacher(classId, teacherId);
}

export async function getClassStudents(classId: string): Promise<Student[]> {
  return getStudentsByClass(classId);
}

export async function addStudentToClass(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const classId = formData.get("classId") as string;
  const name = formData.get("name") as string;
  const identityNumberRaw = formData.get("identityNumber");
  const emailRaw = formData.get("email");

  if (!classId || !name || typeof identityNumberRaw !== "string") {
    return { error: "שדה חסר" };
  }

  const identityNumber = normalizeIdentityNumber(identityNumberRaw);
  if (!identityNumber) {
    return { error: "תעודת זהות תקינה נדרשת" };
  }

  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";

  const profile = await getSessionProfile();

  if (!profile) {
    return { error: "נדרשת התחברות" };
  }

  const classItem = await getClassByIdForTeacher(classId, profile.id);
  if (!classItem) {
    return { error: "כיתה לא קיימת" };
  }

  const createdAt = timestamp();
  const studentId = generateId();
const studentCreated = await addStudent({
  id: studentId,
  class_id: classId,
  institution_id: profile.institution_id,
  name: name.trim(),
  email: email || null,
  identity_number: identityNumber,
  status: "active",
  created_at: createdAt,
  updated_at: createdAt,
});

if (!studentCreated) {
  return {
    error: "הוספת התלמיד נכשלה. בדוק את הגדרות הפרופיל והגדרות הטבלאות.",
  };
}

const savedStudent = await findStudentByIdentityNumber(identityNumber);

if (!savedStudent) {
  console.error("Student was inserted but could not be found:", {
    studentId,
    identityNumber,
  });

  return {
    error: "התלמיד נשמר אך לא ניתן לאתר אותו לפי תעודת הזהות.",
  };
}

  const matchingProfile = await findProfileByIdentityNumber(identityNumber);
  if (
    matchingProfile &&
    matchingProfile.role === "student" &&
    matchingProfile.institution_id === profile.institution_id
  ) {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        linked_student_id: studentId,
        identity_number: matchingProfile.identity_number ?? identityNumber,
        updated_at: timestamp(),
      })
      .eq("id", matchingProfile.id);
  }

  revalidatePath(`/classes/${classId}`);
  return {};
}

export async function getStudentGrades(studentId: string): Promise<Grade[]> {
  return getGradesByStudent(studentId);
}

export async function getStudentAverage(studentId: string): Promise<number> {
  return calculateStudentAverage(studentId);
}

export async function getStudentRiskFlags(studentId: string): Promise<RiskFlag[]> {
  return getRiskFlagsByStudent(studentId);
}

export async function getClassAssignments(classId: string): Promise<Assignment[]> {
  return getAssignmentsByClass(classId);
}

export async function createAssignment(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const classId = formData.get("classId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const due_date = formData.get("due_date") as string;
  const difficulty = formData.get("difficulty") as
    | "easy"
    | "medium"
    | "hard";
  const type = formData.get("type") as
    | "homework"
    | "quiz"
    | "project"
    | "exam";

  if (!classId || !name || !due_date) {
    return { error: "חובה: שם משימה ותאריך הגשה" };
  }

  const profile = await getSessionProfile();

  if (!profile) {
    return { error: "נדרשת התחברות" };
  }

  const classItem = await getClassByIdForTeacher(
    classId,
    profile.id
  );

  if (!classItem) {
    return { error: "כיתה לא קיימת" };
  }

  const createdAt = timestamp();
  const assignmentId = generateId();

  const cleanName = name.trim();
  const cleanDescription = description?.trim() || "";
  const selectedDifficulty = difficulty || "medium";
  const selectedType = type || "homework";

  await addAssignment({
    id: assignmentId,
    class_id: classId,
    institution_id: profile.institution_id,
    name: cleanName,
    description: cleanDescription || null,
    due_date,
    difficulty: selectedDifficulty,
    type: selectedType,
    created_at: createdAt,
    updated_at: createdAt,
  });

  const students = await getStudentsByClass(classId);
  await notifyStudentsAboutAssignment({
    institutionId: profile.institution_id,
    studentIds: students.map((student) => student.id),
    assignmentName: cleanName,
  });

  // ---------------------------------------------------------
  // Send email notification to students
  // ---------------------------------------------------------

  const emailResult = await sendNewAssignmentEmailsToClass(
    classId,
    assignmentId,
    cleanName,
    new Date(due_date).toLocaleDateString("he-IL", {
      dateStyle: "medium",
    }),
    cleanDescription,
    selectedDifficulty,
    selectedType
  );

  revalidatePath(`/classes/${classId}`);

  const sentMessage =
    emailResult.skipped > 0
      ? `המשימה נוצרה. נשלחו ${emailResult.sent} הודעות, והושמטו ${emailResult.skipped} תלמידים ללא אימייל.`
      : `המשימה נוצרה. נשלחו ${emailResult.sent} הודעות לתלמידים.`;

  return {
    success: sentMessage,
    sent: emailResult.sent,
    skipped: emailResult.skipped,
  };
}

export async function submitAssignmentSolution(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const assignmentId = formData.get("assignmentId") as string;
  const studentId = formData.get("studentId") as string;
  const answer = formData.get("answer") as string | null;
  const rawAttachments = formData.getAll("attachment");

  if (!assignmentId || !studentId) {
    return { error: "הנתונים שהוזנו אינם תקינים" };
  }

  const profile = await getSessionProfile();

  if (!profile || profile.role !== "student" || !profile.linked_student_id) {
    return { error: "נדרשת התחברות" };
  }

  if (profile.linked_student_id !== studentId) {
    return { error: "לא ניתן להגיש בשם תלמיד אחר" };
  }

  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) {
    return { error: "המשימה לא נמצאה" };
  }

  const student = await getStudentById(studentId);
  if (!student || student.class_id !== assignment.class_id) {
    return { error: "לא ניתן להגיש משימה לתלמיד זה" };
  }

  const files = rawAttachments.filter((item): item is File => item instanceof File && item.size > 0);
  let attachmentPaths: string[] | null = null;
  let attachmentNames: string[] | null = null;

  if (files.length > 0) {
    try {
      const uploaded = await uploadSubmissionFiles({
        assignmentId,
        studentId,
        institutionId: profile.institution_id,
        files,
      });
      attachmentPaths = uploaded.paths;
      attachmentNames = uploaded.names;
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "העלאת הקובץ נכשלה. בדוק שה- Supabase Storage מוגדר כראוי.",
      };
    }
  }

  const normalizedAnswer = typeof answer === "string" ? answer.trim() : "";
  const existingSubmission = await getSubmissionByStudentAndAssignment(studentId, assignmentId);

  if (!normalizedAnswer && (!attachmentPaths || attachmentPaths.length === 0)) {
    return { error: "יש להוסיף תשובה או קובץ מצורף" };
  }

  const submittedAt = new Date().toISOString();
  const finalStatus = new Date(assignment.due_date) < new Date() ? "late" : "submitted";

  await upsertSubmission({
    id: existingSubmission?.id ?? generateId(),
    assignment_id: assignmentId,
    student_id: studentId,
    institution_id: profile.institution_id,
    answer: normalizedAnswer,
    attachment_urls: attachmentPaths ?? existingSubmission?.attachment_urls ?? null,
    attachment_names: attachmentNames ?? existingSubmission?.attachment_names ?? null,
    submitted_at: submittedAt,
    status: finalStatus,
    created_at: submittedAt,
  });

  const classItem = await getClassById(assignment.class_id);
  if (classItem && !existingSubmission) {
    await notifyTeacherAboutSubmission({
      institutionId: profile.institution_id,
      teacherId: classItem.teacher_id,
      assignmentId,
      classId: assignment.class_id,
      studentName: student.name,
    });
  }

  revalidatePath(`/classes/${assignment.class_id}`);
  revalidatePath(`/classes/${assignment.class_id}/assignments/${assignmentId}`);
  return {};
}

export async function getAssignmentSubmissions(
  assignmentId: string
): Promise<Submission[]> {
  return getSubmissionsByAssignment(assignmentId);
}
