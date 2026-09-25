"use client";

import { useState } from "react";
import { CalendarDays, List } from "lucide-react";
import type { Assignment, Submission } from "@/types/database";

export function AssignmentTimeline({ assignments, submissions }: { assignments: Assignment[]; submissions: Array<Submission | undefined> }) {
  const [timeline, setTimeline] = useState(false);
  if (!timeline) return <button type="button" onClick={() => setTimeline(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-cyan-300 hover:text-cyan-700"><CalendarDays className="size-4" /> תצוגת ציר זמן</button>;
  return <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4"><div className="mb-3 flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-black text-cyan-950"><CalendarDays className="size-4" /> ציר הזמן הקרוב</p><button type="button" onClick={() => setTimeline(false)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-cyan-700 hover:bg-white"><List className="size-3.5" /> רשימה</button></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{assignments.slice(0, 9).map((assignment, index) => <a key={assignment.id} href={`#assignment-${assignment.id}`} className="rounded-xl border border-white bg-white p-3 text-right hover:border-cyan-300"><p className="truncate text-sm font-black text-slate-900">{assignment.name}</p><p className="mt-1 text-xs text-slate-500">{new Date(assignment.due_date).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}</p><span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${submissions[index] ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{submissions[index] ? "הוגש" : "ממתין"}</span></a>)}</div></div>;
}