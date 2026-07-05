import Link from "next/link";
import type { Assignment } from "@/types/database";
import { ensureDemoStoreHydrated } from "@/lib/demo/hydrate.server";
import { getClassById } from "@/lib/demo/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ActiveAssignments({
  assignments,
}: {
  assignments: Assignment[];
}) {
  ensureDemoStoreHydrated();

  return (
    <Card>
      <CardHeader>
        <CardTitle>משימות פעילות</CardTitle>
        <CardDescription>משימות עם תאריך הגשה עתידי</CardDescription>
      </CardHeader>
      <CardContent>
        {assignments.length > 0 ? (
          <ul className="space-y-2">
            {assignments.slice(0, 5).map((assignment) => {
              const classItem = getClassById(assignment.class_id);
              return (
                <li
                  key={assignment.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{assignment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {classItem?.name} ·{" "}
                      {new Date(assignment.due_date).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  <Link
                    href={`/classes/${assignment.class_id}/assignments/${assignment.id}`}
                    className="text-primary hover:underline"
                  >
                    פתיחה
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">אין משימות פעילות.</p>
        )}
      </CardContent>
    </Card>
  );
}
