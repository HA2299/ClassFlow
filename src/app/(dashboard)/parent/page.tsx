import { requireParent } from "@/lib/auth/session";
import { getLinkedStudentRecord } from "@/app/actions/students";
import {
  getStudentAverage,
  getStudentGrades,
  getStudentRiskFlags,
  getClassAssignments,
} from "@/app/actions/auth";
import { ensureDemoStoreHydrated } from "@/lib/demo/hydrate.server";
import { getClassById } from "@/lib/demo/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GradeChart } from "@/components/analytics/grade-chart";

export default async function ParentPage() {
  ensureDemoStoreHydrated();
  const profile = await requireParent();
  const student = await getLinkedStudentRecord(profile.id);

  if (!student) {
    return <p className="text-muted-foreground">לא נמצא מידע על הילד.</p>;
  }

  const classItem = getClassById(student.class_id);
  const grades = await getStudentGrades(student.id);
  const average = await getStudentAverage(student.id);
  const flags = await getStudentRiskFlags(student.id);
  const assignments = await getClassAssignments(student.class_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">שלום, {profile.full_name}</h1>
        <p className="text-muted-foreground">
          התקדמות {student.name} · {classItem?.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ממוצע</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{average}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">משימות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{assignments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">התראות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{flags.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>מגמת ציונים</CardTitle>
        </CardHeader>
        <CardContent>
          <GradeChart grades={grades} />
        </CardContent>
      </Card>

      {flags.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>התראות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {flags.map((f) => (
              <p key={f.id} className="text-sm">
                {f.description ?? f.flag_type}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
