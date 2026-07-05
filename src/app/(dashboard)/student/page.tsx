import { requireStudent } from "@/lib/auth/session";
import {
  getClassAssignments,
  getStudentAverage,
  getStudentGrades,
} from "@/app/actions/auth";
import { getLinkedStudentRecord } from "@/app/actions/students";
import { getClassById } from "@/lib/demo/store";
import { ensureDemoStoreHydrated } from "@/lib/demo/hydrate.server";
import { getSubmissionsByAssignment } from "@/lib/demo/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AssignmentSubmissionCard } from "@/components/student/assignment-submission-card";
import { AiHelper } from "@/components/student/ai-helper";

export default async function StudentDashboardPage() {
  ensureDemoStoreHydrated();
  const profile = await requireStudent();
  const student = await getLinkedStudentRecord(profile.id);

  if (!student) {
    return (
      <p className="text-muted-foreground">לא נמצא רשומת תלמיד מקושרת.</p>
    );
  }

  const classItem = getClassById(student.class_id);
  const assignments = await getClassAssignments(student.class_id);
  const grades = await getStudentGrades(student.id);
  const average = await getStudentAverage(student.id);

  const activeAssignments = assignments.filter(
    (a) => new Date(a.due_date).getTime() >= Date.now()
  );
  const submittedCount = assignments.filter((a) => {
    const sub = getSubmissionsByAssignment(a.id).find(
      (s) => s.student_id === student.id
    );
    return Boolean(sub?.answer?.trim());
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          שלום, {profile.full_name}
        </h1>
        <p className="text-muted-foreground">
          {classItem?.name ?? "כיתה"} — משימות, ציונים ועזרת AI
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">משימות פתוחות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {activeAssignments.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">הגשות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{submittedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ממוצע ציונים</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{average}%</p>
            <p className="text-xs text-muted-foreground">
              {grades.length} ציונים
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>הגשת משימות</CardTitle>
            <CardDescription>שלח ועדכן פתרונות</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map((assignment) => {
                const submission = getSubmissionsByAssignment(
                  assignment.id
                ).find((s) => s.student_id === student.id);
                return (
                  <AssignmentSubmissionCard
                    key={assignment.id}
                    assignment={assignment}
                    student={student}
                    existingSubmission={submission}
                  />
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">אין משימות כרגע.</p>
            )}
          </CardContent>
        </Card>

        <AiHelper studentName={profile.full_name} />
      </div>
    </div>
  );
}
