"use client";

import { useFormState, useFormStatus } from "react-dom";
import { gradeSubmission } from "@/app/actions/students";
import type { AuthActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, MessageSquareText, Save } from "lucide-react";

const initial: AuthActionState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="min-w-32">
      {pending ? <><Save className="size-4 animate-pulse" /> שומר...</> : <><Check className="size-4" /> שמור הערכה</>}
    </Button>
  );
}

export function GradeSubmissionForm({
  submissionId,
  assignmentId,
  classId,
  defaultScore,
  defaultFeedback,
}: {
  submissionId: string;
  assignmentId: string;
  classId: string;
  defaultScore?: number;
  defaultFeedback?: string;
}) {
  const [state, action] = useFormState(gradeSubmission, initial);

  return (
    <form action={action} className="mt-5 space-y-4 rounded-[1.5rem] border border-cyan-100 bg-gradient-to-br from-cyan-50/70 to-white p-4 shadow-inner shadow-cyan-900/[0.03]">
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="classId" value={classId} />
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-sm font-black text-slate-900">הערכת הגשה</p><p className="text-xs text-slate-500">הוסיפו ציון ומשוב לתלמיד</p></div>
        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-cyan-700 shadow-sm">0–100</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-[0.45fr_1fr]">
        <div className="space-y-2">
          <Label htmlFor={`score-${submissionId}`} className="text-xs font-bold text-slate-600">ציון</Label>
          <div className="relative">
          <Input
            id={`score-${submissionId}`}
            name="score"
            type="number"
            min={0}
            max={100}
            defaultValue={defaultScore ?? ""}
            required
            className="h-14 rounded-2xl border-cyan-200 bg-white pl-14 text-center text-2xl font-black text-slate-950 focus:border-cyan-500 focus:ring-cyan-200"
          />
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">/100</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`feedback-${submissionId}`} className="flex items-center gap-1.5 text-xs font-bold text-slate-600"><MessageSquareText className="size-3.5" /> משוב לתלמיד</Label>
          <textarea
            id={`feedback-${submissionId}`}
            name="feedback"
            defaultValue={defaultFeedback ?? ""}
            rows={2}
            placeholder="מה עבד טוב? במה כדאי להשתפר?"
            className="w-full resize-none rounded-2xl border border-cyan-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          />
        </div>
      </div>
      {state.error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{state.error}</p>}
      <div className="flex justify-end"><SubmitBtn /></div>
    </form>
  );
}
