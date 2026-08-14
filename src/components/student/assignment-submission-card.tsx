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
      return { label: "נבדקה", className: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" };
    case "late":
      return { label: "באיחור", className: "bg-amber-100 text-amber-700 ring-1 ring-amber-200" };
    default:
      return { label: "הוגשה", className: "bg-sky-100 text-sky-700 ring-1 ring-sky-200" };
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

    const result = (await submitAssignmentSolution({}, formData)) ?? {};

    if (result?.error) {
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
  const typeLabel =
    assignment.type === "homework"
      ? "שיעורי בית"
      : assignment.type === "quiz"
        ? "בוחן"
        : assignment.type === "project"
          ? "פרויקט"
          : "מבחן";

  return (
<form
  id={`assignment-${assignment.id}`}
  action={handleSubmit}
  className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_18px_35px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(15,23,42,0.08)]"
>
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 via-blue-900 to-sky-700 p-4 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold tracking-[0.2em] text-sky-100">
                {typeLabel}
              </span>
              {status && (
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}>
                  {status.label}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold tracking-tight">{assignment.name}</h3>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 px-2.5 py-2 text-right backdrop-blur-sm">
            <p className="text-[10px] text-sky-100">מועד הגשה</p>
            <p className="mt-1 text-sm font-semibold">{dueDate.toLocaleDateString("he-IL", { dateStyle: "medium" })}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <p className="text-sm leading-relaxed text-slate-600">
          {assignment.description || "לא צורף תיאור נוסף."}
        </p>

        <div className="space-y-2">
          <label htmlFor={`answer-${assignment.id}`} className="text-sm font-semibold text-slate-700">
            תשובת ההגשה
          </label>
          <textarea
            id={`answer-${assignment.id}`}
            name="answer"
            rows={4}
            defaultValue={existingSubmission?.answer ?? ""}
            placeholder="הקלד את הפתרון, ההגשה או התוצרים שלך..."
            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 shadow-inner outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor={`attachment-${assignment.id}`} className="text-sm font-semibold text-slate-700">
            קבצים מצורפים
          </label>
          <input
            id={`attachment-${assignment.id}`}
            name="attachment"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.ppt,.pptx,.zip,.txt"
            className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
          />
          {existingSubmission?.attachment_names && existingSubmission.attachment_names.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p className="mb-2 font-semibold text-slate-700">קבצים קיימים:</p>
              <ul className="space-y-1.5">
                {existingSubmission.attachment_names.map((name, index) => (
                  <li key={`${name}-${index}`}>
                    {existingSubmission.attachment_urls?.[index] ? (
                      <a
                        href={existingSubmission.attachment_urls[index]}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-700 underline underline-offset-2"
                      >
                        <span>📎</span>
                        <span>{name}</span>
                      </a>
                    ) : (
                      <span>{name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600" aria-live="polite">{error}</p>}
        {success && <p className="text-sm text-emerald-600" aria-live="polite">{success}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">
            {isPastDue ? "הזמן עבר — אפשר להגיש עדכון" : "ההגשה תישמר אוטומטית"}
          </p>
          <SubmitButton existingSubmission={existingSubmission} />
        </div>
      </div>
    </form>
  );
}
