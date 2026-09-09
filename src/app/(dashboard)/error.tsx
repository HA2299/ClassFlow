"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.1)]">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><AlertTriangle className="size-7" /></span>
        <h1 className="mt-5 text-xl font-black text-slate-900">משהו השתבש בטעינת המסך</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">הנתונים לא נטענו הפעם. נסו שוב, ואם הבעיה ממשיכה פנו למנהל המערכת.</p>
        <Button type="button" onClick={reset} className="mt-6"><RefreshCw className="size-4" /> נסו שוב</Button>
      </div>
    </div>
  );
}