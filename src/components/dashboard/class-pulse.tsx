"use client";

import { useState } from "react";
import { ArrowUpLeft, CheckCircle2, Loader2, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

type Pulse = {
  score: number;
  headline: string;
  summary: string;
  brightSpot: string;
  actions: string[];
};

export function ClassPulse() {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generatePulse = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/class-pulse", { method: "POST" });
      const data = (await response.json()) as { pulse?: Pulse; error?: string };
      if (!response.ok || !data.pulse) throw new Error(data.error || "לא ניתן ליצור תמונת מצב");
      setPulse(data.pulse);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "לא ניתן ליצור תמונת מצב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="pulse-card overflow-hidden rounded-[2rem] border border-cyan-200/70 bg-[linear-gradient(135deg,#082f49_0%,#164e63_52%,#0f766e_100%)] text-white shadow-[0_28px_70px_rgba(8,47,73,0.22)]">
      <div className="relative p-6 sm:p-8">
        <div className="pointer-events-none absolute -left-12 -top-16 size-48 rounded-full border-[20px] border-cyan-300/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-white/10 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-cyan-100">
              <Sparkles className="size-3.5" /> CLASS PULSE
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">מה הכיתות שלך צריכות עכשיו?</h2>
            <p className="max-w-xl text-sm leading-6 text-cyan-50/80">תמונת מצב מצטברת למורה שמחברת בין ההגשות, המעורבות והתלמידים שדורשים תשומת לב בכל הכיתות.</p>
          </div>
          <Button type="button" onClick={generatePulse} disabled={loading} className="shrink-0 gap-2 bg-white text-slate-950 hover:bg-cyan-50">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "מנתח את כל הכיתות..." : pulse ? "רענן תמונת מצב" : "הפעל Class Pulse"}
          </Button>
        </div>

        {error && <p className="mt-5 rounded-2xl border border-rose-200/30 bg-rose-950/20 px-4 py-3 text-sm text-rose-100" role="alert">{error}</p>}

        {pulse && (
          <div className="relative mt-7 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="pulse-reveal absolute -right-2 -top-28 hidden size-44 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-200/10 p-3 lg:flex">
              <div className="flex size-full items-center justify-center rounded-full border border-cyan-200/20 bg-slate-950/20">
                <div className="text-center"><p className="text-4xl font-black tracking-tight">{pulse.score}</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">pulse score</p></div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-cyan-950"><Target className="size-5" /></span>
                <div><p className="text-xs font-bold text-cyan-200">הכיוון המרכזי · {pulse.score}/100</p><h3 className="mt-1 text-xl font-black">{pulse.headline}</h3><p className="mt-2 text-sm leading-6 text-cyan-50/80">{pulse.summary}</p></div>
              </div>
              <div className="mt-5 flex gap-3 rounded-2xl border border-emerald-200/20 bg-emerald-300/10 p-3 text-sm text-emerald-50"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" /><span>{pulse.brightSpot}</span></div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-slate-950/15 p-5">
              <p className="text-xs font-bold text-cyan-200">שלושת הצעדים הבאים</p>
              <ol className="mt-3 space-y-3">
                {pulse.actions.map((action, index) => <li key={`${action}-${index}`} className="flex gap-3 text-sm leading-5 text-white/90"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-black">{index + 1}</span><span>{action}</span><ArrowUpLeft className="mt-0.5 size-4 shrink-0 text-cyan-300" /></li>)}
              </ol>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}