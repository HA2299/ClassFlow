import Link from "next/link";
import { getAssignmentById, getStudentById } from "@/lib/demo/store";
import { requireProfile } from "@/lib/auth/session";
import {
  getAssignmentSubmissions,
  getTeacherClassById,
  getClassStudents,
} from "@/app/actions/auth";
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

  const assignment = getAssignmentById(params.assignmentId);
  const submissions = await getAssignmentSubmissions(params.assignmentId);
  const students = await getClassStudents(params.id);

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
  const submittedCount = submissions.filter((item) => item.answer.trim().length > 0).length;
  const gradedCount = submissions.filter((item) => item.status === "graded").length;
  const averageScore = submissions.length > 0 ? Math.round((submittedCount / students.length) * 100) : 0;

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
            <CardContent className="space-y-3">
              {submissions.length > 0 ? (
                submissions.map((submission) => {
                  const student = getStudentById(submission.student_id);
                  return (
                    <div key={submission.id} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{student?.name ?? "תלמיד"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.submitted_at || submission.created_at).toLocaleString("he-IL")}
                          </p>
                        </div>
                        <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {submission.status === "graded" ? "מדורג" : submission.status === "late" ? "באיחור" : "הוגש"}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {submission.answer || "לא נכתבה תשובה"}
                      </p>
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
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  הגשות
                </span>
                <span className="font-semibold">{submissions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  מדורגות
                </span>
                <span className="font-semibold">{gradedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  ממוצע ציון
                </span>
                <span className="font-semibold">{averageScore}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
