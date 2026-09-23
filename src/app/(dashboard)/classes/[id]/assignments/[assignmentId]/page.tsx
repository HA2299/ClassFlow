import Link from "next/link";
import {
  getAssignmentById,
  getGradeBySubmission,
} from "@/lib/data/store";
import { requireProfile } from "@/lib/auth/session";
import {
  getAssignmentSubmissions,
  getTeacherClassById,
  getClassStudents,
} from "@/app/actions/auth";
import { GradeSubmissionForm } from "@/components/classes/grade-submission-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, CheckCircle2, ChevronDown, Clock3, FileText, GraduationCap, ListChecks, Users } from "lucide-react";

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

  const assignment = await getAssignmentById(params.assignmentId);
  const submissions = await getAssignmentSubmissions(params.assignmentId);
  const students = await getClassStudents(params.id);
  const gradeMap = Object.fromEntries(
    (await Promise.all(
      submissions.map(async (submission) => [submission.id, await getGradeBySubmission(submission.id)] as const)
    )).filter((entry): entry is readonly [string, NonNullable<typeof entry[1]>] => Boolean(entry[1]))
  );

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

  const dueDate = new Date(assignment.due_date);
  const now = new Date();
  const isOverdue = dueDate < now;
  const submittedCount = submissions.filter(
    (item) => item.answer.trim().length > 0 || (item.attachment_urls?.length ?? 0) > 0
  ).length;
  const gradedCount = submissions.filter((item) => item.status === "graded").length;
  const pendingCount = Math.max(0, students.length - submittedCount);
  const ungradedCount = Math.max(0, submittedCount - gradedCount);
  const submissionRate = students.length > 0 ? Math.round((submittedCount / students.length) * 100) : 0;
  const averageSubmittedScore =
    Object.values(gradeMap).length > 0
      ? Math.round(
          Object.values(gradeMap).reduce((total, grade) => total + grade.score, 0) /
            Object.values(gradeMap).length
        )
      : 0;

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
    <div className="assignment-review-page space-y-8">
      <section className="review-hero relative overflow-hidden rounded-[2rem] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:p-8">
        <div className="review-hero-ring absolute -left-16 -top-24 size-72 rounded-full" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <Link href={`/classes/${params.id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 transition hover:text-white"><ArrowRight className="size-4" /> חזרה לכיתה</Link>
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-cyan-100">GRADING DESK</span>{isOverdue ? <span className="rounded-full bg-rose-400/15 px-3 py-1 text-xs font-bold text-rose-200">עבר מועד ההגשה</span> : <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">מועד פתוח</span>}</div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">{assignment.name}</h1>
            <p className="mt-3 text-sm text-slate-300">{typeLabels[assignment.type as keyof typeof typeLabels]} <span className="mx-2 text-cyan-300/50">/</span> רמת קושי {difficultyLabels[assignment.difficulty as keyof typeof difficultyLabels]}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {[{ icon: Users, value: students.length, label: "תלמידים", tone: "text-cyan-300" }, { icon: FileText, value: submittedCount, label: "הגישו", tone: "text-emerald-300" }, { icon: Clock3, value: pendingCount, label: "טרם הגישו", tone: "text-amber-300" }, { icon: GraduationCap, value: gradedCount, label: "נבדקו", tone: "text-violet-300" }].map(({ icon: Icon, value, label, tone }) => <div key={label} className="review-stat rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur-sm"><Icon className={`mx-auto size-4 ${tone}`} /><p className="mt-2 text-2xl font-black">{value}</p><p className="text-[10px] text-slate-300">{label}</p></div>)}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {assignment.description && (
            <Card className="border-slate-200/70 bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <CardHeader>
                <CardTitle>תיאור המשימה</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {assignment.description}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 bg-transparent p-0 shadow-none">
            <CardHeader className="rounded-[1.75rem] border border-slate-200/70 bg-white/70 px-5 py-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)] sm:px-6">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-950">מרכז הבדיקה</CardTitle>
                  <CardDescription className="mt-1">עברו על ההגשות, תנו ציון והשאירו משוב במקום אחד.</CardDescription>
                </div>
                <span className="w-fit rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">{ungradedCount} ממתינות לבדיקה</span>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600"><span>התקדמות בדיקה</span><span>{gradedCount}/{submittedCount} הגשות</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-cyan-500 transition-all" style={{ width: `${submittedCount > 0 ? Math.round((gradedCount / submittedCount) * 100) : 0}%` }} /></div>
                <p className="mt-2 text-[11px] text-slate-500">{pendingCount > 0 ? `${pendingCount} תלמידים עדיין לא הגישו.` : "כל התלמידים הגישו את המשימה."}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-0">
              {submissions.length > 0 ? (
                submissions.map((submission) => {
                  const student = students.find((s) => s.id === submission.student_id);
                  const grade = gradeMap[submission.id];
                  const statusLabel =
                    submission.status === "graded"
                      ? "מדורג"
                      : submission.status === "late"
                        ? "באיחור"
                        : "הוגש";

                  return (
                    <details key={submission.id} open={submission.status !== "graded"} className="submission-card group overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-l from-slate-50 to-white px-5 py-4 transition hover:bg-cyan-50/30">
                        <div className="flex items-center gap-3">
                          <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-cyan-300">{(student?.name ?? "תלמיד").charAt(0)}</span>
                          <div>
                          <p className="font-black text-slate-900">{student?.name ?? "תלמיד"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.submitted_at || submission.created_at).toLocaleString("he-IL")}
                          </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {grade && (
                            <span className="flex items-baseline gap-1 rounded-2xl bg-emerald-100 px-3 py-1.5 text-emerald-800">
                              <strong className="text-xl font-black">{grade.score}</strong><span className="text-xs font-bold">/{grade.max_score}</span>
                            </span>
                          )}
                          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${submission.status === "graded" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                            {submission.status === "graded" ? <CheckCircle2 className="size-3.5" /> : <Clock3 className="size-3.5" />}
                            {statusLabel}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-400"><ListChecks className="size-3.5" /> <span className="hidden sm:inline">פתיחה לבדיקה</span><ChevronDown className="submission-chevron size-4" /></span>
                      </summary>

                      <div className="px-5 pt-5"><p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-slate-400">תשובת התלמיד</p><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{submission.answer || "לא נכתבה תשובה"}</p></div>

                      {submission.attachment_urls && submission.attachment_urls.length > 0 && (
                        <div className="mx-5 mt-4 rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/50 p-3">
                          <p className="text-[10px] font-bold tracking-wide text-cyan-700">
                            קבצים מצורפים
                          </p>
                          <ul className="mt-2 space-y-2">
                            {submission.attachment_urls.map((url, index) => (
                              <li key={`${url}-${index}`}>
                                <a
                                  href={`/api/submissions/file?path=${encodeURIComponent(url)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-2"
                                >
                                  <span className="flex size-7 items-center justify-center rounded-lg bg-white text-cyan-700"><FileText className="size-4" /></span>
                                  <span>{submission.attachment_names?.[index] ?? `קובץ ${index + 1}`}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {grade && grade.feedback && (
                        <div className="mt-3 rounded-lg border border-dashed border-border/80 bg-background/60 p-2.5">
                          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            משוב
                          </p>
                          <p className="mt-1 text-sm text-foreground">{grade.feedback}</p>
                        </div>
                      )}

                      <GradeSubmissionForm
                        submissionId={submission.id}
                        assignmentId={assignment.id}
                        classId={params.id}
                        defaultScore={grade?.score}
                        defaultFeedback={grade?.feedback ?? undefined}
                      />
                    </details>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  אין הגשות להצגה כרגע.
                </p>
              )}
              {pendingCount > 0 && (
                <div className="rounded-[1.75rem] border border-dashed border-amber-300 bg-amber-50/70 p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><Clock3 className="size-5" /></span>
                    <div><h3 className="font-black text-amber-950">תלמידים שעדיין לא הגישו</h3><p className="mt-1 text-sm leading-6 text-amber-900/70">{pendingCount} תלמידים אינם מופיעים ברשימת ההגשות. אפשר לעקוב אחריהם ולשלוח תזכורת מהכיתה.</p></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">{students.filter((student) => !submissions.some((submission) => submission.student_id === student.id)).map((student) => <span key={student.id} className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-900">{student.name}</span>)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-0 bg-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <CardHeader>
              <CardTitle className="text-lg">פרטי המשימה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">סוג המשימה</p>
                <p className="font-medium">
                  {typeLabels[assignment.type as keyof typeof typeLabels]}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">רמת קושי</p>
                <p className="font-medium">
                  {difficultyLabels[assignment.difficulty as keyof typeof difficultyLabels]}
                </p>
              </div>
              <div className="rounded-2xl bg-cyan-50 p-3">
                <p className="text-xs text-cyan-700">תאריך הגשה</p>
                <p className="mt-1 font-bold text-slate-900">
                  {dueDate.toLocaleDateString("he-IL", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {isOverdue && (
                  <p className="mt-1 text-xs text-destructive">
                    ⚠️ חלף תאריך הגשה
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <CardHeader>
              <CardTitle className="text-lg">סיכום מהיר</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-cyan-50 p-3">
                  <p className="text-xs text-cyan-700">הוגשו</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{submittedCount}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700">נבדקו</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{gradedCount}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5">
                <span className="text-sm text-amber-900/70">ממתינות לבדיקה</span>
                <span className="font-black text-amber-700">{ungradedCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-500">טרם הגישו</span>
                <span className="font-black text-slate-700">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm text-muted-foreground">שיעור הגשה</span>
                <span className="font-black text-cyan-700">{submissionRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ממוצע ציון</span>
                <span className="font-black text-slate-900">{averageSubmittedScore}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
