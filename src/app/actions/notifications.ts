"use server";

import {
  sendEmail,
  templateGradePublished,
  templateAtRiskAlert,
  templateNewAssignment,
  templateSubmissionReminder,
} from "@/lib/email/resend";

import {
  getActiveAssignmentsForTeacher,
  getAtRiskStudentsForTeacher,
  findProfileById,
  getStudentById,
  getStudentsByClass,
} from "@/lib/data/store";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/types/database";

export type InAppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string;
  read_at: string | null;
  created_at: string;
};

type NotificationPayload = {
  institutionId: string;
  recipientIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  href: string;
};

async function createInAppNotifications(payload: NotificationPayload): Promise<void> {
  const adminClient = createAdminClient();
  const recipientIds = Array.from(new Set(payload.recipientIds)).filter(Boolean);
  if (!adminClient || recipientIds.length === 0) return;

  const { error } = await adminClient.from("in_app_notifications").insert(
    recipientIds.map((recipientId) => ({
      institution_id: payload.institutionId,
      recipient_id: recipientId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      href: payload.href,
    }))
  );

  if (error) console.error("Failed to create in-app notifications", error);
}

async function getStudentProfileIds(studentIds: string[], institutionId: string): Promise<string[]> {
  const adminClient = createAdminClient();
  if (!adminClient || studentIds.length === 0) return [];

  const { data, error } = await adminClient
    .from("profiles")
    .select("id")
    .eq("institution_id", institutionId)
    .in("linked_student_id", studentIds);

  if (error) {
    console.error("Failed to resolve student notification recipients", error);
    return [];
  }

  return (data ?? []).map((profile) => profile.id);
}

export async function getMyNotifications(): Promise<InAppNotification[]> {
  const profile = await (await import("@/lib/auth/session")).getSessionProfile();
  if (!profile) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("in_app_notifications")
    .select("id, type, title, message, href, read_at, created_at")
    .eq("recipient_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    console.error("Failed to load in-app notifications", error);
    return [];
  }

  return (data ?? []) as InAppNotification[];
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const profile = await (await import("@/lib/auth/session")).getSessionProfile();
  if (!profile) return false;

  const { error } = await createClient()
    .from("in_app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", profile.id);

  return !error;
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const profile = await (await import("@/lib/auth/session")).getSessionProfile();
  if (!profile) return false;

  const { error } = await createClient()
    .from("in_app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", profile.id)
    .is("read_at", null);

  return !error;
}

export async function notifyStudentsAboutAssignment({
  institutionId,
  studentIds,
  assignmentName,
}: {
  institutionId: string;
  studentIds: string[];
  assignmentName: string;
}) {
  const recipientIds = await getStudentProfileIds(studentIds, institutionId);
  await createInAppNotifications({
    institutionId,
    recipientIds,
    type: "assignment",
    title: "משימה חדשה",
    message: `נוספה משימה חדשה: ${assignmentName}`,
    href: "/student/assignments",
  });
}

export async function notifyStudentAboutGrade({
  institutionId,
  studentId,
  assignmentName,
  score,
  maxScore = 100,
  feedback,
}: {
  institutionId: string;
  studentId: string;
  assignmentName: string;
  score: number;
  maxScore?: number;
  feedback?: string | null;
}) {
  const recipientIds = await getStudentProfileIds([studentId], institutionId);
  await createInAppNotifications({
    institutionId,
    recipientIds,
    type: "grade",
    title: "הגשה נבדקה",
    message: `קיבלת ${score}/100 על ${assignmentName}`,
    href: "/student/assignments",
  });

  const student = await getStudentById(studentId);
  if (!student) return;

  const recipient = await resolveStudentRecipient(student);
  if (!recipient.email) {
    console.warn(`Skipping grade email for student ${studentId}: no email found.`);
    return;
  }

  const sent = await sendEmail({
    to: recipient.email,
    subject: `🎉 הציון שלך מוכן: ${assignmentName}`,
    html: templateGradePublished({
      studentName: recipient.name,
      assignmentName,
      score,
      maxScore,
      feedback,
    }),
  });

  if (!sent) {
    console.error(`Failed to send grade email to ${recipient.email}`);
  }
}

export async function notifyTeacherAboutSubmission({
  institutionId,
  teacherId,
  assignmentId,
  classId,
  studentName,
}: {
  institutionId: string;
  teacherId: string;
  assignmentId: string;
  classId: string;
  studentName: string;
}) {
  await createInAppNotifications({
    institutionId,
    recipientIds: [teacherId],
    type: "submission",
    title: "הגשה חדשה",
    message: `${studentName} הגיש/ה משימה חדשה לבדיקה`,
    href: `/classes/${classId}/assignments/${assignmentId}`,
  });
}

export async function notifyStudentsAboutResource({
  institutionId,
  studentIds,
  resourceTitle,
}: {
  institutionId: string;
  studentIds: string[];
  resourceTitle: string;
}) {
  const recipientIds = await getStudentProfileIds(studentIds, institutionId);
  await createInAppNotifications({
    institutionId,
    recipientIds,
    type: "resource",
    title: "חומר לימוד חדש",
    message: `נוסף חומר חדש לספרייה: ${resourceTitle}`,
    href: "/student/resources",
  });
}

