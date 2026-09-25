"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitAssignmentSolution } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { Assignment, Grade, Student, Submission } from "@/types/database";
import type { ResourceItem } from "@/lib/resources";
import { Award, FileText, Lightbulb, MessageSquareText, Sparkles } from "lucide-react";

interface AssignmentSubmissionCardProps {
  assignment: Assignment;
  student: Student;
  existingSubmission?: Submission;
  grade?: Grade;
  resources?: ResourceItem[];
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

type SubmissionVersion = { answer: string; attachmentNames: string[]; savedAt: string };

export function AssignmentSubmissionCard({
  assignment,
  student,
  existingSubmission,
  grade,
  resources = [],
}: AssignmentSubmissionCardProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"response" | "feedback" | "attachments">("response");
  const [versions, setVersions] = useState<SubmissionVersion[]>([]);
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!existingSubmission) return;
    try {
      const stored = window.localStorage.getItem(`classflow-submission-versions-${assignment.id}`);
      setVersions(stored ? (JSON.parse(stored) as SubmissionVersion[]) : []);
    } catch {
      setVersions([]);
    }
  }, [assignment.id, existingSubmission]);

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
    if (existingSubmission) {
      const version: SubmissionVersion = { answer: existingSubmission.answer, attachmentNames: existingSubmission.attachment_names ?? [], savedAt: new Date().toISOString() };
      const nextVersions = [version, ...versions].slice(0, 5);
      setVersions(nextVersions);
      window.localStorage.setItem(`classflow-submission-versions-${assignment.id}`, JSON.stringify(nextVersions));
    }
    setSuccess(existingSubmission ? "ההגשה עודכנה בהצלחה" : "ההגשה נשמרה בהצלחה");
  };

  async function askTutor(question: string) {
    setAiLoading(true);
    setAiAnswer("");
    try {
      const response = await fetch("/api/ai/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentName: student.name, question: `${question}\n\nמשימה: ${assignment.name}\nתשובה שלי:\n${existingSubmission?.answer ?? "עדיין לא הוגשה תשובה"}${grade?.feedback ? `\n\nמשוב המורה:\n${grade.feedback}` : ""}` }) });
      const data = (await response.json()) as { answer?: string; error?: string };
      setAiAnswer(response.ok ? data.answer ?? "לא התקבלה תשובה" : data.error ?? "לא ניתן לקבל הסבר");
    } catch {
      setAiAnswer("לא ניתן להתחבר לעוזר הלמידה כרגע.");
    } finally {
      setAiLoading(false);
    }
  }

  const dueDate = new Date(assignment.due_date);
  const isPastDue = dueDate < new Date();
  const status = grade
    ? formatStatus("graded")
    : existingSubmission
      ? formatStatus(existingSubmission.status)
      : null;
  const typeLabel =
    assignment.type === "homework"
      ? "שיעורי בית"
      : assignment.type === "quiz"
        ? "בוחן"
        : assignment.type === "project"
          ? "פרויקט"
          : "מבחן";
  const relatedResources = resources.filter((resource) => {
    const haystack = `${resource.title} ${resource.description} ${resource.tags.join(" ")}`.toLocaleLowerCase("he");
    return assignment.name.split(/\s+/).some((term) => term.length > 2 && haystack.includes(term.toLocaleLowerCase("he"))) || resource.tags.some((tag) => assignment.description?.toLocaleLowerCase("he").includes(tag.toLocaleLowerCase("he")));
  }).slice(0, 2);

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
          <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${status ? status.className : isPastDue ? "border-rose-200/30 bg-rose-400/20 text-rose-100" : "border-amber-200/30 bg-amber-400/20 text-amber-100"}`}>{status?.label ?? (isPastDue ? "עבר מועד ההגשה" : "מועד קרוב")}</span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <p className="text-sm leading-relaxed text-slate-600">
          {assignment.description || "לא צורף תיאור נוסף."}
        </p>

        {grade && (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-l from-emerald-50 to-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                  <Award className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-emerald-700">הציון שלך</p>
                  <p className="text-2xl font-black text-slate-950">{grade.score}<span className="text-sm font-bold text-slate-400">/{grade.max_score}</span></p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">הוחזר עם משוב</span>
            </div>
            {grade.feedback && <div className="mt-4 flex flex-wrap gap-2 border-t border-emerald-100 pt-3"><button type="button" onClick={() => setActiveTab("feedback")} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800"><MessageSquareText className="size-4" /> משוב מהמורה</button><button type="button" onClick={() => askTutor("הסבר לי את משוב המורה בצורה פשוטה") } className="inline-flex items-center gap-1.5 rounded-xl bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800"><Sparkles className="size-4" /> הסבר AI</button><button type="button" onClick={() => askTutor("איך אפשר לשפר את התשובה שלי?")} className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-100 px-3 py-2 text-xs font-bold text-cyan-800"><Lightbulb className="size-4" /> איך להשתפר?</button></div>}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2"><button type="button" onClick={() => setActiveTab("response")} className={`tab-indicator rounded-xl px-3 py-2 text-xs font-bold ${activeTab === "response" ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}>התשובה שלי</button><button type="button" onClick={() => setActiveTab("feedback")} className={`tab-indicator rounded-xl px-3 py-2 text-xs font-bold ${activeTab === "feedback" ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}>משוב מורה</button><button type="button" onClick={() => setActiveTab("attachments")} className={`tab-indicator rounded-xl px-3 py-2 text-xs font-bold ${activeTab === "attachments" ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}>קבצים והיסטוריה</button></div>

        {activeTab === "feedback" && <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4"><p className="flex items-center gap-2 text-sm font-black text-emerald-900"><MessageSquareText className="size-4" /> משוב מורה</p><p className="text-sm leading-7 text-slate-700">{grade?.feedback ?? "עדיין אין משוב מהמורה."}</p>{(aiAnswer || aiLoading) && <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm leading-6 text-violet-950">{aiLoading ? "העוזר מנתח את המשוב..." : aiAnswer}</div>}</div>}
        {activeTab === "response" && <div className="space-y-2">
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
        </div>}

        {relatedResources.length > 0 && <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-3"><p className="flex items-center gap-2 text-xs font-black text-cyan-900"><Sparkles className="size-4" /> חומרי עזר מומלצים</p><div className="mt-2 flex flex-wrap gap-2">{relatedResources.map((resource) => <a key={resource.id} href={resource.url ?? "#"} target={resource.url ? "_blank" : undefined} rel={resource.url ? "noreferrer" : undefined} className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-xs font-bold text-cyan-800 hover:border-cyan-400">{resource.title}</a>)}</div></div>}

        {activeTab === "attachments" && <div className="space-y-3">
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
                        href={`/api/submissions/file?path=${encodeURIComponent(existingSubmission.attachment_urls[index])}`}
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
          {versions.length > 0 && <div className="rounded-2xl border border-slate-200 bg-white p-3"><p className="mb-2 flex items-center gap-2 text-xs font-black text-slate-700"><FileText className="size-4" /> גרסאות קודמות</p><div className="space-y-2">{versions.map((version, index) => <details key={`${version.savedAt}-${index}`} className="rounded-xl bg-slate-50 p-2 text-xs"><summary className="cursor-pointer font-bold text-slate-700">גרסה {versions.length - index} · {new Date(version.savedAt).toLocaleString("he-IL")}</summary><p className="mt-2 whitespace-pre-wrap leading-6 text-slate-600">{version.answer || "ללא טקסט"}</p></details>)}</div></div>}
        </div>}

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
