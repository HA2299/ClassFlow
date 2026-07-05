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
    <Card>
      <CardHeader>
        <CardTitle>הגשות אחרונות</CardTitle>
        <CardDescription>7 ימים אחרונים</CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length > 0 ? (
          <ul className="divide-y">
            {submissions.slice(0, 8).map((submission) => (
              <li
                key={submission.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {submission.student?.name ?? "תלמיד"} —{" "}
                    {submission.assignment?.name ?? "משימה"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(
                      submission.submitted_at || submission.created_at
                    ).toLocaleString("he-IL")}
                  </p>
                </div>
                {submission.assignment && (
                  <Link
                    href={`/classes/${submission.assignment.class_id}/assignments/${submission.assignment_id}`}
                    className="text-primary hover:underline"
                  >
                    צפייה
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">אין הגשות לאחרונה.</p>
        )}
      </CardContent>
    </Card>
  );
}
