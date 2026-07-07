"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createAssignment } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateAssignmentFormProps {
  classId: string;
  onSuccess?: () => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} size="sm">
      {pending ? "יוצר..." : "צור משימה"}
    </Button>
  );
}

export function CreateAssignmentForm({
  classId,
  onSuccess,
}: CreateAssignmentFormProps) {
  const [error, setError] = useState<string>("");

  const handleSubmit = async (formData: FormData) => {
    formData.append("classId", classId);
    const result = await createAssignment({}, formData);
    if (result.error) {
      setError(result.error);
    } else {
      setError("");
      const form = document.querySelector("form");
      if (form) form.reset();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="assignment-name" className="text-sm">
          שם המשימה*
        </Label>
        <Input
          id="assignment-name"
          name="name"
          placeholder="לדוגמה: שיעורי בית - משוואות"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="assignment-desc" className="text-sm">
          תיאור
        </Label>
        <Input
          id="assignment-desc"
          name="description"
          placeholder="הוסף הוראות או פרטים"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="assignment-type" className="text-sm">
            סוג*
          </Label>
          <select
            id="assignment-type"
            name="type"
            defaultValue="homework"
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            required
          >
            <option value="homework">שיעורי בית</option>
            <option value="quiz">בחינה קטנה</option>
            <option value="project">פרויקט</option>
            <option value="exam">בחינה</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="assignment-difficulty" className="text-sm">
            רמת קושי
          </Label>
          <select
            id="assignment-difficulty"
            name="difficulty"
            defaultValue="medium"
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="easy">קל</option>
            <option value="medium">בינוני</option>
            <option value="hard">קשה</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="assignment-due" className="text-sm">
          תאריך הגשה*
        </Label>
        <Input
          id="assignment-due"
          name="due_date"
          type="datetime-local"
          required
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <SubmitButton />
    </form>
  );
}
