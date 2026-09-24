import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import { generateOpenRouterJson, getOpenRouterErrorMessage } from "@/lib/ai/gemini";

type WizardStep = "idea" | "edit" | "finalize";

export async function POST(request: Request) {
  const profile = await getSessionProfile();

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

  if (!body.idea?.trim()) {
    return NextResponse.json({ error: "יש להזין רעיון למשימה" }, { status: 400 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    const idea = body.idea.trim();
    return NextResponse.json({
      draft: {
        name: body.draft?.name?.trim() || `משימה: ${idea.slice(0, 40)}`,
        description:
          body.draft?.description?.trim() ||
          `משימה המבוססת על: ${idea}\n\nפתרו את התרגילים בכתב והגישו עד למועד.`,
        difficulty: body.draft?.difficulty ?? "medium",
        type: body.draft?.type ?? "homework",
      },
    });
  }

  const instruction =
    body.step === "idea"
      ? "צור טיוטת משימה לכיתה בפורמט JSON עם השדות: name, description, difficulty (easy|medium|hard), type (homework|quiz|project|exam). ענה בעברית."
      : "שפר את טיוטת המשימה לפי בקשת המורה. החזר JSON עם name, description, difficulty, type.";

  const userContent =
    body.step === "idea"
      ? `רעיון למשימה: ${body.idea}\nכיתה: ${body.classContext ?? ""}`
      : JSON.stringify(body.draft);

  try {
    const draft = await generateOpenRouterJson<Record<string, string>>(`${instruction}\n\n${userContent}`);
    if (!draft) return NextResponse.json({ error: "OPENROUTER_API_KEY חסר" }, { status: 503 });
    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json({ error: `שגיאת OpenRouter: ${getOpenRouterErrorMessage(error)}` }, { status: 502 });
  }
}
