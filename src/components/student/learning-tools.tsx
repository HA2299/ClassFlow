"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LearningTools({ average, gradedCount }: { average: number; gradedCount: number }) {
  const [target, setTarget] = useState(85);
  const [futureGrades, setFutureGrades] = useState<number[]>([]);
  useEffect(() => {
    const storedTarget = window.localStorage.getItem("classflow-student-target");
    if (storedTarget) setTarget(Number(storedTarget));
  }, []);
  const projectedAverage = useMemo(() => {
    if (futureGrades.length === 0) return average;
    return Math.round((average * gradedCount + futureGrades.reduce((sum, grade) => sum + grade, 0)) / (gradedCount + futureGrades.length));
  }, [average, futureGrades, gradedCount]);
  const goalProgress = target > 0 ? Math.min(100, Math.round((average / target) * 100)) : 0;

  return (
    <Card className="surface-card bg-white/80 backdrop-blur-xl">
      <CardHeader className="p-5 pb-3"><div className="flex items-center justify-between"><div><CardTitle className="text-lg">מרכז ההתקדמות האישית</CardTitle><CardDescription>יעד, ממוצע ותרחישי ציונים במקום אחד.</CardDescription></div><Target className="size-5 text-cyan-600" /></div></CardHeader>
      <CardContent className="grid gap-4 p-5 pt-0 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center justify-between"><p className="text-sm font-black text-slate-900">יעד אישי</p><Target className="size-4 text-cyan-600" /></div>
          <div className="flex items-end justify-between gap-3"><div><p className="text-xs text-slate-500">ממוצע נוכחי</p><p className="text-3xl font-black text-slate-950">{average}%</p></div><label className="text-left text-xs font-semibold text-slate-500">יעד<input type="number" min={1} max={100} value={target} onChange={(event) => { const value = Number(event.target.value) || 0; setTarget(value); window.localStorage.setItem("classflow-student-target", String(value)); }} className="mt-1 block h-9 w-20 rounded-lg border border-slate-200 bg-white px-2 text-center font-black text-slate-900 outline-none focus:border-cyan-500" /></label></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-cyan-500 to-blue-600 transition-all" style={{ width: `${goalProgress}%` }} /></div>
          <p className="text-xs text-slate-500">{average >= target ? "הגעתם ליעד. המשיכו לשמור על הקצב." : `עוד ${target - average} נקודות כדי להגיע ליעד.`}</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-black text-violet-950">What-If ציונים</p><Calculator className="size-4 text-violet-600" /></div><div className="flex items-center gap-2"><input type="number" min={0} max={100} placeholder="ציון עתידי" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-500" onKeyDown={(event) => { if (event.key === "Enter") { const value = Number(event.currentTarget.value); if (value >= 0 && value <= 100) { setFutureGrades((current) => [...current, value]); event.currentTarget.value = ""; } } }} /><button type="button" onClick={() => setFutureGrades((current) => sliceLast(current))} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white">נקה</button></div><div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2"><span className="flex items-center gap-1.5 text-xs font-semibold text-violet-700"><TrendingUp className="size-4" /> ממוצע חזוי</span><strong className="text-xl text-violet-800">{projectedAverage}%</strong></div></div>
      </CardContent>
    </Card>
  );
}

function sliceLast<T>(items: T[]) {
  return items.slice(0, -1);
}