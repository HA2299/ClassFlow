"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAssignment } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Draft = {
  name: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  type: "homework" | "quiz" | "project" | "exam";
};

export function AssignmentWizard({
  classId,
  className,
}: {
  classId: string;
  className: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [idea, setIdea] = useState("");
  const [draft, setDraft] = useState<Draft>({
    name: "",
    description: "",
    difficulty: "medium",
    type: "homework",
  });
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateDraft(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function generateDraft(fromStep: "idea" | "edit") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: fromStep,
          idea,
          draft,
          classContext: className,
        }),
      });
      const data = (await res.json()) as { draft?: Draft; error?: string };
      if (!res.ok) throw new Error(data.error ?? "שגיאה");
      if (data.draft) {
        updateDraft({
          name: data.draft.name ?? draft.name,
          description: data.draft.description ?? draft.description,
          difficulty:
            data.draft.difficulty === "easy" ||
            data.draft.difficulty === "hard" ||
            data.draft.difficulty === "medium"
              ? data.draft.difficulty
              : "medium",
          type:
            data.draft.type === "homework" ||
            data.draft.type === "quiz" ||
            data.draft.type === "project" ||
            data.draft.type === "exam"
              ? data.draft.type
              : "homework",
        });
      }
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    setLoading(true);
    setError("");

    const trimmedName = draft.name.trim();
    const trimmedDescription = draft.description.trim();

    if (!trimmedName) {
      setError("יש להזין שם למשימה");
      setLoading(false);
      return;
    }

    if (!dueDate) {
      setError("יש לבחור תאריך הגשה");
      setLoading(false);
      return;
    }

    const fd = new FormData();
    fd.set("classId", classId);
    fd.set("name", trimmedName);
    fd.set("description", trimmedDescription);
    fd.set("due_date", dueDate);
    fd.set("difficulty", draft.difficulty);
    fd.set("type", draft.type);
    const result = await createAssignment({}, fd);
    if (result?.error) {
      setError(result.error);
      setSuccess("");
      setLoading(false);
      return;
    }
    setError("");
    setSuccess(result?.success ?? "המשימה נוצרה בהצלחה.");
    router.push(`/classes/${classId}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>אשף יצירת משימה — שלב {step}/3</CardTitle>
        <CardDescription>כיתה: {className}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <>
            <div>
              <Label htmlFor="idea">רעיון למשימה (שיחה חופשית)</Label>
              <Input
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="למשל: תרגול משוואות לינאריות לכיתה א'"
              />
            </div>
            <Button
              type="button"
              onClick={() => generateDraft("idea")}
              disabled={loading || !idea.trim()}
            >
              {loading ? "יוצר..." : "המשך לעריכה"}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <Label htmlFor="assignment-name">שם</Label>
              <Input
                id="assignment-name"
                value={draft.name}
                onChange={(e) => updateDraft({ name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="assignment-description">תיאור</Label>
              <textarea
                id="assignment-description"
                value={draft.description}
                onChange={(e) => updateDraft({ description: e.target.value })}
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="הוסף הוראות, דוגמאות או מטרה של המשימה"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="assignment-difficulty">רמת קושי</Label>
                <select
                  id="assignment-difficulty"
                  value={draft.difficulty}
                  onChange={(e) =>
                    updateDraft({
                      difficulty: e.target.value as Draft["difficulty"],
                    })
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                >
                  <option value="easy">קל</option>
                  <option value="medium">בינוני</option>
                  <option value="hard">קשה</option>
                </select>
              </div>
              <div>
                <Label htmlFor="assignment-type">סוג</Label>
                <select
                  id="assignment-type"
                  value={draft.type}
                  onChange={(e) =>
                    updateDraft({ type: e.target.value as Draft["type"] })
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                >
                  <option value="homework">שיעורי בית</option>
                  <option value="quiz">בחינה קטנה</option>
                  <option value="project">פרויקט</option>
                  <option value="exam">בחינה</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => generateDraft("edit")}
                disabled={loading}
              >
                שפר עם AI
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                המשך לשליחה
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <Label htmlFor="due">תאריך הגשה</Label>
              <Input
                id="due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{draft.name || "משימה חדשה"}</p>
              <p className="mt-1 text-muted-foreground">
                {draft.description || "אין תיאור נוסף"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                סוג: {draft.type} · רמת קושי: {draft.difficulty}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                חזור לעריכה
              </Button>
              <Button type="button" onClick={publish} disabled={loading}>
                {loading ? "שולח..." : "שלח לכיתה"}
              </Button>
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm font-medium text-emerald-600">{success}</p>}
      </CardContent>
    </Card>
  );
}
