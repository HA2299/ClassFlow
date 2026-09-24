"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  Inbox,
  Search,
  Sparkles,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type ReviewSubmission = {
  id: string;
  assignmentId: string;
  classId: string;
  assignmentName: string;
  className: string;
  studentName: string;
  studentInitial: string;
  submittedAt: string;
  status: "submitted" | "graded" | "late";
  score: number | null;
  feedback: string | null;
  answer: string;
};

type ReviewAssignment = {
  id: string;
  classId: string;
  name: string;
  className: string;
  submitted: number;
  graded: number;
  average: number;
};

const statusLabels = { submitted: "ממתינה לבדיקה", graded: "נבדקה", late: "הוגשה באיחור" };

function formatDate(value: string) {
  return new Date(value).toLocaleString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ReviewCenter({
  assignments,
  submissions,
  submittedCount,
  gradedCount,
  pendingReviewCount,
  averageScore,
}: {
  assignments: ReviewAssignment[];
  submissions: ReviewSubmission[];
  submittedCount: number;
  gradedCount: number;
  pendingReviewCount: number;
  averageScore: number;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "graded">("all");
  const [sort, setSort] = useState<"recent" | "oldest" | "name">("recent");
  const [selectedId, setSelectedId] = useState(submissions.find((item) => item.status !== "graded")?.id ?? submissions[0]?.id ?? "");
  const [aiDraft, setAiDraft] = useState("");
  const [aiReady, setAiReady] = useState(false);

  const filteredSubmissions = useMemo(() => submissions
    .filter((item) => `${item.studentName} ${item.assignmentName} ${item.className}`.toLowerCase().includes(query.toLowerCase()))
    .filter((item) => status === "all" || (status === "pending" ? item.status !== "graded" : item.status === "graded"))
    .sort((a, b) => sort === "name" ? a.studentName.localeCompare(b.studentName, "he") : sort === "oldest" ? a.submittedAt.localeCompare(b.submittedAt) : b.submittedAt.localeCompare(a.submittedAt)), [query, sort, status, submissions]);

  const selected = submissions.find((item) => item.id === selectedId) ?? filteredSubmissions[0];
  const selectedIndex = selected ? filteredSubmissions.findIndex((item) => item.id === selected.id) : -1;
  const pendingCount = submissions.filter((item) => item.status !== "graded").length;
  const attentionItems = submissions.filter((item) => item.status !== "graded").slice(0, 3);

  function selectSubmission(id: string) {
    setSelectedId(id);
    setAiDraft("");
    setAiReady(false);
  }

  function moveSelection(direction: number) {
    if (!filteredSubmissions.length) return;
    const next = (selectedIndex + direction + filteredSubmissions.length) % filteredSubmissions.length;
    selectSubmission(filteredSubmissions[next].id);
  }

  async function createAiDraft() {
    if (!selected) return;
    setAiReady(false);
    try {
      const response = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: selected.studentName, assignmentName: selected.assignmentName, answer: selected.answer }),
      });
      const data = (await response.json()) as { feedback?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "שגיאת AI");
      setAiDraft(data.feedback ?? "");
      setAiReady(true);
    } catch (error) {
      setAiDraft(error instanceof Error ? error.message : "לא ניתן ליצור הצעת משוב");
      setAiReady(true);
    }
  }

  return (
    <div className="space-y-5">
      <section className="review-hero relative isolate overflow-hidden rounded-[2rem] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:p-7">
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white"><ArrowUpLeft className="size-4" /> חזרה לסקירה</Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-100/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-cyan-100"><Inbox className="size-3.5" /> REVIEW HUB</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">מרכז בדיקת ההגשות</h1>
            <p className="mt-2 text-sm leading-6 text-cyan-50/80 sm:text-base">כל מה שממתין לבדיקה, מכל הכיתות שלך, במקום אחד מסודר.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[{ icon: Clock3, value: pendingReviewCount, label: "ממתינות", tone: "text-amber-300" }, { icon: CheckCircle2, value: gradedCount, label: "נבדקו", tone: "text-emerald-300" }, { icon: FileText, value: submittedCount, label: "הגשות", tone: "text-cyan-300" }].map(({ icon: Icon, value, label, tone }) => <div key={label} className="review-stat rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center"><Icon className={`mx-auto size-4 ${tone}`} /><p className="mt-1 text-2xl font-black">{value}</p><p className="text-[10px] text-slate-300">{label}</p></div>)}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {[{ label: "סה״כ הגשות", value: submittedCount, hint: "מכל הכיתות", tone: "text-slate-950", icon: FileText }, { label: "תור העבודה שלך", value: pendingCount, hint: `${pendingCount ? "יש הגשות שמחכות לך" : "התור נקי"}`, tone: "text-amber-600", icon: Clock3 }, { label: "ממוצע ציונים", value: averageScore, hint: "בהגשות שנבדקו", tone: "text-cyan-700", icon: CheckCircle2 }].map(({ label, value, hint, tone, icon: Icon }) => <Card key={label} className="kpi-card border-slate-200/70 bg-white/85 shadow-[0_14px_30px_rgba(15,23,42,0.05)]"><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-bold text-slate-500">{label}</p><p className={`mt-1 text-3xl font-black ${tone}`}>{value}</p><p className="mt-0.5 text-xs text-slate-500">{hint}</p></div><span className="flex size-10 items-center justify-center rounded-2xl bg-slate-50 text-cyan-700"><Icon className="size-5" /></span></CardContent></Card>)}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <Card className="border-0 bg-slate-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]"><CardHeader className="p-5 pb-3"><div className="flex items-center justify-between"><div><CardTitle className="text-lg text-white">מה דורש את תשומת לבך?</CardTitle><CardDescription className="mt-1 text-slate-400">הגשות חדשות או שעדיין לא נבדקו.</CardDescription></div><Sparkles className="size-5 text-cyan-300" /></div></CardHeader><CardContent className="space-y-2 p-5 pt-2">{attentionItems.length ? attentionItems.map((item) => <button key={item.id} onClick={() => selectSubmission(item.id)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-right transition hover:bg-cyan-400/10"><span className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-sm font-black text-cyan-200">{item.studentInitial}</span><span className="min-w-0"><span className="block truncate text-sm font-bold">{item.studentName}</span><span className="block truncate text-xs text-slate-400">{item.assignmentName} · {formatDate(item.submittedAt)}</span></span></span><ChevronLeft className="size-4 shrink-0 text-slate-500" /></button>) : <p className="rounded-2xl bg-white/[0.06] p-4 text-sm text-slate-300">אין הגשות שממתינות לבדיקה.</p>}</CardContent></Card>
        <Card className="border-slate-200/70 bg-white/85 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"><CardHeader className="p-5 pb-3"><div className="flex items-center justify-between"><div><CardTitle className="text-lg">התקדמות תור הבדיקה</CardTitle><CardDescription className="mt-1">השלמת {gradedCount} מתוך {submittedCount} הגשות.</CardDescription></div><span className="text-2xl font-black text-cyan-700">{submittedCount ? Math.round((gradedCount / submittedCount) * 100) : 0}%</span></div></CardHeader><CardContent className="p-5 pt-2"><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-cyan-500 transition-all" style={{ width: `${submittedCount ? Math.round((gradedCount / submittedCount) * 100) : 0}%` }} /></div><div className="mt-3 flex justify-between text-xs font-semibold text-slate-500"><span>{gradedCount} נבדקו</span><span>{pendingCount} נשארו בתור</span></div></CardContent></Card>
      </div>

      <Card className="overflow-hidden border-slate-200/70 bg-white/85 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"><CardHeader className="border-b border-slate-200/70 p-5"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><CardTitle className="text-2xl font-black">כל ההגשות</CardTitle><CardDescription className="mt-1">חיפוש מהיר, סינון ומיון לפי סדר העבודה שלך.</CardDescription></div><div className="flex flex-wrap gap-2"><label className="relative min-w-52 flex-1"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="חיפוש תלמיד או משימה" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" /></label><label className="relative"><Filter className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 appearance-none rounded-xl border border-slate-200 bg-slate-50 py-0 pl-8 pr-9 text-sm font-semibold outline-none focus:border-cyan-500"><option value="all">כל הסטטוסים</option><option value="pending">ממתינות לבדיקה</option><option value="graded">נבדקו</option></select></label><label className="relative"><SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="h-10 appearance-none rounded-xl border border-slate-200 bg-slate-50 py-0 pl-8 pr-9 text-sm font-semibold outline-none focus:border-cyan-500"><option value="recent">החדשות קודם</option><option value="oldest">הישנות קודם</option><option value="name">לפי תלמיד</option></select></label></div></div></CardHeader><CardContent className="grid gap-5 p-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-2">{filteredSubmissions.length ? filteredSubmissions.map((item) => <button key={item.id} onClick={() => selectSubmission(item.id)} className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-right transition ${selected?.id === item.id ? "border-cyan-400 bg-cyan-50/70 shadow-sm" : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/30"}`}><span className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-cyan-200">{item.studentInitial}</span><span className="min-w-0"><span className="block truncate font-black text-slate-900">{item.studentName}</span><span className="block truncate text-xs text-slate-500">{item.assignmentName} · {item.className}</span><span className="mt-1 block text-[11px] text-slate-400">{formatDate(item.submittedAt)}</span></span></span><span className="shrink-0 text-left"><span className={`block rounded-full px-2 py-1 text-[10px] font-bold ${item.status === "graded" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{statusLabels[item.status]}</span>{item.score !== null && <span className="mt-1 block text-center text-sm font-black text-slate-900">{item.score}/100</span>}</span></button>) : <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">לא נמצאו הגשות מתאימות.</div>}</div>
          {selected ? <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-cyan-200">{selected.studentInitial}</span><div><h3 className="font-black text-slate-950">{selected.studentName}</h3><p className="text-xs text-slate-500">{selected.assignmentName} · {selected.className}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400"><Clock3 className="size-3" /> הוגש {formatDate(selected.submittedAt)}</p></div></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${selected.status === "graded" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{statusLabels[selected.status]}</span></div><div className="mt-5 rounded-2xl border border-white bg-white p-4"><p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-slate-400">תשובת התלמיד</p><p className="max-h-32 overflow-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">{selected.answer || "לא נכתבה תשובה"}</p></div><div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4"><div className="flex items-center justify-between gap-3"><div><p className="flex items-center gap-1.5 text-sm font-black text-cyan-950"><Sparkles className="size-4 text-cyan-600" /> הצעת משוב AI</p><p className="mt-1 text-xs text-cyan-800/70">טיוטה בלבד. המורה מאשר ועורך לפני שימוש.</p></div><button type="button" onClick={createAiDraft} className="rounded-xl bg-cyan-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-cyan-800">{aiReady ? "צור מחדש" : "הצעת משוב"}</button></div>{aiReady && <textarea value={aiDraft} onChange={(event) => setAiDraft(event.target.value)} rows={3} className="mt-3 w-full resize-none rounded-xl border border-cyan-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />}</div><div className="mt-4 flex items-center justify-between gap-2"><button type="button" onClick={() => moveSelection(-1)} className={buttonVariants({ variant: "outline", size: "sm" })}><ChevronRight className="size-4" /> הקודם</button><span className="text-xs font-semibold text-slate-400">Quick Review · {selectedIndex + 1}/{filteredSubmissions.length}</span><button type="button" onClick={() => moveSelection(1)} className={buttonVariants({ variant: "outline", size: "sm" })}>הבא <ChevronLeft className="size-4" /></button></div><Link href={`/classes/${selected.classId}/assignments/${selected.assignmentId}`} className={`mt-3 w-full ${buttonVariants({ size: "sm" })}`}><UserRound className="size-4" /> פתיחת מסך הבדיקה המלא</Link></div> : <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500">בחרו הגשה כדי להתחיל Quick Review.</div>}
        </CardContent></Card>
      <div className="hidden">{assignments.length}</div>
    </div>
  );
}