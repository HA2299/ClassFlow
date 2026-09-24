import "server-only";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function generateGeminiText(prompt: string, options?: { temperature?: number; maxOutputTokens?: number }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.4,
          maxOutputTokens: options?.maxOutputTokens ?? 800,
        },
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() || null;
}

export async function generateGeminiJson<T>(prompt: string, options?: { maxOutputTokens?: number }) {
  const text = await generateGeminiText(`${prompt}\n\nהחזר JSON תקין בלבד, בלי Markdown ובלי טקסט נוסף.`, options);
  if (!text) return null;
  const normalized = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(normalized) as T;
}