import Link from "next/link";
import type { Student } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AtRiskAlert({ students }: { students: Student[] }) {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>תלמידים בסיכון</CardTitle>
        <CardDescription>דורשים תשומת לב מיידית</CardDescription>
      </CardHeader>
      <CardContent>
        {students.length > 0 ? (
          <ul className="space-y-2">
            {students.map((student) => (
              <li
                key={student.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">סטטוס: {student.status}</p>
                </div>
                <Link
                  href={`/classes/${student.class_id}/students/${student.id}`}
                  className="text-primary hover:underline"
                >
                  צפייה
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
            אין תלמידים בסיכון כרגע. כל הכיתה מתקדמת בצורה יציבה.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
