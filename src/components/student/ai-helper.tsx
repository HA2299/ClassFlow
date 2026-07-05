"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AiHelper({ studentName }: { studentName: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, studentName }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "שגיאה");
      } else {
        setAnswer(data.answer ?? "");
      }
    } catch {
      setError("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>עוזר AI ללמידה</CardTitle>
        <CardDescription>שאל שאלה על חומר הלימוד</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAsk} className="space-y-3">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="למשל: איך פותרים משוואה ממדרגה ראשונה?"
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "חושב..." : "שאל"}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {answer && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm leading-relaxed whitespace-pre-wrap">
            {answer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
