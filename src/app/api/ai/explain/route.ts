import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import { generateGeminiText } from "@/lib/ai/gemini";

export async function POST(request: Request) {
  const profile = await getSessionProfile();

  if (!profile || profile.role !== "student") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const body = (await request.json()) as {
    question?: string;
    studentName?: string;
  };

  if (!body.question?.trim()) {
    return NextResponse.json({ error: "שאלה נדרשת" }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      answer: `מענה כללי ללא Gemini\n\nשאלה: ${body.question.trim()}\n\nהסבר לשלבים:\n1. קרא את השאלה בעיון\n2. זהה את הנתונים והנעלם\n3. בחר שיטת פתרון מתאימה\n4. בדוק את התשובה\n\nטיפ: כשתגדיר GEMINI_API_KEY, תקבל הסבר מותאם אישית.`,
    });
  }

  try {
    const answer = await generateGeminiText(`אתה עוזר למידה לתלמידי בית ספר. הסבר בעברית, בצורה ברורה ובשלבים, בלי לתת תשובה מוכנה לשאלת שיעורי בית. הנחה את התלמיד לחשוב.\n\nשם התלמיד: ${body.studentName ?? "תלמיד"}\nשאלה: ${body.question}`, { maxOutputTokens: 600 });
    return NextResponse.json({ answer: answer ?? "לא התקבלה תשובה" });
  } catch {
    return NextResponse.json({ error: "שגיאת Gemini" }, { status: 502 });
  }
}
