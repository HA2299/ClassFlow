"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, CheckCircle2, Clock3, FileText, Search, Users } from "lucide-react";
import { GradeSubmissionForm } from "@/components/classes/grade-submission-form";
import { sendMissingSubmissionReminders } from "@/app/actions/notifications";
import type { Grade, Student, Submission } from "@/types/database";

const BATCH_SIZE = 12;

type ReviewWorkspaceProps = {
  assignmentId: string;
  classId: string;
  submissions: Submission[];
  students: Student[];
  grades: Grade[];
};

export function AssignmentReviewWorkspace({ assignmentId, classId, submissions, students, grades }: ReviewWorkspaceProps) {
  const gradeMap = useMemo(() => new Map(grades.map((grade) => [grade.submission_id, grade])), [grades]);
  const studentMap = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
  const missingStudents = useMemo(() => students.filter((student) => !submissions.some((submission) => submission.student_id === student.id)), [students, submissions]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "graded">("all");
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [selectedId, setSelectedId] = useState(submissions[0]?.id ?? "");
  const [selectedMissing, setSelectedMissing] = useState<string[]>([]);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderPending, setReminderPending] = useState(false);

  const filteredSubmissions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("he");
    return submissions.filter((submission) => {
      const studentName = studentMap.get(submission.student_id)?.name ?? "תלמיד";
      const matchesQuery = !normalizedQuery || `${studentName} ${submission.answer}`.toLocaleLowerCase("he").includes(normalizedQuery);
      const matchesFilter = filter === "all" || (filter === "graded" ? submission.status === "graded" : submission.status !== "graded");
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, submissions, studentMap]);

  const visibleSubmissions = filteredSubmissions.slice(0, visibleCount);
  const selectedSubmission = submissions.find((submission) => submission.id === selectedId) ?? visibleSubmissions[0];
  const selectedGrade = selectedSubmission ? gradeMap.get(selectedSubmission.id) : undefined;
  const selectedStudent = selectedSubmission ? studentMap.get(selectedSubmission.student_id) : undefined;
  const gradedCount = submissions.filter((submission) => submission.status === "graded").length;

  useEffect(() => {
    if (!selectedSubmission && visibleSubmissions[0]) setSelectedId(visibleSubmissions[0].id);
  }, [selectedSubmission, visibleSubmissions]);

  useEffect(() => {
    function handleNavigation(event: KeyboardEvent) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || !filteredSubmissions.length) return;
      const currentIndex = Math.max(0, filteredSubmissions.findIndex((submission) => submission.id === selectedId));
      const nextIndex = Math.min(filteredSubmissions.length - 1, Math.max(0, currentIndex + (event.key === "ArrowDown" ? 1 : -1)));
      event.preventDefault();
      setSelectedId(filteredSubmissions[nextIndex].id);
    }
    window.addEventListener("keydown", handleNavigation);
    return () => window.removeEventListener("keydown", handleNavigation);
  }, [filteredSubmissions, selectedId]);

  function toggleMissingStudent(studentId: string) {
    setSelectedMissing((current) => current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]);
  }

  function sendReminders() {
    setReminderPending(true);
    setReminderMessage("");
    void sendMissingSubmissionReminders(classId, assignmentId, selectedMissing.length ? selectedMissing : undefined).then((result) => {
      setReminderPending(false);
      setReminderMessage(result.error ?? (result.sent ? `נשלחו ${result.sent} תזכורות` : "התזכורות נרשמו במערכת"));
    });
  }

  return (
    <section className="surface-card overflow-hidden rounded-[1.5rem] bg-white/85">
      <div className="border-b border-slate-200/80 bg-slate-50/80 px-4 py-4 sm:px-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><h2 className="text-xl font-black text-slate-950">מרכז הבדיקה</h2><p className="mt-1 text-xs text-slate-500">{gradedCount} מתוך {submissions.length} הגשות נבדקו · חיצי המקלדת עוברים בין תלמידים</p></div>
          <span className="rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">{submissions.length - gradedCount} ממתינות</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-cyan-500" style={{ width: `${submissions.length ? Math.round((gradedCount / submissions.length) * 100) : 0}%` }} /></div>
      </div>

      <div className="grid min-h-[34rem] lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.38fr)]" dir="rtl">
        <div className="order-2 min-w-0 border-t border-slate-200/80 p-4 lg:order-1 lg:border-t-0 lg:border-r lg:p-5">
          {selectedSubmission ? <div className="space-y-4"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-cyan-200">{(selectedStudent?.name ?? "תלמיד").charAt(0)}</span><div><h3 className="font-black text-slate-950">{selectedStudent?.name ?? "תלמיד"}</h3><p className="text-xs text-slate-500">הוגש {new Date(selectedSubmission.submitted_at || selectedSubmission.created_at).toLocaleString("he-IL")}</p></div></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedSubmission.status === "graded" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{selectedSubmission.status === "graded" ? "נבדק" : "ממתין לבדיקה"}</span></div><div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-slate-400">תשובת התלמיד</p><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{selectedSubmission.answer || "לא נכתבה תשובה"}</p></div>{selectedSubmission.attachment_urls?.length ? <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/60 p-3"><p className="text-xs font-bold text-cyan-800">קבצים מצורפים</p>{selectedSubmission.attachment_urls.map((url, index) => <a key={`${url}-${index}`} href={`/api/submissions/file?path=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-sm text-cyan-800 underline"><FileText className="size-4" />{selectedSubmission.attachment_names?.[index] ?? `קובץ ${index + 1}`}</a>)}</div> : null}<GradeSubmissionForm submissionId={selectedSubmission.id} assignmentId={assignmentId} classId={classId} defaultScore={selectedGrade?.score} defaultFeedback={selectedGrade?.feedback ?? undefined} /></div> : <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">בחרו תלמיד מהרשימה כדי להתחיל.</div>}
        </div>

        <aside className="order-1 flex min-h-0 flex-col border-b border-slate-200/80 bg-slate-50/60 p-3 lg:order-2 lg:max-h-[calc(100vh-10rem)] lg:border-b-0 lg:border-l">
          <div className="sticky top-0 z-10 bg-slate-50/95 pb-3 backdrop-blur"><label className="relative block"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(BATCH_SIZE); }} placeholder="חיפוש תלמיד" className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-9 pl-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" /></label><div className="mt-2 flex gap-1 rounded-xl bg-slate-200/70 p-1">{([['all', 'הכול'], ['pending', 'ממתינות'], ['graded', 'נבדקו']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => { setFilter(value); setVisibleCount(BATCH_SIZE); }} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold ${filter === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{label}</button>)}</div></div><div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">{visibleSubmissions.map((submission) => { const student = studentMap.get(submission.student_id); const active = submission.id === selectedId; return <button key={submission.id} type="button" onClick={() => setSelectedId(submission.id)} className={`flex w-full items-center gap-2 rounded-xl border p-2.5 text-right transition ${active ? "border-cyan-400 bg-cyan-50 shadow-sm" : "border-slate-200 bg-white hover:border-cyan-200"}`}><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-cyan-200">{(student?.name ?? "תלמיד").charAt(0)}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{student?.name ?? "תלמיד"}</span><span className={`mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold ${submission.status === "graded" ? "text-emerald-700" : "text-amber-700"}`}>{submission.status === "graded" ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}{submission.status === "graded" ? "נבדק" : "ממתין לבדיקה"}</span></span>{gradeMap.get(submission.id) && <strong className="text-sm text-slate-900">{gradeMap.get(submission.id)?.score}</strong>}</button>; })}{visibleCount < filteredSubmissions.length && <button type="button" onClick={() => setVisibleCount((count) => count + BATCH_SIZE)} className="w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-xs font-black text-cyan-800 hover:bg-cyan-50">הצג עוד ({visibleSubmissions.length} מתוך {filteredSubmissions.length})</button>}</div><div className="mt-3 border-t border-slate-200 pt-3"><p className="mb-2 flex items-center gap-1.5 text-xs font-black text-slate-700"><Users className="size-3.5" /> לא הוגש ({missingStudents.length})</p>{missingStudents.slice(0, 8).map((student) => <label key={student.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-white"><input type="checkbox" checked={selectedMissing.includes(student.id)} onChange={() => toggleMissingStudent(student.id)} className="size-3.5 rounded border-slate-300 text-cyan-600" />{student.name}</label>)}{missingStudents.length > 8 && <p className="mt-1 text-[10px] text-slate-400">מוצגים 8 ראשונים; ניתן לשלוח לכולם.</p>}{missingStudents.length > 0 && <button type="button" onClick={sendReminders} disabled={reminderPending} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-60"><BellRing className="size-3.5" />{reminderPending ? "שולח..." : selectedMissing.length ? `תזכורת ל־${selectedMissing.length}` : "תזכורת לכולם"}</button>}{reminderMessage && <p className="mt-2 text-[10px] font-semibold text-slate-500">{reminderMessage}</p>}</div>
        </aside>
      </div>
    </section>
  );
}
