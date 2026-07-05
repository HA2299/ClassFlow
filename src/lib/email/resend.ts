type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "ClassFlow <onboarding@resend.dev>";

  if (!apiKey) {
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });

  return res.ok;
}

export function templateNewAssignment(
  studentName: string,
  assignmentName: string
): string {
  return `<p>שלום ${studentName},</p><p>משימה חדשה: <strong>${assignmentName}</strong></p>`;
}

export function templateSubmissionReminder(
  studentName: string,
  assignmentName: string,
  dueDate: string
): string {
  return `<p>שלום ${studentName},</p><p>תזכורת: ${assignmentName} — להגשה עד ${dueDate}</p>`;
}

export function templateAtRiskAlert(
  teacherName: string,
  studentName: string
): string {
  return `<p>שלום ${teacherName},</p><p>התראה: ${studentName} מסומן/ת בסיכון.</p>`;
}

export function templateParentUpdate(
  parentName: string,
  studentName: string,
  summary: string
): string {
  return `<p>שלום ${parentName},</p><p>עדכון על ${studentName}: ${summary}</p>`;
}
