"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitAssignmentSolution } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { Assignment, Student, Submission } from "@/types/database";

interface AssignmentSubmissionCardProps {
  assignment: Assignment;
  student: Student;
  existingSubmission?: Submission;
}

function SubmitButton({ existingSubmission }: { existingSubmission?: Submission }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "שולח..." : existingSubmission ? "עדכן הגשה" : "הגש משימה"}
    </Button>
  );
}

function formatStatus(status: Submission["status"]) {
  switch (status) {
    case "graded":
      return { label: "נבדקה", className: "bg-emerald-50 text-emerald-700" };
    case "late":
      return { label: "באיחור", className: "bg-amber-50 text-amber-700" };
    default:
      return { label: "הוגשה", className: "bg-sky-50 text-sky-700" };
  }
}

export function AssignmentSubmissionCard({
  assignment,
  student,
  existingSubmission,
}: AssignmentSubmissionCardProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (formData: FormData) => {
    formData.append("assignmentId", assignment.id);
    formData.append("studentId", student.id);

    const result = await submitAssignmentSolution({}, formData);

    if (result.error) {
      setError(result.error);
      setSuccess("");
      return;
    }

    setError("");
    setSuccess(existingSubmission ? "ההגשה עודכנה בהצלחה" : "ההגשה נשמרה בהצלחה");
  };

  const dueDate = new Date(assignment.due_date);
  const isPastDue = dueDate < new Date();
  const status = existingSubmission ? formatStatus(existingSubmission.status) : null;
  const canSubmit = !isPastDue || Boolean(existingSubmission);

  return (
    <form action={handleSubmit} className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{assignment.name}</h3>
            {status && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                {status.label}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {assignment.description || "לא צורף תיאור נוסף"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            תאריך הגשה: {dueDate.toLocaleDateString("he-IL", { dateStyle: "medium" })}
            {isPastDue && " • עבר המועד"}
          </p>
          {!canSubmit && (
            <p className="mt-1 text-xs text-amber-600">המשימה כבר לא ניתנת להגשה, אך ניתן לראות את התוכן שלה.</p>
          )}
        </div>
        <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {assignment.type === "homework" ? "שיעורי בית" : assignment.type === "quiz" ? "בחינה" : assignment.type === "project" ? "פרויקט" : "מבחן"}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label htmlFor={`answer-${assignment.id}`} className="text-sm font-medium text-foreground">
          תשובת ההגשה
        </label>
        <textarea
          id={`answer-${assignment.id}`}
          name="answer"
          rows={5}
          defaultValue={existingSubmission?.answer ?? ""}
          placeholder="הקלד את הפתרון, ההגשה או התוצרים שלך..."
          className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {error && <p className="mt-3 text-sm text-destructive" aria-live="polite">{error}</p>}
      {success && <p className="mt-3 text-sm text-emerald-600" aria-live="polite">{success}</p>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {existingSubmission
            ? "ההגשה הקודמת שלך תתעדכן במקום הקיים"
            : "ההגשה תישמר אוטומטית במצב דמו"}
        </p>
        <div className="flex items-center gap-2">
          {!canSubmit && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              נעולה
            </span>
          )}
          <SubmitButton existingSubmission={existingSubmission} />
        </div>
      </div>
    </form>
  );
}
