import Link from "next/link";
import { requireStudent } from "@/lib/auth/session";
import {
  getClassAssignments,
  getStudentAverage,
  getStudentGrades,
} from "@/app/actions/auth";
import { getLinkedStudentRecord } from "@/app/actions/students";
import { getClassById, getSubmissionsByAssignment } from "@/lib/data/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { AiHelper } from "@/components/student/ai-helper";

export default async function StudentDashboardPage() {
  const profile = await requireStudent();
  const student = await getLinkedStudentRecord(profile.id);

  if (!student) {
    return <p className="text-slate-500">לא נמצא רשומת תלמיד מקושרת.</p>;
  }

  const classItem = await getClassById(student.class_id);
  const assignments = await getClassAssignments(student.class_id);
  const grades = await getStudentGrades(student.id);
  const average = await getStudentAverage(student.id);

  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const activeAssignments = sortedAssignments.filter(
    (a) => new Date(a.due_date).getTime() >= Date.now()
  );

  const submissionChecks = await Promise.all(
    sortedAssignments.map(async (a) => {
      const subs = await getSubmissionsByAssignment(a.id);
      const sub = subs.find((s) => s.student_id === student.id);
      return Boolean(sub?.answer?.trim() || sub?.attachment_urls?.length);
    })
  );
  const submittedCount = submissionChecks.filter(Boolean).length;

  const upcomingAssignments = activeAssignments.slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#0f766e)] p-6 text-white shadow-[0_30px_80px_rgba(37,99,235,0.25)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.28em] text-blue-100">
              STUDENT PORTAL
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              שלום, {profile.full_name}
            </h1>
            <p className="mt-2 text-sm text-blue-100/85 sm:text-base">
              {classItem?.name ?? "כיתה"} — המעקב והניהול שלך
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/student/assignments" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              לכל המשימות
            </Link>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-lg">
              <p className="text-xs text-blue-100/80">ממוצע כללי</p>
              <p className="text-3xl font-black">{average}%</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">משימות פתוחות</span>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                Active
              </span>
            </div>
            <p className="text-4xl font-black text-slate-900">{activeAssignments.length}</p>
          </div>
        </Card>

        <Card className="border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">הגשות</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                Done
              </span>
            </div>
            <p className="text-4xl font-black text-slate-900">{submittedCount}</p>
          </div>
        </Card>

        <Card className="border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">ציונים</span>
              <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700">
                Avg
              </span>
            </div>
            <p className="text-4xl font-black text-slate-900">{average}%</p>
            <p className="text-xs text-slate-500">{grades.length} ציונים</p>
          </div>
        </Card>
      </div>

      <Card className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">משימות קרובות</CardTitle>
          <CardDescription>מבט מהיר, בלי להעמיס על הדאשבורד</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAssignments.length > 0 ? (
            <ul className="space-y-3">
              {upcomingAssignments.map((assignment) => (
                <li
                  key={assignment.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{assignment.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(assignment.due_date).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                    לקראת הגשה
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              אין משימות קרובות. אפשר להתרכז בלמידה או לבקש עזרה מה-AI.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">ריכוז מסכם</CardTitle>
            <CardDescription>תצוגת מצב מהירה ולא עמוסה</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">משימות פתוחות</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{activeAssignments.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">הגשות שבוצעו</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{submittedCount}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
              <p className="text-xs text-blue-700">המלצה</p>
              <p className="mt-2 text-sm text-slate-700">
                אפשר להיכנס לעמוד המשימות לקבלת תצוגה מלאה ומסודרת של כל המשימות לפי תאריך.
              </p>
            </div>
          </CardContent>
        </Card>

        <AiHelper studentName={profile.full_name} />
      </div>
    </div>
  );
}
