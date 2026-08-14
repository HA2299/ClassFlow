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
  dueDate?: string,
  assignmentId?: string,
  description?: string,
  difficulty?: "easy" | "medium" | "hard",
  type?: "homework" | "quiz" | "project" | "exam",
): string{
  const typeLabels: Record<string, string> = {
    homework: "שיעורי בית",
    quiz: "בוחן",
    project: "פרויקט",
    exam: "מבחן",
  };

  const difficultyLabels: Record<string, string> = {
    easy: "קל",
    medium: "בינוני",
    hard: "מאתגר",
  };

  const typeLabel = type ? typeLabels[type] ?? type : "משימה";
  const difficultyLabel = difficulty
    ? difficultyLabels[difficulty] ?? difficulty
    : "";

  const appUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const safeDescription = description?.trim();

  return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>משימה חדשה - ClassFlow</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f1f5f9;
  font-family:Arial,Helvetica,sans-serif;
  direction:rtl;
">

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#f1f5f9;padding:32px 12px;"
  >
    <tr>
      <td align="center">

        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:600px;
            width:100%;
            background:#ffffff;
            border-radius:24px;
            overflow:hidden;
            box-shadow:0 10px 40px rgba(15,23,42,0.10);
          "
        >

          <!-- Header -->
          <tr>
            <td style="
              background:linear-gradient(135deg,#0f172a,#1d4ed8,#0f766e);
              padding:36px 32px;
              text-align:center;
            ">

              <div style="
                display:inline-block;
                background:rgba(255,255,255,0.12);
                border:1px solid rgba(255,255,255,0.2);
                border-radius:999px;
                padding:7px 14px;
                color:#dbeafe;
                font-size:11px;
                font-weight:bold;
                letter-spacing:1px;
              ">
                CLASSFLOW
              </div>

              <h1 style="
                margin:20px 0 8px;
                color:#ffffff;
                font-size:30px;
                line-height:1.2;
              ">
                🎯 משימה חדשה!
              </h1>

              <p style="
                margin:0;
                color:#dbeafe;
                font-size:15px;
              ">
                יש לך משימה חדשה שמחכה לך
              </p>

            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 32px 12px;">

              <p style="
                margin:0;
                color:#334155;
                font-size:17px;
                line-height:1.7;
              ">
                שלום <strong>${studentName}</strong> 👋
              </p>

              <p style="
                margin:10px 0 0;
                color:#64748b;
                font-size:14px;
                line-height:1.7;
              ">
                המורה שלך פרסם/ה משימה חדשה. הנה כל הפרטים:
              </p>

            </td>
          </tr>

          <!-- Assignment Card -->
          <tr>
            <td style="padding:12px 32px 24px;">

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  background:#f8fafc;
                  border:1px solid #e2e8f0;
                  border-radius:18px;
                "
              >

                <tr>
                  <td style="padding:24px;">

                    <div style="
                      color:#64748b;
                      font-size:11px;
                      font-weight:bold;
                      margin-bottom:8px;
                    ">
                      ${typeLabel.toUpperCase()}
                    </div>

                    <h2 style="
                      margin:0;
                      color:#0f172a;
                      font-size:23px;
                      line-height:1.4;
                    ">
                      ${assignmentName}
                    </h2>

                    ${
                      safeDescription
                        ? `
                    <p style="
                      margin:14px 0 0;
                      color:#475569;
                      font-size:14px;
                      line-height:1.7;
                    ">
                      ${safeDescription}
                    </p>
                    `
                        : ""
                    }

                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:0 32px 24px;">

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >

                <tr>

                  ${
                    dueDate
                      ? `
                  <td width="50%" style="padding-left:6px;">
                    <div style="
                      background:#eff6ff;
                      border:1px solid #dbeafe;
                      border-radius:16px;
                      padding:18px;
                    ">
                      <div style="
                        color:#64748b;
                        font-size:11px;
                        margin-bottom:7px;
                      ">
                        📅 מועד הגשה
                      </div>

                      <div style="
                        color:#1d4ed8;
                        font-size:16px;
                        font-weight:bold;
                      ">
                        ${dueDate}
                      </div>
                    </div>
                  </td>
                  `
                      : ""
                  }

                  ${
                    difficultyLabel
                      ? `
                  <td width="50%" style="padding-right:6px;">
                    <div style="
                      background:#f5f3ff;
                      border:1px solid #ede9fe;
                      border-radius:16px;
                      padding:18px;
                    ">
                      <div style="
                        color:#64748b;
                        font-size:11px;
                        margin-bottom:7px;
                      ">
                        ⚡ רמת קושי
                      </div>

                      <div style="
                        color:#6d28d9;
                        font-size:16px;
                        font-weight:bold;
                      ">
                        ${difficultyLabel}
                      </div>
                    </div>
                  </td>
                  `
                      : ""
                  }

                </tr>

              </table>

            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:4px 32px 32px;text-align:center;">

              <a
                href="${appUrl}/student/assignments"
                style="
                  display:inline-block;
                  background:#2563eb;
                  color:#ffffff;
                  text-decoration:none;
                  font-size:15px;
                  font-weight:bold;
                  padding:15px 30px;
                  border-radius:14px;
                "
              >
                🚀 לצפייה במשימה
              </a>

              <p style="
                margin:16px 0 0;
                color:#94a3b8;
                font-size:12px;
              ">
                התחבר/י ל-ClassFlow כדי לצפות במשימה ולהגיש אותה
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              background:#f8fafc;
              border-top:1px solid #e2e8f0;
              padding:22px 32px;
              text-align:center;
            ">

              <p style="
                margin:0;
                color:#64748b;
                font-size:12px;
              ">
                נשלח אליך מ-ClassFlow
              </p>

              <p style="
                margin:7px 0 0;
                color:#94a3b8;
                font-size:11px;
              ">
                מערכת חכמה לניהול למידה ומשימות
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
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
