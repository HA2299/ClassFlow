import { NextResponse } from "next/server";
import { getDemoSessionProfile } from "@/lib/demo/session";
import { ensureDemoStoreHydrated } from "@/lib/demo/hydrate.server";

type WizardStep = "idea" | "edit" | "finalize";

export async function POST(request: Request) {
  ensureDemoStoreHydrated();
  const profile = getDemoSessionProfile();

  if (
    !profile ||
    (profile.role !== "teacher" &&
      profile.role !== "institution_admin" &&
      profile.role !== "system_admin")
  ) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const body = (await request.json()) as {
    step?: WizardStep;
    idea?: string;
    draft?: {
      name?: string;
      description?: string;
      difficulty?: string;
      type?: string;
    };
    classContext?: string;
  };

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const idea = body.idea ?? "משימה לדוגמה";
    return NextResponse.json({
      draft: {
        name: body.draft?.name ?? `משימה: ${idea.slice(0, 40)}`,
        description:
          body.draft?.description ??
          `【דמו】משימה המבוססת על: ${idea}\n\nפתרו את התרגילים בכתב והגישו עד למועד.`,
        difficulty: body.draft?.difficulty ?? "medium",
        type: body.draft?.type ?? "homework",
      },
    });
  }

  const systemPrompt =
    body.step === "idea"
      ? "צור טיוטת משימה לכיתה בפורמט JSON עם השדות: name, description, difficulty (easy|medium|hard), type (homework|quiz|project|exam). ענה בעברית."
      : "שפר את טיוטת המשימה לפי בקשת המורה. החזר JSON עם name, description, difficulty, type.";

  const userContent =
    body.step === "idea"
      ? `רעיון למשימה: ${body.idea}\nכיתה: ${body.classContext ?? ""}`
      : JSON.stringify(body.draft);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "שגיאת AI" }, { status: 502 });
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  try {
    const draft = JSON.parse(
      data.choices?.[0]?.message?.content ?? "{}"
    ) as Record<string, string>;
    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json({ error: "פורמט תשובה לא תקין" }, { status: 502 });
  }
}
