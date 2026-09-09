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

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#0f766e)] p-6 text-white shadow-[0_30px_80px_rgba(37,99,235,0.25)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.28em] text-blue-100">
              ASSIGNMENTS
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              כל המשימות שלי
            </h1>
            <p className="mt-2 text-sm text-blue-100/85 sm:text-base">
              {classItem?.name ?? "כיתה"} • {sortedAssignments.length} משימות
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/student" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              חזרה לדשבורד
            </Link>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-lg">
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
              <span className="text-sm text-slate-500">סה״כ</span>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                משימות
              </span>
            </div>
            <p className="text-4xl font-black text-slate-900">{sortedAssignments.length}</p>
          </div>
        </Card>

        <Card className="border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">ציונים</span>
              <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700">
                ממוצע
              </span>
            </div>
            <p className="text-4xl font-black text-slate-900">{average}%</p>
            <p className="text-xs text-slate-500">{grades.length} ציונים</p>
          </div>
        </Card>

        <Card className="border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">סטטוס</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                פתוחות
              </span>
            </div>
            <p className="text-4xl font-black text-slate-900">
              {sortedAssignments.filter((a) => new Date(a.due_date).getTime() >= Date.now()).length}
            </p>
            <p className="text-xs text-slate-500">פתוחות כרגע</p>
          </div>
        </Card>
      </div>

      <Card className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">המשימות שלי</CardTitle>
          <CardDescription>כל המשימות מסודרות לפי תאריך</CardDescription>
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
