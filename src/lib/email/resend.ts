type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.BREVO_FROM_EMAIL;
    const fromName = process.env.BREVO_FROM_NAME ?? "ClassFlow";

    if (!apiKey) {
      console.error("BREVO_API_KEY is not configured.");
      return false;
    }

    if (!fromEmail) {
      console.error("BREVO_FROM_EMAIL is not configured.");
      return false;
    }

    console.log("Sending email with Brevo:", {
      from: fromEmail,
      to: payload.to,
      subject: payload.subject,
    });

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: fromName,
          email: fromEmail,
        },
        to: [
          {
            email: payload.to,
          },
        ],
        subject: payload.subject,
        htmlContent: payload.html,
      }),
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error("Brevo returned an error:", {
        status: res.status,
        statusText: res.statusText,
        response: responseText,
      });

      return false;
    }

    console.log("Email sent successfully with Brevo:", responseText);

    return true;
  } catch (error) {
    console.error("Unexpected error while sending email with Brevo:", error);

    return false;
  }
}
export function templateNewAssignment(
  studentName: string,
  assignmentName: string,
  dueDate?: string
): string {
  const dueDateText = dueDate ? ` <br />הגשה עד: <strong>${dueDate}</strong>` : "";
  return `<p>שלום ${studentName},</p><p>משימה חדשה: <strong>${assignmentName}</strong>${dueDateText}</p>`;
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
