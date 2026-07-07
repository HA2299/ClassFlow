"use client";

import Link from "next/link";
import type { Student } from "@/types/database";

interface StudentsListProps {
  students: Student[];
  classId: string;
}

export function StudentsList({ students, classId }: StudentsListProps) {
  if (students.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          אין תלמידים בכיתה זו עדיין
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {students.map((student) => (
        <Link
          key={student.id}
          href={`/classes/${classId}/students/${student.id}`}
          className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-4 transition hover:border-border/80 hover:bg-muted/40"
        >
          <div>
            <p className="font-medium text-foreground">{student.name}</p>
            <p className="text-xs text-muted-foreground">
              {student.status === "active" && "פעיל"}
              {student.status === "at_risk" && "בסיכון"}
              {student.status === "inactive" && "לא פעיל"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {student.status === "at_risk" && (
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                ⚠️ סיכון
              </span>
            )}
            <span className="text-xs text-muted-foreground">→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
