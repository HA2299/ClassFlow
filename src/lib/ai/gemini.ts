import "server-only";

const OPENROUTER_MODEL = "openrouter/free";

type OpenRouterErrorPayload = {
  error?: {
    message?: string;
    status?: string;
    code?: number;
  };
};

export function getOpenRouterErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "סיבה לא ידועה";
}

export async function generateOpenRouterText(prompt: string, options?: { temperature?: number; maxOutputTokens?: number }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "ClassFlow",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: options?.temperature ?? 0.4,
      max_tokens: options?.maxOutputTokens ?? 800,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    let reason = "לא ניתן לקבל תשובה מ-OpenRouter";
    try {
      const errorData = (await response.json()) as OpenRouterErrorPayload;
      reason = errorData.error?.message || errorData.error?.status || reason;
    } catch {
      reason = `${reason} (HTTP ${response.status})`;
    }
    throw new Error(`${reason} (HTTP ${response.status})`);
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim() || null;
  return content?.map((part) => part.text ?? "").join("").trim() || null;
}

export async function generateOpenRouterJson<T>(prompt: string, options?: { maxOutputTokens?: number }) {
  const text = await generateOpenRouterText(`${prompt}\n\nהחזר JSON תקין בלבד, בלי Markdown ובלי טקסט נוסף.`, options);
  if (!text) return null;
  const normalized = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(normalized) as T;
  } catch {
    throw new Error("OpenRouter החזיר תשובה שאינה בפורמט JSON תקין");
  }
}