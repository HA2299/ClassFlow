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
import { AssignmentSubmissionCard } from "@/components/student/assignment-submission-card";
import { ArrowLeft, CheckCircle2, Clock3, ListChecks, Sparkles, Target } from "lucide-react";

export default async function StudentAssignmentsPage() {
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

  const submissionsByAssignment = await Promise.all(
    sortedAssignments.map(async (assignment) => {
      const subs = await getSubmissionsByAssignment(assignment.id);
      return subs.find((s) => s.student_id === student.id);
    })
  );

  const submittedCount = submissionsByAssignment.filter(Boolean).length;
  const gradedCount = grades.filter((grade) =>
    sortedAssignments.some((assignment) => assignment.id === grade.assignment_id)
  ).length;
  const openAssignments = sortedAssignments.filter((assignment) => new Date(assignment.due_date).getTime() >= Date.now());
  const nextAssignment = sortedAssignments.find((assignment, index) => !submissionsByAssignment[index]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:p-8">
        <div className="absolute -left-16 -top-24 size-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold tracking-[0.24em] text-cyan-200">
              <Sparkles className="size-3.5" /> MY LEARNING BOARD
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">המשימות שלי</h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">{classItem?.name ?? "כיתה"} · מרחב אישי לכל מה שצריך להגיש, להשלים ולשפר.</p>
          </div>

          <div className="relative flex flex-wrap gap-3">
            <Link href="/student" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              חזרה לדשבורד <ArrowLeft className="size-4" />
            </Link>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-lg">
              <p className="text-xs text-blue-100/80">ממוצע</p>
              <p className="text-3xl font-black">{average}%</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">סה״כ משימות</span>
              <ListChecks className="size-5 text-blue-600" />
            </div>
            <p className="text-4xl font-black text-slate-900">{sortedAssignments.length}</p>
            <p className="text-xs text-slate-500">{openAssignments.length} פתוחות כרגע</p>
          </div>
        </Card>

        <Card className="border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">ציונים</span>
              <Target className="size-5 text-violet-600" />
            </div>
            <p className="text-4xl font-black text-slate-900">{average}%</p>
            <p className="text-xs text-slate-500">{grades.length} ציונים</p>
          </div>
        </Card>

        <Card className="border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">סטטוס</span>
              <CheckCircle2 className="size-5 text-emerald-600" />
            </div>
            <p className="text-4xl font-black text-slate-900">{gradedCount}</p>
            <p className="text-xs text-slate-500">הגשות שנבדקו · {submittedCount} הוגשו</p>
          </div>
        </Card>
      </div>

      {nextAssignment && (
        <section className="flex flex-col justify-between gap-4 rounded-[1.75rem] border border-cyan-200 bg-gradient-to-l from-cyan-50 via-white to-white p-5 shadow-[0_18px_45px_rgba(8,145,178,0.08)] sm:flex-row sm:items-center">
          <div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"><Clock3 className="size-5" /></span><div><p className="text-xs font-bold tracking-wide text-cyan-700">הצעד הבא שלך</p><h2 className="mt-1 font-black text-slate-950">השלימו את {nextAssignment.name}</h2><p className="mt-1 text-sm text-slate-500">מועד הגשה: {new Date(nextAssignment.due_date).toLocaleDateString("he-IL", { dateStyle: "medium" })}</p></div></div>
          <a href={`#assignment-${nextAssignment.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700">להתחיל עכשיו <ArrowLeft className="size-4" /></a>
        </section>
      )}

      <Card className="border-0 bg-white/80 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-end justify-between gap-3"><div><CardTitle className="text-xl font-black text-slate-900">כל המשימות</CardTitle><CardDescription className="mt-1">התחילו מהמשימה הקרובה ביותר והתקדמו בקצב שלכם.</CardDescription></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{submittedCount}/{sortedAssignments.length} הוגשו</span></div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedAssignments.length > 0 ? (
            sortedAssignments.map((assignment, index) => (
              <AssignmentSubmissionCard
                key={assignment.id}
                assignment={assignment}
                student={student}
                existingSubmission={submissionsByAssignment[index]}
                grade={grades.find((grade) => grade.assignment_id === assignment.id)}
              />
            ))
          ) : (
            <p className="text-sm text-slate-500">אין משימות כרגע.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
