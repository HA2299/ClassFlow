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
    <Card className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900">תלמידים בסיכון</CardTitle>
        <CardDescription>דורשים תשומת לב מיידית</CardDescription>
      </CardHeader>
      <CardContent>
        {students.length > 0 ? (
          <ul className="space-y-3">
            {students.map((student) => (
              <li
                key={student.id}
                className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-800">{student.name}</p>
                  <p className="text-xs text-slate-500">סטטוס: {student.status}</p>
                </div>
                <Link
                  href={`/classes/${student.class_id}/students/${student.id}`}
                  className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500"
                >
                  צפייה
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            אין תלמידים בסיכון כרגע. כל הכיתה מתקדמת בצורה יציבה.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
