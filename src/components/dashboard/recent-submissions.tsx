import Link from "next/link";
import type { Assignment, Student, Submission } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RecentSubmissions({
  submissions,
}: {
  submissions: Array<
    Submission & { assignment?: Assignment; student?: Student }
  >;
}) {
  return (
    <Card className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900">הגשות אחרונות</CardTitle>
        <CardDescription>עדכונים אחרונים מהכיתות שלך</CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length > 0 ? (
          <ul className="space-y-3">
            {submissions.slice(0, 8).map((submission) => (
              <li
                key={submission.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {submission.student?.name ?? "תלמיד"} —{" "}
                    {submission.assignment?.name ?? "משימה"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(
                      submission.submitted_at || submission.created_at
                    ).toLocaleString("he-IL")}
                  </p>
                </div>
                {submission.assignment && (
                  <Link
                    href={`/classes/${submission.assignment.class_id}/assignments/${submission.assignment_id}`}
                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
                  >
                    צפייה
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            עדיין לא נרשמו הגשות. אפשר להתחיל ביצירת משימה חדשה.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
