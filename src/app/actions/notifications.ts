"use server";

import {
  sendEmail,
  templateAtRiskAlert,
  templateNewAssignment,
  templateSubmissionReminder,
} from "@/lib/email/resend";

import {
  getActiveAssignmentsForTeacher,
  getAtRiskStudentsForTeacher,
  findProfileById,
  getStudentsByClass,
} from "@/lib/data/store";

import { createClient } from "@/lib/supabase/server";

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