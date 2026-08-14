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

export async function sendAssignmentNotifications(teacherId: string): Promise<{
  sent: number;
  skipped: boolean;
}> {
  const teacher = await findProfileById(teacherId);

  if (!teacher) {
    return { sent: 0, skipped: true };
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

    return { sent: 0, skipped: true };
  }

  // ---------------------------------------------------------
  // At-risk notifications to teacher
  // ---------------------------------------------------------

  const atRisk = await getAtRiskStudentsForTeacher(teacherId);

  for (const student of atRisk) {
    const html = templateAtRiskAlert(
      teacher.full_name,
      student.name
    );

    if (teacher.email) {
      const ok = await sendEmail({
        to: teacher.email,
        subject: `ClassFlow: ${student.name} בסיכון`,
        html,
      });

      if (ok) {
        sent += 1;
      }
    }
  }

  // ---------------------------------------------------------
  // Assignment reminders to teacher
  // ---------------------------------------------------------

  const assignments = await getActiveAssignmentsForTeacher(teacherId);

  for (const assignment of assignments.slice(0, 3)) {
    const html = templateSubmissionReminder(
      "תלמיד",
      assignment.name,
      new Date(assignment.due_date).toLocaleDateString("he-IL")
    );

    if (teacher.email) {
      const ok = await sendEmail({
        to: teacher.email,
        subject: `תזכורת: ${assignment.name}`,
        html,
      });

      if (ok) {
        sent += 1;
      }
    } else {
      void templateNewAssignment("תלמיד", assignment.name);
    }
  }

  return {
    sent,
    skipped: false,
  };
}

// ---------------------------------------------------------
// Resolve student email
// ---------------------------------------------------------

async function resolveStudentRecipient(student: {
  id: string;
  name: string;
  email?: string | null;
  identity_number?: string | null;
  institution_id: string;
}) {
  // First try the email directly stored on the student
  const directEmail = student.email?.trim().toLowerCase();

  if (directEmail) {
    return {
      email: directEmail,
      name: student.name || "תלמיד",
    };
  }

  // If there is no direct email, search the student's profile
  const supabase = createClient();

  const identity =
    student.identity_number?.trim().replace(/\D/g, "") ?? "";

  const normalizedName = student.name.trim().toLowerCase();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, identity_number, linked_student_id"
    )
    .eq("institution_id", student.institution_id)
    .or(
      identity
        ? `linked_student_id.eq.${student.id},identity_number.eq.${identity}`
        : `linked_student_id.eq.${student.id}`
    );

  if (error) {
    console.error(
      "Failed to resolve student profile:",
      {
        studentId: student.id,
        error,
      }
    );
  }

  if (!error && profiles && profiles.length > 0) {
    const matchedProfile = profiles.find((profile) => {
      // Best match: profile is directly linked to the student
      if (profile.linked_student_id === student.id) {
        return true;
      }

      // Second match: identity number
      const profileIdentity =
        profile.identity_number?.trim().replace(/\D/g, "") ?? "";

      if (
        identity &&
        profileIdentity &&
        profileIdentity === identity
      ) {
        return true;
      }

      // Third match: full name
      return Boolean(
        profile.full_name &&
          profile.full_name.trim().toLowerCase() ===
            normalizedName
      );
    });

    const candidateEmail =
      matchedProfile?.email?.trim().toLowerCase();

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
// Send new assignment emails to all students in a class
// ---------------------------------------------------------

export async function sendNewAssignmentEmailsToClass(
  classId: string,
  assignmentName: string,
  dueDate: string
): Promise<{ sent: number; skipped: number }> {
  const students = await getStudentsByClass(classId);

  const hasBrevo = Boolean(
    process.env.BREVO_API_KEY &&
      process.env.BREVO_FROM_EMAIL
  );

  console.log("ClassFlow assignment email process:", {
    classId,
    assignmentName,
    studentsCount: students.length,
    hasBrevo,
  });

  if (!hasBrevo) {
    console.warn(
      "ClassFlow assignment emails skipped: BREVO_API_KEY or BREVO_FROM_EMAIL is not configured."
    );

    return {
      sent: 0,
      skipped: students.length,
    };
  }

  let sent = 0;
  let skipped = 0;

  for (const student of students) {
    const recipient = await resolveStudentRecipient(student);

    console.log("Resolved student recipient:", {
      studentId: student.id,
      studentName: student.name,
      recipientEmail: recipient.email || "(no email)",
    });

    if (!recipient.email) {
      console.warn(
        `Skipping student ${student.id}: no email address found.`
      );

      skipped += 1;
      continue;
    }

    const html = templateNewAssignment(
      recipient.name,
      assignmentName,
      dueDate
    );

    const ok = await sendEmail({
      to: recipient.email,
      subject: `משימה חדשה: ${assignmentName}`,
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

  console.log("ClassFlow assignment email result:", {
    classId,
    assignmentName,
    sent,
    skipped,
  });

  return {
    sent,
    skipped,
  };
}