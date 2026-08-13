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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {assignment.name}
          </h1>
          <p className="text-muted-foreground">
            {typeLabels[assignment.type as keyof typeof typeLabels]}
            {isOverdue && " • ⚠️ חלף תאריך הגשה"}
          </p>
        </div>
        <Link
          href={`/classes/${params.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          חזור לכיתה
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {assignment.description && (
            <Card>
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

          <Card>
            <CardHeader>
              <CardTitle>הגשות תלמידים</CardTitle>
              <CardDescription>
                {submissions.length > 0 ? `${submissions.length} הגשות רשומות` : "עדיין לא נרשמו הגשות"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <div key={submission.id} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{student?.name ?? "תלמיד"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.submitted_at || submission.created_at).toLocaleString("he-IL")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {grade && (
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              ציון: {grade.score}/{grade.max_score}
                            </span>
                          )}
                          <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {submission.answer || "לא נכתבה תשובה"}
                      </p>

                      {submission.attachment_urls && submission.attachment_urls.length > 0 && (
                        <div className="mt-3 rounded-lg border border-dashed border-border/80 bg-background/60 p-2.5">
                          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            קבצים מצורפים
                          </p>
                          <ul className="mt-2 space-y-2">
                            {submission.attachment_urls.map((url, index) => (
                              <li key={`${url}-${index}`}>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-2"
                                >
                                  <span>📎</span>
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
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  אין הגשות להצגה כרגע.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">פרטי המשימה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">סוג</p>
                <p className="font-medium">
                  {typeLabels[assignment.type as keyof typeof typeLabels]}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">רמת קושי</p>
                <p className="font-medium">
                  {difficultyLabels[assignment.difficulty as keyof typeof difficultyLabels]}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">תאריך הגשה</p>
                <p className="font-medium">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">סטטיסטיקות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl bg-muted/30 p-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">הגשות</span>
                  <span className="font-semibold">{submissions.length}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(submissionRate, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">מדורגות</span>
                <span className="font-semibold">{gradedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">שיעור הגשה</span>
                <span className="font-semibold">{submissionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ממוצע ציון</span>
                <span className="font-semibold">{averageSubmittedScore}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
