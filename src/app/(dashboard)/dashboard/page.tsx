import Link from "next/link";
import { requireTeacher } from "@/lib/auth/session";
import { getDashboardData } from "@/app/actions/dashboard";
import { getTeacherRecentClasses } from "@/app/actions/auth";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AtRiskAlert } from "@/components/dashboard/at-risk-alert";
import { ActiveAssignments } from "@/components/dashboard/active-assignments";
import { RecentSubmissions } from "@/components/dashboard/recent-submissions";
import { ClassPulse } from "@/components/dashboard/class-pulse";
import { Activity, ArrowUpLeft, ClipboardCheck, ShieldAlert, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const profile = await requireTeacher();
  const dashboard = await getDashboardData(profile.id);
  const recentClasses = await getTeacherRecentClasses(profile.id, 5);

  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(15,23,42,0.99),rgba(30,64,175,0.97)_52%,rgba(13,148,136,0.92))] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:p-8">
        <div className="pointer-events-none absolute -left-16 -top-24 -z-10 size-72 rounded-full border border-cyan-200/15 shadow-[0_0_0_26px_rgba(103,232,249,0.035),0_0_0_52px_rgba(103,232,249,0.025)]" />
        <div className="pointer-events-none absolute -bottom-28 right-16 -z-10 size-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-100/10 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-cyan-100">
              <Sparkles className="size-3.5" /> CLASSFLOW / TODAY
            </div>
            <div>
              <h1 className="max-w-xl text-3xl font-black tracking-tight sm:text-5xl">
                תמונת מצב של כל הכיתות שלך
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/80 sm:text-base">
                כל מה שצריך כדי לזהות מומנטום, לתפוס פערים ולתת לתלמידים את הצעד הבא בזמן.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link href="/classes/new" className={buttonVariants({ size: "sm" })}>
              + כיתה חדשה <ArrowUpLeft className="size-4" />
            </Link>
            <Link
              href="/assignments"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              משימות
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="kpi-card group relative overflow-hidden border border-white/70 bg-white/75 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-blue-600 to-cyan-400" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Activity className="size-5" /></span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">קצב פעילות</span>
            </div>
            <div><p className="text-4xl font-black tracking-tight text-slate-950">{dashboard.classCount}</p><p className="mt-1 text-xs font-medium text-slate-500">כיתות תחת ניהול</p></div>
          </div>
        </Card>

        <Card className="kpi-card group relative overflow-hidden border border-white/70 bg-white/75 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-rose-500 to-orange-400" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><ShieldAlert className="size-5" /></span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">מוקד תשומת לב</span>
            </div>
            <div><p className="text-4xl font-black tracking-tight text-rose-600">{dashboard.atRiskStudents.length}</p><p className="mt-1 text-xs font-medium text-slate-500">תלמידים לבדיקה</p></div>
          </div>
        </Card>

        <Card className="kpi-card group relative overflow-hidden border border-white/70 bg-white/75 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-emerald-500 to-teal-400" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><ClipboardCheck className="size-5" /></span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">תור עבודה</span>
            </div>
            <div><p className="text-4xl font-black tracking-tight text-slate-950">{dashboard.activeAssignments.length}</p><p className="mt-1 text-xs font-medium text-slate-500">משימות פעילות</p></div>
          </div>
        </Card>

        <Card className="kpi-card group relative overflow-hidden border border-white/70 bg-white/75 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-violet-500 to-fuchsia-500" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700"><Sparkles className="size-5" /></span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">מדד מעורבות</span>
            </div>
            <div><p className="text-4xl font-black tracking-tight text-slate-950">{dashboard.submissionRate}%</p><p className="mt-1 text-xs font-medium text-slate-500">שיעור הגשה ממוצע</p></div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AtRiskAlert students={dashboard.atRiskStudents} />
        <ActiveAssignments assignments={dashboard.activeAssignments} />
      </div>

      <ClassPulse />

      <RecentSubmissions submissions={dashboard.recentSubmissions} />

      <Card className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-slate-900">כיתות אחרונות</CardTitle>
          <CardDescription>הכיתות שיצרת לאחרונה</CardDescription>
        </CardHeader>
        <CardContent>
          {recentClasses.length > 0 ? (
            <ul className="space-y-3">
              {recentClasses.map((classItem) => (
                <li
                  key={classItem.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{classItem.name}</p>
                    <p className="text-xs text-slate-500">כיתה פעילה</p>
                  </div>
                  <Link
                    href={`/classes/${classItem.id}`}
                    className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    פתיחה
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              עדיין אין כיתות.{" "}
              <Link href="/classes/new" className="font-medium text-blue-600 hover:underline">
                צור כיתה ראשונה
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
