import Link from "next/link";
import type { Assignment } from "@/types/database";
import { getClassById } from "@/lib/data/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function ActiveAssignments({
  assignments,
}: {
  assignments: Assignment[];
}) {
  const classNames = new Map<string, string>();
  await Promise.all(
    Array.from(new Set(assignments.map((a) => a.class_id))).map(async (classId) => {
      const classItem = await getClassById(classId);
      if (classItem) classNames.set(classId, classItem.name);
    })
  );

  return (
    <Card className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900">משימות פעילות</CardTitle>
        <CardDescription>משימות עם תאריך הגשה עתידי</CardDescription>
      </CardHeader>
      <CardContent>
        {assignments.length > 0 ? (
          <ul className="space-y-3">
            {assignments.slice(0, 5).map((assignment) => (
              <li
                key={assignment.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-800">{assignment.name}</p>
                  <p className="text-xs text-slate-500">
                    {classNames.get(assignment.class_id) ?? "כיתה"} ·{" "}
                    {new Date(assignment.due_date).toLocaleDateString("he-IL")}
                  </p>
                </div>
                <Link
                  href={`/classes/${assignment.class_id}/assignments/${assignment.id}`}
                  className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
                >
                  פתיחה
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">אין משימות פעילות.</p>
        )}
      </CardContent>
    </Card>
  );
}
