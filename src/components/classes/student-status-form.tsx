"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateStudentStatus } from "@/app/actions/students";
import type { AuthActionState } from "@/app/actions/auth";
import type { Student } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initial: AuthActionState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "שומר..." : "עדכן סטטוס"}
    </Button>
  );
}

export function StudentStatusForm({
  student,
  classId,
}: {
  student: Student;
  classId: string;
}) {
  const [state, action] = useFormState(updateStudentStatus, initial);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="studentId" value={student.id} />
      <input type="hidden" name="classId" value={classId} />
      <div>
        <Label htmlFor="status">סטטוס</Label>
        <select
          id="status"
          name="status"
          defaultValue={student.status}
          className="flex h-8 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="active">רגיל</option>
          <option value="at_risk">בסיכון</option>
          <option value="inactive">לא פעיל</option>
        </select>
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <SubmitBtn />
    </form>
  );
}
