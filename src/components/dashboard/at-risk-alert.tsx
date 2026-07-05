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
        <CardDescription>דורשים תשומת לב</CardDescription>
      </CardHeader>
      <CardContent>
        {students.length > 0 ? (
          <ul className="space-y-2">
            {students.map((student) => (
              <li
                key={student.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>{student.name}</span>
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
          <p className="text-sm text-muted-foreground">אין תלמידים בסיכון כרגע.</p>
        )}
      </CardContent>
    </Card>
  );
}
