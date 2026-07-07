import { NextResponse } from "next/server";
import { getDemoSessionProfile } from "@/lib/demo/session";
import { ensureDemoStoreHydrated } from "@/lib/demo/hydrate.server";

export async function POST(request: Request) {
  ensureDemoStoreHydrated();
  const profile = getDemoSessionProfile();

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

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      answer: `【מצב דמו ללא OpenAI】\n\nשאלה: ${body.question.trim()}\n\nהסבר לשלבים:\n1. קרא את השאלה בעיון\n2. זהה את הנתונים והנעלם\n3. בחר שיטת פתרון מתאימה\n4. בדוק את התשובה\n\nטיפ: כשתגדיר OPENAI_API_KEY, תקבל הסבר מותאם אישית.`,
    });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "אתה עוזר למידה לתלמידי בית ספר. הסבר בעברית, בצורה ברורה, בשלבים, בלי לתת תשובה מוכנה לשאלות שיעורי בית — הנחה לחשוב.",
        },
        {
          role: "user",
          content: `שם התלמיד: ${body.studentName ?? "תלמיד"}\nשאלה: ${body.question}`,
        },
      ],
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "שגיאת AI" }, { status: 502 });
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return NextResponse.json({
    answer: data.choices?.[0]?.message?.content ?? "לא התקבלה תשובה",
  });
}
