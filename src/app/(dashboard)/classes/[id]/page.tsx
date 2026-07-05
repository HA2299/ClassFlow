import Link from "next/link";
import { getTeacherClassById, getClassStudents, getClassAssignments } from "@/app/actions/auth";
import { getClassDashboardData } from "@/app/actions/dashboard";
import { requireTeacher } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StudentsList } from "@/components/classes/students-list";
import { AddStudentForm } from "@/components/classes/add-student-form";
import { AssignmentsList } from "@/components/classes/assignments-list";
import { CreateAssignmentForm } from "@/components/classes/create-assignment-form";

export default async function ClassDetailPage({
  params,
}: {
  params: { id: string };
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

  const students = await getClassStudents(params.id);
  const atRiskCount = students.filter((s) => s.status === "at_risk").length;
  const assignments = await getClassAssignments(params.id);
  const classData = await getClassDashboardData(params.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {classItem.name}
          </h1>
          <p className="text-muted-foreground">
            {students.length} תלמידים בכיתה זו
            {atRiskCount > 0 && ` • ${atRiskCount} בסיכון`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Students list */}
          <Card>
            <CardHeader>
              <CardTitle>רשימת התלמידים</CardTitle>
              <CardDescription>
                {students.length} תלמידים רשומים בכיתה זו
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentsList students={students} classId={params.id} />
            </CardContent>
          </Card>

          {/* Assignments list */}
          <Card>
            <CardHeader>
              <CardTitle>משימות בכיתה</CardTitle>
              <CardDescription>
                {assignments.length} משימות
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssignmentsList assignments={assignments} classId={params.id} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">הוסף תלמיד</CardTitle>
              <CardDescription>רשום תלמיד חדש לכיתה</CardDescription>
            </CardHeader>
            <CardContent>
              <AddStudentForm classId={params.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">יצירת משימה</CardTitle>
              <CardDescription>הוסף משימה חדשה לכיתה</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <CreateAssignmentForm classId={params.id} />
              <Link
                href={`/classes/${params.id}/assignments/new/wizard`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                אשף AI
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">סטטוס הגשות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {classData.stats.assignmentStats.map(({ assignment, submitted, total }) => (
                <div key={assignment.id} className="flex justify-between text-sm">
                  <span className="truncate">{assignment.name}</span>
                  <span className="font-medium">{submitted}/{total}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {classData.insights.map((insight) => (
                <div key={insight.id} className="rounded-lg border p-2 text-sm">
                  <p className="font-medium">{insight.title}</p>
                  <p className="text-muted-foreground">{insight.summary}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">סטטיסטיקות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ממוצע ציונים</span>
                <span className="font-semibold">{classData.analytics.averageGrade}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">אחוז הגשות</span>
                <span className="font-semibold">{classData.analytics.submissionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">תלמידים בכיתה</span>
                <span className="font-semibold">{students.length}</span>
              </div>
              {atRiskCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">בסיכון</span>
                  <span className="font-semibold text-destructive">{atRiskCount}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
