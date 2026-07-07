"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateAssignmentAction, deleteAssignmentAction } from "@/app/actions/assignments";
import type { AuthActionState } from "@/app/actions/auth";
import type { Assignment } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthActionState = {};

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "שומר..." : "עדכן"}
    </Button>
  );
}

export function AssignmentEditForm({
  assignment,
  classId,
}: {
  assignment: Assignment;
  classId: string;
}) {
  const [state, action] = useFormState(updateAssignmentAction, initial);
  const [, deleteAction] = useFormState(deleteAssignmentAction, initial);

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-3">
        <input type="hidden" name="assignmentId" value={assignment.id} />
        <input type="hidden" name="classId" value={classId} />
        <div>
          <Label htmlFor="name">שם</Label>
          <Input id="name" name="name" defaultValue={assignment.name} required />
        </div>
        <div>
          <Label htmlFor="description">תיאור</Label>
          <Input
            id="description"
            name="description"
            defaultValue={assignment.description ?? ""}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="difficulty">רמת קושי</Label>
            <select
              id="difficulty"
              name="difficulty"
              defaultValue={assignment.difficulty}
              className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="easy">קל</option>
              <option value="medium">בינוני</option>
              <option value="hard">קשה</option>
            </select>
          </div>
          <div>
            <Label htmlFor="type">סוג</Label>
            <select
              id="type"
              name="type"
              defaultValue={assignment.type}
              className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="homework">שיעורי בית</option>
              <option value="quiz">בחינה קטנה</option>
              <option value="project">פרויקט</option>
              <option value="exam">בחינה</option>
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="due_date">תאריך הגשה</Label>
          <Input
            id="due_date"
            name="due_date"
            type="datetime-local"
            defaultValue={assignment.due_date.slice(0, 16)}
            required
          />
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <SaveBtn />
      </form>
      <form action={deleteAction}>
        <input type="hidden" name="assignmentId" value={assignment.id} />
        <input type="hidden" name="classId" value={classId} />
        <Button type="submit" variant="destructive" size="sm">
          מחק משימה
        </Button>
      </form>
    </div>
  );
}
