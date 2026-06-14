import Link from "next/link";
import { getTeacherClassById, getClassStudents } from "@/app/actions/auth";
import { requireProfile } from "@/lib/auth/session";
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

export default async function ClassDetailPage({
  params,
}: {
  params: { id: string };
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

  const students = await getClassStudents(params.id);
  const atRiskCount = students.filter((s) => s.status === "at_risk").length;

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

          {/* Quick stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">סטטיסטיקות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  תלמידים בכיתה
                </span>
                <span className="font-semibold">{students.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  תלמידים פעילים
                </span>
                <span className="font-semibold">
                  {students.filter((s) => s.status === "active").length}
                </span>
              </div>
              {atRiskCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    בסיכון
                  </span>
                  <span className="font-semibold text-destructive">
                    {atRiskCount}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
