"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addStudentToClass } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddStudentFormProps {
  classId: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} size="sm">
      {pending ? "מוסיף..." : "הוסף תלמיד"}
    </Button>
  );
}

export function AddStudentForm({ classId }: AddStudentFormProps) {
  const [state, formAction] = useState({ error: "" });

  const handleSubmit = async (formData: FormData) => {
    formData.append("classId", classId);
    const result = await addStudentToClass({}, formData);
    if (result.error) {
      alert(result.error);
    } else {
      const form = document.querySelector("form");
      if (form) form.reset();
      alert("התלמיד נוסף בהצלחה!");
    }
  };

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-sm">
          שם התלמיד
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="הכנס שם"
          required
          disabled={false}
          size="sm"
        />
      </div>
      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
