import Link from "next/link";
import { requireTeacher } from "@/lib/auth/session";
import { getTeacherAssignmentsSummary } from "@/app/actions/assignments";
import { getClassById } from "@/lib/data/store";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpLeft, CheckCircle2, ClipboardList, Clock3, Layers3, Sparkles } from "lucide-react";

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: { class?: string };
}) {
  const profile = await requireTeacher();
  const { assignments } = await getTeacherAssignmentsSummary(profile.id);
  const classIds = Array.from(new Set(assignments.map((a) => a.class_id)));
  const classes = (
    await Promise.all(classIds.map((id) => getClassById(id)))
  ).filter((c): c is NonNullable<typeof c> => c !== null);

  const classMap = new Map(classes.map((c) => [c.id, c]));

  const filtered = searchParams.class
    ? assignments.filter((a) => a.class_id === searchParams.class)
    : assignments;
  const now = Date.now();
  const openCount = assignments.filter((assignment) => new Date(assignment.due_date).getTime() >= now).length;
  const completedCount = assignments.length - openCount;
  const nextDue = assignments
    .filter((assignment) => new Date(assignment.due_date).getTime() >= now)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  return (
    <div className="space-y-5">
      <section className="page-banner relative isolate overflow-hidden rounded-[2rem] border border-cyan-200/15 bg-[linear-gradient(135deg,#0f172a,#164e63_58%,#0f766e)] p-5 text-white shadow-[0_26px_70px_rgba(15,23,42,0.2)] sm:p-7">
        <div className="pointer-events-none absolute -left-16 -top-20 -z-10 size-64 rounded-full border border-cyan-200/15 shadow-[0_0_0_22px_rgba(103,232,249,0.035),0_0_0_44px_rgba(103,232,249,0.02)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-100/10 px-3 py-1 text-[10px] font-black tracking-[0.22em] text-cyan-100"><ClipboardList className="size-3.5" /> TEACHER WORKSPACE</div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">משימות</h1>
            <p className="mt-2 text-sm text-cyan-50/75 sm:text-base">כל המשימות בכיתות שלך, עם תמונת מצב ברורה של מה פתוח ומה הסתיים.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[23rem] sm:gap-3">
            {[{ icon: Layers3, value: assignments.length, label: "סה״כ", tone: "text-cyan-300" }, { icon: Clock3, value: openCount, label: "פתוחות", tone: "text-amber-300" }, { icon: CheckCircle2, value: completedCount, label: "הסתיימו", tone: "text-emerald-300" }].map(({ icon: Icon, value, label, tone }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur-sm"><Icon className={`mx-auto size-4 ${tone}`} /><p className="mt-1 text-2xl font-black">{value}</p><p className="text-[10px] text-slate-300">{label}</p></div>)}
          </div>
        </div>
        {nextDue && <div className="relative mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-2.5 text-xs text-cyan-50/80"><Sparkles className="size-4 shrink-0 text-cyan-300" /><span>המשימה הקרובה: <strong className="text-white">{nextDue.name}</strong> עד {new Date(nextDue.due_date).toLocaleDateString("he-IL")}</span></div>}
      </section>

      <section className="surface-card flex flex-col gap-3 rounded-2xl bg-white/80 p-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><span className="flex size-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700"><Layers3 className="size-4" /></span>סינון לפי כיתה</div>
        <div className="flex flex-wrap gap-1.5">
            <Link
              href="/assignments"
              className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${searchParams.class ? "text-slate-500 hover:bg-slate-50" : "bg-slate-950 text-white shadow-sm"}`}
            >
              הכל
            </Link>
            {classes.map((c) =>
              c ? (
                <Link
                  key={c.id}
                  href={`/assignments?class=${c.id}`}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${searchParams.class === c.id ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  {c.name}
                </Link>
              ) : null
            )}
          </div>
      </section>

      {filtered.length > 0 ? (
        <Card className="surface-card overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardHeader className="border-b border-slate-200/80 bg-slate-50/80 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900"><ClipboardList className="size-5 text-cyan-700" /> רשימת משימות</CardTitle>
                <p className="mt-1 text-xs text-slate-500">בחרו שורה כדי לפתוח את מרכז הבדיקה.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">
                {filtered.length} משימות
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-separate border-spacing-0 text-right">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold tracking-[0.2em] text-slate-500">
                    <th className="px-6 py-4">משימה</th>
                    <th className="px-6 py-4">כיתה</th>
                    <th className="px-6 py-4">מועד הגשה</th>
                    <th className="px-6 py-4">סטטוס</th>
                    <th className="px-6 py-4 text-center">פעולה</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((assignment) => {
                    const classItem = classMap.get(assignment.class_id);
                    const dueDate = new Date(assignment.due_date);
                    const isUpcoming = dueDate.getTime() >= Date.now();

                    return (
                      <tr key={assignment.id} className="row-action border-t border-slate-200 bg-white/50">
                        <td className="relative px-6 py-4 align-middle">
                          <Link aria-label={`פתיחת ${assignment.name}`} href={`/classes/${assignment.class_id}/assignments/${assignment.id}`} className="absolute inset-0 z-0" />
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-sm font-black text-cyan-700 ring-1 ring-cyan-100">
                              {assignment.name.charAt(0) || "M"}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900">{assignment.name}</p>
                              <p className="text-xs text-slate-500">מועד אחרון: {dueDate.toLocaleDateString("he-IL")}</p>
                            </div>
                          </div>
                        </td>
                        <td className="relative z-10 px-6 py-4 align-middle text-slate-700">
                          {classItem?.name ?? "כיתה"}
                        </td>
                        <td className="relative z-10 px-6 py-4 align-middle text-slate-700">
                          {dueDate.toLocaleDateString("he-IL")}
                        </td>
                        <td className="relative z-10 px-6 py-4 align-middle">
                          <span
                            className={[
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold",
                              isUpcoming
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-700",
                            ].join(" ")}
                          >
                            {isUpcoming ? <><Clock3 className="size-3" /> פתוחה</> : <><CheckCircle2 className="size-3" /> הסתיימה</>}
                          </span>
                        </td>
                        <td className="relative z-10 px-6 py-4 align-middle">
                          <div className="flex justify-center">
                            <Link
                              href={`/classes/${assignment.class_id}/assignments/${assignment.id}`}
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                            >
                              פתיחה <ArrowUpLeft className="size-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-slate-300 bg-white/80 shadow-[0_20px_45px_rgba(15,23,42,0.04)]">
          <CardContent className="flex min-h-52 items-center justify-center text-center">
            <div>
              <p className="text-lg font-semibold text-slate-700">אין משימות להצגה.</p>
              <p className="mt-2 text-sm text-slate-500">
                תוכל ליצור משימה חדשה או לשנות את פילטר הכיתות.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
