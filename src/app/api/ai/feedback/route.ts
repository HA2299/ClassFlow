import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import { generateOpenRouterText, getOpenRouterErrorMessage } from "@/lib/ai/gemini";

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || (profile.role !== "teacher" && profile.role !== "institution_admin" && profile.role !== "system_admin")) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const body = (await request.json()) as { studentName?: string; assignmentName?: string; answer?: string };
  if (!body.answer?.trim() && !body.studentName?.trim()) return NextResponse.json({ error: "נתוני הגשה חסרים" }, { status: 400 });
  if (!process.env.OPENROUTER_API_KEY) return NextResponse.json({ error: "OPENROUTER_API_KEY חסר" }, { status: 503 });

  try {
    const feedback = await generateOpenRouterText(`כתוב טיוטת משוב קצרה בעברית לתלמיד על הגשה. היה ענייני, מעודד וספציפי. אל תמציא עובדות ואל תיתן ציון.\n\nמשימה: ${body.assignmentName ?? "משימה"}\nתלמיד: ${body.studentName ?? "תלמיד"}\nתשובת התלמיד:\n${body.answer ?? "אין תשובה"}`, { maxOutputTokens: 220 });
    return NextResponse.json({ feedback: feedback ?? "לא התקבלה הצעת משוב" });
  } catch (error) {
    return NextResponse.json({ error: `שגיאת OpenRouter: ${getOpenRouterErrorMessage(error)}` }, { status: 502 });
  }
}