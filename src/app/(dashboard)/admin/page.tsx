import { requireAdmin } from "@/lib/auth/session";
import { runRiskDetectionAction } from "@/app/actions/admin";
import { getInstitutionStats } from "@/lib/data/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, ArrowUpRight, BrainCircuit, Users, School, ClipboardCheck } from "lucide-react";

export default async function AdminPage() {
  const profile = await requireAdmin();
  const stats = await getInstitutionStats(profile.institution_id);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_26px_70px_rgba(15,23,42,0.18)] sm:p-8">
        <div className="absolute -right-16 -top-24 size-64 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1 text-[10px] font-bold tracking-[0.22em] text-indigo-200"><Activity className="size-3.5" /> ADMIN CONSOLE</div><h1 className="text-3xl font-black sm:text-4xl">תמונת מצב מוסדית</h1><p className="mt-2 text-sm text-slate-300">{profile.full_name} · ניהול ביצועים, סיכון ופעילות.</p></div><span className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-200">עדכון נתונים בזמן אמת</span></div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-0 bg-white/80 shadow-lg"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">כיתות</CardTitle><School className="size-5 text-cyan-600" /></div></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.classCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white/80 shadow-lg"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">תלמידים</CardTitle><Users className="size-5 text-blue-600" /></div></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.studentCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white/80 shadow-lg"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">מורים</CardTitle><Users className="size-5 text-violet-600" /></div></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.teacherCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white/80 shadow-lg"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">משימות</CardTitle><ClipboardCheck className="size-5 text-emerald-600" /></div></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.assignmentCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <CardHeader>
          <CardTitle>Risk Detection AI</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={runRiskDetectionAction}>
            <Button type="submit"><BrainCircuit className="size-4" /> הרץ זיהוי סיכון <ArrowUpRight className="size-4" /></Button>
          </form>
          <p className="mt-2 text-sm text-muted-foreground">
            מנתח ציונים והגשות ומסמן תלמידים בסיכון
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