export async function sendAssignmentNotifications(
  teacherId: string
): Promise<{
  sent: number;
  skipped: boolean;
}> {
  const teacher = await findProfileById(teacherId);

  if (!teacher) {
    return {
      sent: 0,
      skipped: true,
    };
  }

  let sent = 0;

  const hasBrevo = Boolean(
    process.env.BREVO_API_KEY &&
      process.env.BREVO_FROM_EMAIL
  );

  if (!hasBrevo) {
    console.warn(
      "ClassFlow email notifications skipped: BREVO_API_KEY or BREVO_FROM_EMAIL is not configured."
    );

    return {
      sent: 0,
      skipped: true,
    };
  }

  // ---------------------------------------------------------
  // At-risk notifications
  // ---------------------------------------------------------

  const atRisk =
    await getAtRiskStudentsForTeacher(teacherId);

  for (const student of atRisk) {
    if (!teacher.email) continue;

    const html = templateAtRiskAlert(
      teacher.full_name,
      student.name
    );

    const ok = await sendEmail({
      to: teacher.email,
      subject: `ClassFlow: ${student.name} בסיכון`,
      html,
    });

    if (ok) {
      sent += 1;
    }
  }

  // ---------------------------------------------------------
  // Assignment reminders
  // ---------------------------------------------------------

  const assignments =
    await getActiveAssignmentsForTeacher(teacherId);

  for (const assignment of assignments.slice(0, 3)) {
    if (!teacher.email) continue;

    const html = templateSubmissionReminder(
      "תלמיד",
      assignment.name,
      new Date(
        assignment.due_date
      ).toLocaleDateString("he-IL")
    );

    const ok = await sendEmail({
      to: teacher.email,
      subject: `תזכורת: ${assignment.name}`,
      html,
    });

    if (ok) {
      sent += 1;
    }
  }

  return {
    sent,
    skipped: false,
  };
}

// ---------------------------------------------------------
// Resolve student recipient
// ---------------------------------------------------------

async function resolveStudentRecipient(student: {
  id: string;
  name: string;
  email?: string | null;
  identity_number?: string | null;
  institution_id: string;
}) {
  const directEmail =
    student.email?.trim().toLowerCase();

  if (directEmail) {
    return {
      email: directEmail,
      name: student.name || "תלמיד",
    };
  }

  const supabase = createClient();

  const identity =
    student.identity_number
      ?.trim()
      .replace(/\D/g, "") ?? "";

  const normalizedName =
    student.name.trim().toLowerCase();

  const { data: profiles, error } =
    await supabase
      .from("profiles")
      .select(
        "id, email, full_name, identity_number, linked_student_id"
      )
      .eq(
        "institution_id",
        student.institution_id
      )
      .or(
        identity
          ? `linked_student_id.eq.${student.id},identity_number.eq.${identity}`
          : `linked_student_id.eq.${student.id}`
      );

  if (error) {
    console.error(
      "Failed to resolve student profile:",
      error
    );
  }

  if (!error && profiles?.length) {
    const matchedProfile = profiles.find(
      (profile) => {
        if (
          profile.linked_student_id ===
          student.id
        ) {
          return true;
        }

        const profileIdentity =
          profile.identity_number
            ?.trim()
            .replace(/\D/g, "") ?? "";

        if (
          identity &&
          profileIdentity &&
          profileIdentity === identity
        ) {
          return true;
        }

        return Boolean(
          profile.full_name &&
            profile.full_name
              .trim()
              .toLowerCase() ===
              normalizedName
        );
      }
    );

    const candidateEmail =
      matchedProfile?.email
        ?.trim()
        .toLowerCase();

    if (candidateEmail && matchedProfile) {
      return {
        email: candidateEmail,
        name:
          matchedProfile.full_name ||
          student.name ||
          "תלמיד",
      };
    }
  }

  return {
    email: "",
    name: student.name || "תלמיד",
  };
}

// ---------------------------------------------------------
// Send new assignment emails
// ---------------------------------------------------------

export async function sendNewAssignmentEmailsToClass(
  classId: string,
  assignmentId: string,
  assignmentName: string,
  dueDate: string,
  description?: string,
  difficulty?: "easy" | "medium" | "hard",
  type?: "homework" | "quiz" | "project" | "exam"
): Promise<{
  sent: number;
  skipped: number;
}> {
  const students =
    await getStudentsByClass(classId);

  const hasBrevo = Boolean(
    process.env.BREVO_API_KEY &&
      process.env.BREVO_FROM_EMAIL
  );

  console.log(
    "ClassFlow assignment email process:",
    {
      classId,
      assignmentId,
      assignmentName,
      studentsCount: students.length,
      hasBrevo,
    }
  );

  if (!hasBrevo) {
    console.warn(
      "ClassFlow assignment emails skipped: Brevo is not configured."
    );

    return {
      sent: 0,
      skipped: students.length,
    };
  }

  let sent = 0;
  let skipped = 0;

  for (const student of students) {
    const recipient =
      await resolveStudentRecipient(student);

    if (!recipient.email) {
      console.warn(
        `Skipping student ${student.id}: no email found.`
      );

      skipped += 1;
      continue;
    }

    const html = templateNewAssignment(
      recipient.name,
      assignmentName,
      dueDate,
      assignmentId,
      description,
      difficulty,
      type,
    );

    const ok = await sendEmail({
      to: recipient.email,
      subject: `✨ משימה חדשה: ${assignmentName}`,
      html,
    });

    if (ok) {
      sent += 1;

      console.log(
        `Assignment email sent successfully to ${recipient.email}`
      );
    } else {
      skipped += 1;

      console.error(
        `Failed to send assignment email to ${recipient.email}`
      );
    }
  }

  console.log(
    "ClassFlow assignment email result:",
    {
      classId,
      assignmentId,
      sent,
      skipped,
    }
  );

  return {
    sent,
    skipped,
  };
}