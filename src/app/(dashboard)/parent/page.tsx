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
import { HeartPulse } from "lucide-react";

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
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_26px_70px_rgba(15,23,42,0.18)] sm:p-8"><div className="absolute -left-16 -top-20 size-64 rounded-full bg-emerald-400/15 blur-3xl" /><div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold tracking-[0.22em] text-emerald-200"><HeartPulse className="size-3.5" /> FAMILY VIEW</div><h1 className="text-3xl font-black sm:text-4xl">ההתקדמות של {student.name}</h1><p className="mt-2 text-sm text-slate-300">{classItem?.name} · שלום, {profile.full_name}</p></div><span className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-200">מעקב שבועי</span></div></section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 bg-white/80 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">ממוצע</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{average}%</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white/80 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">משימות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{assignments.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white/80 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">התראות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{flags.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <CardHeader>
          <CardTitle>מגמת ציונים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{trendText}</p>
          <GradeChart grades={grades} />
        </CardContent>
      </Card>

      <Card className={flags.length > 0 ? "border-rose-200 bg-rose-50/40 shadow-lg" : "border-0 bg-white/80 shadow-lg"}>
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
