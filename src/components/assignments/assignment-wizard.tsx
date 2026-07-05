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
        setDraft({
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
    const fd = new FormData();
    fd.set("classId", classId);
    fd.set("name", draft.name);
    fd.set("description", draft.description);
    fd.set("due_date", dueDate || new Date(Date.now() + 86400000 * 7).toISOString());
    fd.set("difficulty", draft.difficulty);
    fd.set("type", draft.type);
    const result = await createAssignment({}, fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
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
              <Label>שם</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div>
              <Label>תיאור</Label>
              <Input
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2">
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
            <p className="text-sm text-muted-foreground">
              {draft.name} — {draft.description.slice(0, 80)}...
            </p>
            <Button type="button" onClick={publish} disabled={loading}>
              {loading ? "שולח..." : "שלח לכיתה"}
            </Button>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
