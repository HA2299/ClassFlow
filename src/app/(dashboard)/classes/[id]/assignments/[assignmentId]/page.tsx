import Link from "next/link";
import {
  getAssignmentById,
  getGradesBySubmissions,
  getStudentsByIds,
} from "@/lib/data/store";
import { requireProfile } from "@/lib/auth/session";
import {
  getAssignmentSubmissions,
  getTeacherClassById,
  getClassStudents,
} from "@/app/actions/auth";
import { GradeSubmissionForm } from "@/components/classes/grade-submission-form";
import { MissingSubmissionReminder } from "@/components/classes/missing-submission-reminder";
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

  const [grades, submissionStudents] = await Promise.all([
    getGradesBySubmissions(submissions.map((submission) => submission.id)),
    getStudentsByIds(submissions.map((submission) => submission.student_id)),
  ]);
  const gradeMap = new Map(grades.map((grade) => [grade.submission_id, grade]));
  const studentMap = new Map([...students, ...submissionStudents].map((student) => [student.id, student]));

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
  const ungradedCount = Math.max(0, submittedCount - gradedCount);
  const submittedStudentIds = new Set(submissions.map((submission) => submission.student_id));

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

      {/* Main content stays full-width so a short sidebar cannot compete with the submission queue. */}
      <div className="space-y-4">
          {/* Description */}
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

          <Card className="border-0 bg-transparent p-0 shadow-none">
            <CardHeader className="relative mb-5 rounded-[1.5rem] border border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <CardTitle className="text-xl font-black text-slate-950">מרכז הבדיקה</CardTitle>
                  <CardDescription className="mt-1">עברו על ההגשות, תנו ציון והשאירו משוב במקום אחד.</CardDescription>
                </div>
                <span className="w-fit rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">{ungradedCount} ממתינות לבדיקה</span>
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600"><span>התקדמות בדיקה</span><span>{gradedCount}/{submittedCount} הגשות</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-cyan-500 transition-all" style={{ width: `${submittedCount > 0 ? Math.round((gradedCount / submittedCount) * 100) : 0}%` }} /></div>
                <p className="mt-2 text-[11px] text-slate-500">{pendingCount > 0 ? `${pendingCount} תלמידים עדיין לא הגישו.` : "כל התלמידים הגישו את המשימה."}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-0 pt-0">
              {submissions.length > 0 ? (
                submissions.map((submission) => {
                  const student = studentMap.get(submission.student_id);
                  const grade = gradeMap.get(submission.id);
                  const statusLabel =
                    submission.status === "graded"
                      ? "מדורג"
                      : submission.status === "late"
                        ? "באיחור"
                        : "הוגש";

                  return (
                    <details id={`submission-${submission.id}`} data-pending={submission.status !== "graded" ? "true" : "false"} key={submission.id} open={submission.status !== "graded"} className="submission-card group overflow-hidden rounded-[1.35rem] border border-slate-200/90 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-l from-slate-50/90 to-white px-4 py-3.5 transition hover:bg-cyan-50/30 sm:px-5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-base font-black text-cyan-300 shadow-sm">{(student?.name ?? "תלמיד").charAt(0)}</span>
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

                      <div className="mx-4 mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 sm:mx-5"><p className="mb-1.5 text-[10px] font-bold tracking-[0.18em] text-slate-400">תשובת התלמיד</p><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{submission.answer || "לא נכתבה תשובה"}</p></div>

                      {submission.attachment_urls && submission.attachment_urls.length > 0 && (
                        <div className="mx-4 mt-3 rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/50 p-3 sm:mx-5">
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
                  <div className="mt-4 flex flex-wrap gap-2">{students.filter((student) => !submittedStudentIds.has(student.id)).map((student) => <span key={student.id} className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-900">{student.name}</span>)}</div>
                  <MissingSubmissionReminder classId={params.id} assignmentId={assignment.id} count={pendingCount} />
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
