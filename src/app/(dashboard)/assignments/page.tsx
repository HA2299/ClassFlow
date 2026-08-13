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

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.3em] text-blue-600">
              ASSIGNMENTS
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              משימות
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              כל המשימות בכיתות שלך
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/assignments"
              className={buttonVariants({
                variant: searchParams.class ? "outline" : "default",
                size: "sm",
              })}
            >
              הכל
            </Link>
            {classes.map((c) =>
              c ? (
                <Link
                  key={c.id}
                  href={`/assignments?class=${c.id}`}
                  className={buttonVariants({
                    variant: searchParams.class === c.id ? "default" : "outline",
                    size: "sm",
                  })}
                >
                  {c.name}
                </Link>
              ) : null
            )}
          </div>
        </div>
      </section>

      {filtered.length > 0 ? (
        <Card className="overflow-hidden border-0 bg-white/80 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <CardHeader className="border-b border-slate-200/80 bg-slate-50/80 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl text-slate-900">רשימת משימות</CardTitle>
              </div>
              <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                {filtered.length} פעיל(ות)
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
                      <tr key={assignment.id} className="border-t border-slate-200 bg-white/50 transition hover:bg-slate-50/80">
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                              {assignment.name.charAt(0) || "M"}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900">{assignment.name}</p>
                              <p className="text-xs text-slate-500">מועד אחרון: {dueDate.toLocaleDateString("he-IL")}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle text-slate-700">
                          {classItem?.name ?? "כיתה"}
                        </td>
                        <td className="px-6 py-4 align-middle text-slate-700">
                          {dueDate.toLocaleDateString("he-IL")}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
                              isUpcoming
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-700",
                            ].join(" ")}
                          >
                            {isUpcoming ? "פתוחה" : "הסתיימה"}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex justify-center">
                            <Link
                              href={`/classes/${assignment.class_id}/assignments/${assignment.id}`}
                              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                            >
                              פתיחה
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
