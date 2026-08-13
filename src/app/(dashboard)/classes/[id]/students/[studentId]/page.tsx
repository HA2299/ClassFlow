import Link from "next/link";
import {
  getStudentAverage,
  getStudentGrades,
  getStudentRiskFlags,
} from "@/app/actions/auth";
import { getStudentById } from "@/lib/data/store";
import { requireTeacher } from "@/lib/auth/session";
import { getTeacherClassById } from "@/app/actions/auth";
import { StudentStatusForm } from "@/components/classes/student-status-form";
import { GradeChart } from "@/components/analytics/grade-chart";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function StudentDetailPage({
  params,
}: {
  params: { id: string; studentId: string };
}) {
  const profile = await requireTeacher();
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

  const student = await getStudentById(params.studentId);

  if (!student || student.class_id !== params.id) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card/95 p-8 text-center">
        <p className="mb-4 text-lg font-semibold">התלמיד לא נמצא</p>
        <Link
          href={`/classes/${params.id}`}
          className={buttonVariants()}
        >
          חזור לכיתה
        </Link>
      </div>
    );
  }

  const grades = await getStudentGrades(params.studentId);
  const average = await getStudentAverage(params.studentId);
  const riskFlags = await getStudentRiskFlags(params.studentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {student.name}
          </h1>
          <p className="text-muted-foreground">
            בכיתה: {classItem.name}
            {student.status === "at_risk" && " • ⚠️ בסיכון"}
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
          {/* Grades */}
          <Card>
            <CardHeader>
              <CardTitle>ציוני התלמיד</CardTitle>
              <CardDescription>
                {grades.length} משימות מדורגות
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GradeChart grades={grades} />
              {grades.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  אין ציונים עדיין לתלמיד זה
                </p>
              ) : (
                <div className="space-y-3">
                  {grades.map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          משימה #{grade.assignment_id.slice(0, 8)}
                        </p>
                        {grade.feedback && (
                          <p className="text-xs text-muted-foreground">
                            {grade.feedback}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {grade.score}/{grade.max_score}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(
                            (grade.score / grade.max_score) * 100
                          )}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Average */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ממוצע ציונים</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{average}%</p>
              {average >= 85 && (
                <p className="mt-2 text-xs text-green-600">
                  ✓ ביצועים טובים
                </p>
              )}
              {average >= 70 && average < 85 && (
                <p className="mt-2 text-xs text-yellow-600">
                  ~ ביצועים סביר
                </p>
              )}
              {average < 70 && (
                <p className="mt-2 text-xs text-destructive">
                  ⚠️ צריך תשומת לב
                </p>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">סטטוס</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StudentStatusForm student={student} classId={params.id} />
              <div>
                <p className="text-xs text-muted-foreground">מצב נוכחי</p>
                <p className="font-medium">
                  {student.status === "active" && "פעיל"}
                  {student.status === "at_risk" && "בסיכון"}
                  {student.status === "inactive" && "לא פעיל"}
                </p>
              </div>
              {riskFlags.length > 0 && (
                <div className="mt-3 rounded-lg bg-destructive/10 p-3">
                  <p className="text-xs font-semibold text-destructive">
                    סימוני סיכון:
                  </p>
                  <ul className="mt-1 space-y-1">
                    {riskFlags.map((flag) => (
                      <li key={flag.id} className="text-xs text-destructive">
                        • {flag.description || flag.flag_type}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
