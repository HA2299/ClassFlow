"use client";

import { useFormState, useFormStatus } from "react-dom";
import { gradeSubmission } from "@/app/actions/students";
import type { AuthActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthActionState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "שומר..." : "שמור ציון"}
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
    <form action={action} className="mt-3 space-y-2 rounded-lg border bg-background p-3">
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="classId" value={classId} />
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor={`score-${submissionId}`}>ציון (0-100)</Label>
          <Input
            id={`score-${submissionId}`}
            name="score"
            type="number"
            min={0}
            max={100}
            defaultValue={defaultScore ?? ""}
            required
          />
        </div>
        <div>
          <Label htmlFor={`feedback-${submissionId}`}>משוב</Label>
          <Input
            id={`feedback-${submissionId}`}
            name="feedback"
            defaultValue={defaultFeedback ?? ""}
          />
        </div>
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <SubmitBtn />
    </form>
  );
}
