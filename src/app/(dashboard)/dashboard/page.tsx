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

export default async function DashboardPage() {
  const profile = await requireTeacher();
  const dashboard = await getDashboardData(profile.id);
  const recentClasses = await getTeacherRecentClasses(profile.id, 5);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(30,64,175,0.98),rgba(14,116,144,0.94),rgba(13,148,136,0.9))] p-6 text-white shadow-[0_30px_80px_rgba(37,99,235,0.24)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.28em] text-blue-100">
              CLASSFLOW INSIGHTS
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                דאשבורד מורה
              </h1>
              <p className="mt-2 max-w-xl text-sm text-blue-100/85 sm:text-base">
                סקירה יומית של הכיתות, ההגשות והפעילות הלימודית שלך.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/classes/new" className={buttonVariants({ size: "sm" })}>
              + כיתה חדשה
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
        <Card className="relative overflow-hidden border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-600 to-cyan-500" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">כיתות פעילות</span>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                Live
              </span>
            </div>
            <p className="text-4xl font-black text-slate-900">{dashboard.classCount}</p>
            <p className="text-xs text-slate-500">סה&quot;כ כיתות תחת ניהול</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-rose-500 to-orange-400" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">תלמידים בסיכון</span>
              <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700">
                Review
              </span>
            </div>
            <p className="text-4xl font-black text-rose-600">
              {dashboard.atRiskStudents.length}
            </p>
            <p className="text-xs text-slate-500">דורשים תשומת לב</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-emerald-500 to-teal-400" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">משימות פעילות</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                Open
              </span>
            </div>
            <p className="text-4xl font-black text-slate-900">
              {dashboard.activeAssignments.length}
            </p>
            <p className="text-xs text-slate-500">ממתינות להערכה</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-violet-500 to-fuchsia-500" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">הישגים</span>
              <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700">
                AI
              </span>
            </div>
            <p className="text-4xl font-black text-slate-900">92%</p>
            <p className="text-xs text-slate-500">שיעור הגשה ממוצע</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AtRiskAlert students={dashboard.atRiskStudents} />
        <ActiveAssignments assignments={dashboard.activeAssignments} />
      </div>

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
