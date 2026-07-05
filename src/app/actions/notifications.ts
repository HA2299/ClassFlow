"use server";

import {
  sendEmail,
  templateAtRiskAlert,
  templateNewAssignment,
  templateSubmissionReminder,
} from "@/lib/email/resend";
import { ensureDemoStoreHydrated } from "@/lib/demo/hydrate.server";
import {
  getActiveAssignmentsForTeacher,
  getAtRiskStudentsForTeacher,
  findProfileById,
} from "@/lib/demo/store";

export async function sendDemoNotifications(teacherId: string): Promise<{
  sent: number;
  skipped: boolean;
}> {
  ensureDemoStoreHydrated();
  const teacher = findProfileById(teacherId);
  if (!teacher) return { sent: 0, skipped: true };

  let sent = 0;
  const hasResend = Boolean(process.env.RESEND_API_KEY);

  const atRisk = getAtRiskStudentsForTeacher(teacherId);
  for (const student of atRisk) {
    const html = templateAtRiskAlert(teacher.full_name, student.name);
    if (hasResend && teacher.email) {
      const ok = await sendEmail({
        to: teacher.email,
        subject: `ClassFlow: ${student.name} בסיכון`,
        html,
      });
      if (ok) sent += 1;
    }
  }

  const assignments = getActiveAssignmentsForTeacher(teacherId);
  for (const assignment of assignments.slice(0, 3)) {
    const html = templateSubmissionReminder(
      "תלמיד",
      assignment.name,
      new Date(assignment.due_date).toLocaleDateString("he-IL")
    );
    if (hasResend && teacher.email) {
      const ok = await sendEmail({
        to: teacher.email,
        subject: `תזכורת: ${assignment.name}`,
        html,
      });
      if (ok) sent += 1;
    } else {
      void templateNewAssignment("תלמיד", assignment.name);
    }
  }

  return { sent, skipped: !hasResend };
}
