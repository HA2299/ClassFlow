import { requireParent } from "@/lib/auth/session";
import { getLinkedStudentRecord } from "@/app/actions/students";
import {
  getStudentAverage,
  getStudentGrades,
  getStudentRiskFlags,
  getClassAssignments,
} from "@/app/actions/auth";
import { getClassById } from "@/lib/data/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GradeChart } from "@/components/analytics/grade-chart";

export default async function ParentPage() {
  const profile = await requireParent();
  const student = await getLinkedStudentRecord(profile.id);

  if (!student) {
    return <p className="text-muted-foreground">לא נמצא מידע על הילד.</p>;
  }

  const classItem = await getClassById(student.class_id);
  const grades = await getStudentGrades(student.id);
  const average = await getStudentAverage(student.id);
  const flags = await getStudentRiskFlags(student.id);
  const assignments = await getClassAssignments(student.class_id);

  const recentFlags = flags.slice(0, 3);
  const trendText = average >= 85 ? "מגמת ההתקדמות חיובית" : average >= 70 ? "מגמת ההתקדמות יציבה" : "נדרשת תשומת לב נוספת";

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
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{trendText}</p>
          <GradeChart grades={grades} />
        </CardContent>
      </Card>

      <Card className={flags.length > 0 ? "border-destructive/30" : undefined}>
        <CardHeader>
          <CardTitle>התראות אחרונות</CardTitle>
        </CardHeader>
        <CardContent>
          {recentFlags.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {recentFlags.map((f) => (
                <li key={f.id} className="rounded-lg border px-3 py-2">
                  {f.description ?? f.flag_type}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">אין התראות כרגע. המצב נראה יציב.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
