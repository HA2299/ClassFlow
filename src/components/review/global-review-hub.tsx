"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowUpLeft, BellRing, CheckCircle2, Clock3, Filter, Layers3, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { sendGlobalMissingSubmissionReminders } from "@/app/actions/notifications";

type ReviewAssignment = {
  id: string;
  classId: string;
  name: string;
  className: string;
  submitted: number;
  graded: number;
  totalStudents: number;
  dueDate: string;
  average: number;
  averageGradingHours: number;
};

type HubFilter = "all" | "urgent" | "progress" | "completed";

export function GlobalReviewHub({ assignments }: { assignments: ReviewAssignment[] }) {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [status, setStatus] = useState<HubFilter>("all");
  const [reminderMessage, setReminderMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const classes = useMemo(() => Array.from(new Set(assignments.map((assignment) => assignment.className))), [assignments]);
  const now = Date.now();
  const filtered = useMemo(() => assignments.filter((assignment) => {
    const text = query.trim().toLocaleLowerCase("he");
    const pending = Math.max(0, assignment.submitted - assignment.graded);
    const overdue = new Date(assignment.dueDate).getTime() < now && pending > 0;
    const completed = pending === 0 && assignment.submitted > 0;
    const matchesText = !text || `${assignment.name} ${assignment.className}`.toLocaleLowerCase("he").includes(text);
    const matchesClass = classFilter === "all" || assignment.className === classFilter;
    const matchesStatus = status === "all" || (status === "urgent" ? overdue : status === "progress" ? !completed && pending > 0 : completed);
    return matchesText && matchesClass && matchesStatus;
  }), [assignments, classFilter, now, query, status]);
  const pendingTotal = assignments.reduce((sum, assignment) => sum + Math.max(0, assignment.submitted - assignment.graded), 0);
  const completedTasks = assignments.filter((assignment) => assignment.submitted > 0 && assignment.submitted === assignment.graded).length;
  const averageGradingTime = assignments.filter((assignment) => assignment.averageGradingHours > 0).reduce((sum, assignment, _, list) => sum + assignment.averageGradingHours / list.length, 0);

  function sendGlobalReminders() {
    setReminderMessage("");
    startTransition(() => {
      void sendGlobalMissingSubmissionReminders().then((result) => setReminderMessage(result.error ?? `נשלחו ${result.sent} תזכורות ל-${result.students} תלמידים`));
    });
  }

  return <div className="space-y-5">
    <section className="page-banner review-hero relative isolate overflow-hidden rounded-[2rem] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:p-7"><div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-300 hover:text-white"><ArrowUpLeft className="size-4" /> חזרה לסקירה</Link><div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-100/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-cyan-100"><Layers3 className="size-3.5" /> REVIEW HUB</div><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">מרכז בדיקת ההגשות</h1><p className="mt-2 text-sm text-cyan-50/80">ניהול תור הבדיקה ברמת המטלות והכיתות.</p></div><button type="button" onClick={sendGlobalReminders} disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-amber-950 shadow-lg shadow-amber-950/10 hover:bg-amber-300 disabled:opacity-60"><BellRing className="size-4" />{isPending ? "שולח..." : "שליחת תזכורות לכל החסרים"}</button></div>{reminderMessage && <p className="relative mt-4 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-cyan-50">{reminderMessage}</p>}</section>

    <div className="grid gap-3 sm:grid-cols-3">{[{ label: "הגשות ממתינות", value: pendingTotal, icon: Clock3, tone: "text-amber-600" }, { label: "זמן בדיקה ממוצע", value: averageGradingTime ? `${averageGradingTime.toFixed(1)} ש׳` : "-", icon: Clock3, tone: "text-cyan-700" }, { label: "מטלות שהושלמו", value: completedTasks, icon: CheckCircle2, tone: "text-emerald-600" }].map(({ label, value, icon: Icon, tone }) => <Card key={label} className="surface-card bg-white/85"><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-bold text-slate-500">{label}</p><p className={`mt-1 text-3xl font-black ${tone}`}>{value}</p></div><Icon className={`size-5 ${tone}`} /></CardContent></Card>)}</div>

    <Card className="surface-card overflow-hidden bg-white/85"><CardContent className="p-0"><div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white/95 p-4 backdrop-blur sm:flex-row sm:items-center"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="חיפוש מטלה או כיתה" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" /></label><label className="relative"><Filter className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="h-10 appearance-none rounded-xl border border-slate-200 bg-slate-50 py-0 pl-8 pr-9 text-sm font-bold outline-none"><option value="all">כל הכיתות</option>{classes.map((className) => <option key={className} value={className}>{className}</option>)}</select></label><div className="flex gap-1 rounded-xl bg-slate-100 p-1">{([['all', 'הכול'], ['urgent', 'דחוף'], ['progress', 'בתהליך'], ['completed', 'הושלם']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setStatus(value)} className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${status === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{label}</button>)}</div></div><div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((assignment) => { const pending = Math.max(0, assignment.submitted - assignment.graded); const overdue = new Date(assignment.dueDate).getTime() < now && pending > 0; const progress = assignment.submitted ? Math.round((assignment.graded / assignment.submitted) * 100) : 0; return <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-bold text-cyan-700">{assignment.className}</p><h2 className="mt-1 truncate font-black text-slate-900">{assignment.name}</h2></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${overdue ? "bg-rose-100 text-rose-700" : pending ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{overdue ? "באיחור" : pending ? `${pending} לבדיקה` : "הושלם"}</span></div><div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500"><span>{assignment.graded}/{assignment.submitted || assignment.totalStudents} נבדקו</span><span>{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-cyan-500" style={{ width: `${progress}%` }} /></div><p className={`mt-3 text-xs font-semibold ${overdue ? "text-rose-700" : "text-slate-500"}`}>{overdue ? "עבר מועד ההגשה" : `מועד: ${new Date(assignment.dueDate).toLocaleDateString("he-IL")}`}</p><Link href={`/classes/${assignment.classId}/assignments/${assignment.id}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-black text-white transition hover:bg-cyan-700">התחל בדיקה <ArrowUpLeft className="size-4" /></Link></article>})}</div>{filtered.length === 0 && <div className="p-12 text-center text-sm text-slate-500">לא נמצאו מטלות לפי הסינון.</div>}</CardContent></Card>
  </div>;
}
