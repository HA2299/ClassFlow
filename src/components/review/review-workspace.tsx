"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpLeft, BellRing, CheckCircle2, Clock3, FileText, Inbox, Search, Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GradeSubmissionForm } from "@/components/classes/grade-submission-form";
import { sendMissingSubmissionReminders } from "@/app/actions/notifications";
import type { Grade, Student } from "@/types/database";
import type { ReviewSubmission } from "@/components/review/review-center";

const BATCH_SIZE = 12;
const statusLabels = { submitted: "ממתינה לבדיקה", graded: "נבדקה", late: "הוגשה באיחור" } as const;

function formatDate(value: string) {
  return new Date(value).toLocaleString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ReviewWorkspace({
  submissions,
  students,
  grades,
  submittedCount,
  gradedCount,
  pendingReviewCount,
}: {
  submissions: ReviewSubmission[];
  students: Student[];
  grades: Grade[];
  submittedCount: number;
  gradedCount: number;
  pendingReviewCount: number;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "graded">("all");
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [selectedId, setSelectedId] = useState(submissions.find((item) => item.status !== "graded")?.id ?? submissions[0]?.id ?? "");
  const [aiDraft, setAiDraft] = useState("");
  const [aiReady, setAiReady] = useState(false);
  const [selectedMissing, setSelectedMissing] = useState<string[]>([]);
  const [reminderPending, setReminderPending] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const gradeMap = useMemo(() => new Map(grades.map((grade) => [grade.submission_id, grade])), [grades]);
  const selected = submissions.find((item) => item.id === selectedId);

  const filtered = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("he");
    return submissions.filter((item) => {
      const matchesText = !text || `${item.studentName} ${item.assignmentName} ${item.className}`.toLocaleLowerCase("he").includes(text);
      const matchesFilter = filter === "all" || (filter === "graded" ? item.status === "graded" : item.status !== "graded");
      return matchesText && matchesFilter;
    });
  }, [filter, query, submissions]);
  const visible = filtered.slice(0, visibleCount);
  const selectedIndex = Math.max(0, filtered.findIndex((item) => item.id === selectedId));
  const selectedGrade = selected ? gradeMap.get(selected.id) : undefined;
  const missingStudents = selected
    ? students.filter((student) => student.class_id === selected.classId && !submissions.some((item) => item.assignmentId === selected.assignmentId && item.studentId === student.id))
    : [];

  useEffect(() => {
    if (!selected && visible[0]) setSelectedId(visible[0].id);
  }, [selected, visible]);

  useEffect(() => {
    function navigate(event: KeyboardEvent) {
      if (!selected || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const next = Math.min(filtered.length - 1, Math.max(0, selectedIndex + (event.key === "ArrowDown" ? 1 : -1)));
      event.preventDefault();
      setSelectedId(filtered[next]?.id ?? selected.id);
    }
    window.addEventListener("keydown", navigate);
    return () => window.removeEventListener("keydown", navigate);
  }, [filtered, selected, selectedIndex]);

  function select(id: string) {
    setSelectedId(id);
    setAiDraft("");
    setAiReady(false);
    setSelectedMissing([]);
  }

  async function suggestFeedback() {
    if (!selected) return;
    setAiReady(false);
    try {
      const response = await fetch("/api/ai/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentName: selected.studentName, assignmentName: selected.assignmentName, answer: selected.answer }) });
      const data = (await response.json()) as { feedback?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "שגיאת AI");
      setAiDraft(data.feedback ?? "");
    } catch (error) {
      setAiDraft(error instanceof Error ? error.message : "לא ניתן ליצור הצעת משוב");
    } finally {
      setAiReady(true);
    }
  }

  return (
    <div className="space-y-5">
      <section className="page-banner review-hero relative isolate overflow-hidden rounded-[2rem] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:p-7"><div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-300 hover:text-white"><ArrowUpLeft className="size-4" /> חזרה לסקירה</Link><div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-100/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-cyan-100"><Inbox className="size-3.5" /> REVIEW HUB</div><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">מרכז בדיקת ההגשות</h1><p className="mt-2 text-sm text-cyan-50/80">רשימת תלמידים ממוקדת ופאנל בדיקה שממלא את המסך.</p></div><div className="grid grid-cols-3 gap-2 sm:gap-3">{[{ icon: Clock3, value: pendingReviewCount, label: "ממתינות", tone: "text-amber-300" }, { icon: CheckCircle2, value: gradedCount, label: "נבדקו", tone: "text-emerald-300" }, { icon: FileText, value: submittedCount, label: "הגשות", tone: "text-cyan-300" }].map(({ icon: Icon, value, label, tone }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center"><Icon className={`mx-auto size-4 ${tone}`} /><p className="mt-1 text-2xl font-black">{value}</p><p className="text-[10px] text-slate-300">{label}</p></div>)}</div></div></section>

      <Card className="overflow-hidden border-slate-200/70 bg-white/85 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"><CardContent className="grid min-h-[calc(100vh-22rem)] p-0 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.38fr)]" dir="rtl">
        <div className="order-2 min-w-0 border-t border-slate-200/80 p-4 lg:order-1 lg:border-t-0 lg:border-r lg:p-6">{selected ? <div className="space-y-4"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-cyan-200">{selected.studentInitial}</span><div><h2 className="font-black text-slate-950">{selected.studentName}</h2><p className="text-xs text-slate-500">{selected.assignmentName} · {selected.className}</p><p className="mt-1 text-[11px] text-slate-400">הוגש {formatDate(selected.submittedAt)}</p></div></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${selected.status === "graded" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{statusLabels[selected.status]}</span></div><div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-slate-400">תשובת התלמיד</p><p className="max-h-52 overflow-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">{selected.answer || "לא נכתבה תשובה"}</p></div><div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4"><div className="flex items-center justify-between gap-3"><div><p className="flex items-center gap-1.5 text-sm font-black text-cyan-950"><Sparkles className="size-4 text-cyan-600" /> הצעת משוב AI</p><p className="mt-1 text-xs text-cyan-800/70">טיוטה בלבד, לא נשמרת עד אישור המורה.</p></div><button type="button" onClick={suggestFeedback} className="rounded-xl bg-cyan-700 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-800">{aiReady ? "צור מחדש" : "הצעת משוב"}</button></div>{aiReady && <textarea value={aiDraft} onChange={(event) => setAiDraft(event.target.value)} rows={3} className="mt-3 w-full resize-none rounded-xl border border-cyan-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-cyan-500" />}</div><GradeSubmissionForm submissionId={selected.id} assignmentId={selected.assignmentId} classId={selected.classId} defaultScore={selectedGrade?.score} defaultFeedback={selectedGrade?.feedback ?? undefined} /></div> : <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">בחרו הגשה מהרשימה כדי להתחיל.</div>}</div>

        <aside className="order-1 flex min-h-0 flex-col border-b border-slate-200/80 bg-slate-50/60 p-3 lg:order-2 lg:max-h-[calc(100vh-10rem)] lg:border-b-0 lg:border-l"><div className="sticky top-0 z-10 bg-slate-50/95 pb-3 backdrop-blur"><label className="relative block"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(BATCH_SIZE); }} placeholder="חיפוש תלמיד, משימה או כיתה" className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-9 pl-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" /></label><div className="mt-2 flex gap-1 rounded-xl bg-slate-200/70 p-1">{([['all', 'הכול'], ['pending', 'ממתינות'], ['graded', 'נבדקו']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => { setFilter(value); setVisibleCount(BATCH_SIZE); }} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold ${filter === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{label}</button>)}</div><p className="mt-2 text-[11px] font-semibold text-slate-500">מציג {visible.length} מתוך {filtered.length} הגשות</p></div><div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">{visible.map((item) => <button key={item.id} type="button" onClick={() => select(item.id)} className={`flex w-full items-center gap-2 rounded-xl border p-2.5 text-right transition ${item.id === selectedId ? "border-cyan-400 bg-cyan-50 shadow-sm" : "border-slate-200 bg-white hover:border-cyan-200"}`}><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-cyan-200">{item.studentInitial}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{item.studentName}</span><span className="block truncate text-[10px] text-slate-500">{item.assignmentName}</span><span className={`mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold ${item.status === "graded" ? "text-emerald-700" : "text-amber-700"}`}>{item.status === "graded" ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}{statusLabels[item.status]}</span></span>{item.score !== null && <strong className="text-sm text-slate-900">{item.score}</strong>}</button>)}{visibleCount < filtered.length && <button type="button" onClick={() => setVisibleCount((count) => count + BATCH_SIZE)} className="w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-xs font-black text-cyan-800 hover:bg-cyan-50">הצג עוד ({visible.length} מתוך {filtered.length})</button>}</div><div className="mt-3 border-t border-slate-200 pt-3"><p className="mb-2 flex items-center gap-1.5 text-xs font-black text-slate-700"><Users className="size-3.5" /> תלמידים ללא הגשה</p>{selected && missingStudents.slice(0, 6).map((student) => <label key={student.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-white"><input type="checkbox" checked={selectedMissing.includes(student.id)} onChange={() => setSelectedMissing((current) => current.includes(student.id) ? current.filter((id) => id !== student.id) : [...current, student.id])} className="size-3.5 rounded border-slate-300 text-cyan-600" />{student.name}</label>)}{selected && missingStudents.length > 0 && <button type="button" onClick={() => { setReminderPending(true); void sendMissingSubmissionReminders(selected.classId, selected.assignmentId, selectedMissing.length ? selectedMissing : undefined).then((result) => { setReminderPending(false); setReminderMessage(result.error ?? (result.sent ? `נשלחו ${result.sent} תזכורות` : "התזכורות נרשמו במערכת")); }); }} disabled={reminderPending} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-60"><BellRing className="size-3.5" />{reminderPending ? "שולח..." : "שלח תזכורת"}</button>}{reminderMessage && <p className="mt-2 text-[10px] font-semibold text-slate-500">{reminderMessage}</p>}</div>
        </aside>
      </CardContent></Card>
    </div>
  );
}
