import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import { getDashboardData } from "@/app/actions/dashboard";
import { generateOpenRouterJson, getOpenRouterErrorMessage } from "@/lib/ai/gemini";

type PulseResponse = {
  score: number;
  headline: string;
  summary: string;
  brightSpot: string;
  actions: string[];
};

function buildLocalPulse(data: Awaited<ReturnType<typeof getDashboardData>>): PulseResponse {
  const riskCount = data.atRiskStudents.length;
  const activeCount = data.activeAssignments.length;
  const submissionRate = data.submissionRate;
  const recentActivity = data.recentSubmissions.length;
  const classCount = data.classCount;
  const pulseScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        submissionRate * 0.55 +
          Math.min(recentActivity * 5, 25) +
          Math.max(0, 20 - riskCount * 8)
      )
    )
  );

  const headline =
    riskCount >= 3
      ? "הכיתות צריכות התערבות ממוקדת"
      : pulseScore >= 75
        ? "הכיתות בתנופה טובה"
        : pulseScore >= 50
          ? "יש בסיס טוב, וזה הזמן לדייק"
          : "כדאי להחזיר את הכיתות לקצב";

  return {
    score: pulseScore,
    headline,
    summary: `ציון הדופק של כלל הכיתות הוא ${pulseScore}/100: ${classCount} ${classCount === 1 ? "כיתה" : "כיתות"}, ${activeCount} משימות פעילות, ${submissionRate}% הגשות ו־${riskCount} תלמידים לסקירה.`,
    brightSpot:
      recentActivity > 0
        ? `${recentActivity} הגשות התקבלו לאחרונה, כך שיש בסיס טוב למשוב בזמן.`
        : submissionRate >= 70
          ? `שיעור ההגשות (${submissionRate}%) מצביע על מעורבות טובה.`
          : "יש הזדמנות טובה להחזיר תלמידים למסלול עם תזכורת קצרה.",
    actions: [
      riskCount > 0 ? `פתח/י את רשימת התלמידים בסיכון ובחר/י ${riskCount > 1 ? "שני תלמידים" : "תלמיד אחד"} לשיחת check-in.` : "שלח/י משוב קצר לכל הכיתות על ההתקדמות השבועית.",
      activeCount > 0 ? "בדוק/י את המשימות הקרובות וזיהוי נקודות שבהן תלמידים נתקעים." : "צור/י משימת תרגול קצרה כדי לשמור על רצף למידה.",
      recentActivity > 0 ? "הקדש/י חמש דקות לעבור על ההגשות האחרונות מכלל הכיתות ולתת חיזוק אישי." : "שלח/י תזכורת קצרה כדי להניע את ההגשה הבאה.",
    ],
  };
}

export async function POST() {
  const profile = await getSessionProfile();
  if (
    !profile ||
    (profile.role !== "teacher" &&
      profile.role !== "institution_admin" &&
      profile.role !== "system_admin")
  ) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const dashboard = await getDashboardData(profile.id);
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const pulse = await generateOpenRouterJson<PulseResponse>(`אתה יועץ פדגוגי למורה. נתח את נתוני הכיתות והחזר JSON בעברית בלבד עם השדות: score (מספר 0-100), headline (כותרת קצרה), summary (סיכום), brightSpot (נקודת חוזק), actions (מערך של 3 פעולות קצרות). היה מעשי, לא שיפוטי, ואל תמציא נתונים.\n\nנתוני הכיתות:\n${JSON.stringify({ classCount: dashboard.classCount, atRiskStudents: dashboard.atRiskStudents.length, activeAssignments: dashboard.activeAssignments.length, submissionRate: dashboard.submissionRate, recentSubmissions: dashboard.recentSubmissions.length })}`, { maxOutputTokens: 500 });
      if (pulse && typeof pulse.score === "number" && Array.isArray(pulse.actions)) {
        return NextResponse.json({ pulse, source: "openrouter" });
      }
    } catch (error) {
      // Keep the local insight available, while reporting why OpenRouter was skipped.
      const pulse = buildLocalPulse(dashboard);
      return NextResponse.json({ pulse, source: "local", warning: `OpenRouter לא זמין: ${getOpenRouterErrorMessage(error)}` });
    }
  }
  const pulse = buildLocalPulse(dashboard);
  return NextResponse.json({ pulse, source: "local" });
}