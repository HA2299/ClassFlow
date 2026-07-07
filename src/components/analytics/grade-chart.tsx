import type { Grade } from "@/types/database";

export function GradeChart({ grades }: { grades: Grade[] }) {
  if (grades.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">אין ציונים להצגה בגרף.</p>
    );
  }

  const sorted = [...grades].sort(
    (a, b) => new Date(a.graded_at).getTime() - new Date(b.graded_at).getTime()
  );
  const max = 100;

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-40 rounded-xl border bg-muted/20 p-3">
        {sorted.map((grade) => {
          const height = Math.max(8, (grade.score / max) * 100);
          return (
            <div
              key={grade.id}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="text-xs font-medium">{grade.score}</span>
              <div
                className="w-full rounded-t-md bg-primary/80 transition-all"
                style={{ height: `${height}%` }}
                title={`${grade.score}/${grade.max_score}`}
              />
              <span className="text-[10px] text-muted-foreground">
                {new Date(grade.graded_at).toLocaleDateString("he-IL", {
                  day: "numeric",
                  month: "numeric",
                })}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>נמוך</span>
        <span>גבוה</span>
      </div>
    </div>
  );
}
