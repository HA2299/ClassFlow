import Link from "next/link";
import {
  getAssignmentById,
  getGradesBySubmissions,
} from "@/lib/data/store";
import { requireProfile } from "@/lib/auth/session";
import {
  getAssignmentSubmissions,
  getTeacherClassById,
  getClassStudents,
} from "@/app/actions/auth";
import { AssignmentReviewWorkspace } from "@/components/classes/assignment-review-workspace";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock3, FileText, GraduationCap, Users, ArrowRight } from "lucide-react";

export default async function AssignmentDetailPage({
  params,
}: {
  params: { id: string; assignmentId: string };
}) {
  const profile = await requireProfile();
  const classItem = await getTeacherClassById(params.id, profile.id);

  if (!classItem) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card/95 p-8 text-center">
        <p className="mb-4 text-lg font-semibold">הכיתה לא נמצאה</p>
        <Link href="/classes" className={buttonVariants()}>
          חזור לכיתות
        </Link>
      </div>
    );
  }

  const [assignment, submissions, students] = await Promise.all([
    getAssignmentById(params.assignmentId),
    getAssignmentSubmissions(params.assignmentId),
    getClassStudents(params.id),
  ]);

  if (!assignment || assignment.class_id !== params.id) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card/95 p-8 text-center">
        <p className="mb-4 text-lg font-semibold">המשימה לא נמצאה</p>
        <Link
          href={`/classes/${params.id}`}
          className={buttonVariants()}
        >
          חזור לכיתה
        </Link>
      </div>
    );
  }

  const grades = await getGradesBySubmissions(submissions.map((submission) => submission.id));

  const dueDate = new Date(assignment.due_date);
  const now = new Date();
  const isOverdue = dueDate < now;
  let submittedCount = 0;
  let gradedCount = 0;
  for (const submission of submissions) {
    if (submission.answer.trim().length > 0 || (submission.attachment_urls?.length ?? 0) > 0) submittedCount += 1;
    if (submission.status === "graded") gradedCount += 1;
  }
  const pendingCount = Math.max(0, students.length - submittedCount);

  const typeLabels = {
    homework: "שיעורי בית",
    quiz: "בחינה קטנה",
    project: "פרויקט",
    exam: "בחינה",
  };

  const difficultyLabels = {
    easy: "קל",
    medium: "בינוני",
    hard: "קשה",
  };

  return (
    <div className="assignment-review-page space-y-6">
      <section className="page-banner min-h-0 review-hero relative isolate overflow-hidden rounded-[1.75rem] border border-cyan-200/15 p-4 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:p-5">
        <div className="review-hero-ring absolute -left-16 -top-24 size-72 rounded-full" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full border border-cyan-200/10 bg-cyan-300/[0.04] shadow-[0_0_0_24px_rgba(103,232,249,0.03)]" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0 max-w-2xl">
            <Link href={`/classes/${params.id}`} className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-cyan-200/30 hover:bg-white/10 hover:text-white"><ArrowRight className="size-3.5" /> חזרה לכיתה</Link>
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-cyan-200/25 bg-cyan-100/10 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-cyan-100">GRADING DESK</span><span className={`rounded-full border px-3 py-1 text-[10px] font-bold ${isOverdue ? "border-rose-300/25 bg-rose-400/10 text-rose-200" : "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"}`}>{isOverdue ? "עבר מועד ההגשה" : "מועד פתוח"}</span></div>
            <h1 className="mt-3 max-w-3xl text-3xl font-black leading-[1.15] tracking-tight sm:text-4xl">{assignment.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300"><span className="rounded-lg bg-white/[0.08] px-2.5 py-1">{typeLabels[assignment.type as keyof typeof typeLabels]}</span><span className="text-cyan-300/50">/</span><span>רמת קושי {difficultyLabels[assignment.difficulty as keyof typeof difficultyLabels]}</span><span className="hidden text-cyan-300/50 sm:inline">/</span><span className="text-slate-400">מרכז הערכה למורה</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:min-w-[25rem]">
            {[{ icon: Users, value: students.length, label: "תלמידים", tone: "text-cyan-300", bg: "bg-cyan-300/10" }, { icon: FileText, value: submittedCount, label: "הגישו", tone: "text-emerald-300", bg: "bg-emerald-300/10" }, { icon: Clock3, value: pendingCount, label: "טרם הגישו", tone: "text-amber-300", bg: "bg-amber-300/10" }, { icon: GraduationCap, value: gradedCount, label: "נבדקו", tone: "text-violet-300", bg: "bg-violet-300/10" }].map(({ icon: Icon, value, label, tone, bg }) => <div key={label} className={`review-stat rounded-2xl border border-white/10 ${bg} px-3 py-2.5 text-center backdrop-blur-md`}><Icon className={`mx-auto size-4 ${tone}`} /><p className="mt-1 text-xl font-black tracking-tight">{value}</p><p className="text-[10px] font-medium text-slate-300">{label}</p></div>)}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2"><span className="text-xs font-semibold text-slate-400">סוג המטלה</span><strong className="text-slate-800">{typeLabels[assignment.type as keyof typeof typeLabels]}</strong></div>
        <span className="hidden h-5 w-px bg-slate-200 sm:block" />
        <div className="flex items-center gap-2"><span className="text-xs font-semibold text-slate-400">רמת קושי</span><strong className="text-slate-800">{difficultyLabels[assignment.difficulty as keyof typeof difficultyLabels]}</strong></div>
        <span className="hidden h-5 w-px bg-slate-200 sm:block" />
        <div className="flex min-w-0 items-center gap-2"><span className="text-xs font-semibold text-slate-400">תאריך הגשה</span><strong className="truncate text-slate-800">{dueDate.toLocaleDateString("he-IL", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</strong></div>
        {isOverdue && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">חלף המועד</span>}
      </div>

        <div className="space-y-4">
          {assignment.description && (
            <Card className="surface-card bg-white/85 p-0">
              <CardHeader className="px-4 pb-1 pt-3 sm:px-5">
                <CardTitle className="flex items-center gap-2 text-base"><span className="h-5 w-1 rounded-full bg-cyan-500" />תיאור המשימה</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1 sm:px-5">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {assignment.description}
                </p>
              </CardContent>
            </Card>
          )}
          <AssignmentReviewWorkspace assignmentId={assignment.id} classId={params.id} submissions={submissions} students={students} grades={grades} />
      </div>
    </div>
  );
}
