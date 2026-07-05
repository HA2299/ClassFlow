import Link from "next/link";
import { requireTeacher } from "@/lib/auth/session";
import { getTeacherAssignmentsSummary } from "@/app/actions/assignments";
import { ensureDemoStoreHydrated } from "@/lib/demo/hydrate.server";
import { getClassById } from "@/lib/demo/store";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: { class?: string };
}) {
  ensureDemoStoreHydrated();
  const profile = await requireTeacher();
  const { assignments } = await getTeacherAssignmentsSummary(profile.id);
  const classIds = Array.from(new Set(assignments.map((a) => a.class_id)));
  const classes = classIds.map((id) => getClassById(id)).filter(Boolean);

  const filtered = searchParams.class
    ? assignments.filter((a) => a.class_id === searchParams.class)
    : assignments;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">משימות</h1>
          <p className="text-muted-foreground">כל המשימות בכיתות שלך</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/assignments"
          className={buttonVariants({
            variant: searchParams.class ? "outline" : "default",
            size: "sm",
          })}
        >
          הכל
        </Link>
        {classes.map((c) =>
          c ? (
            <Link
              key={c.id}
              href={`/assignments?class=${c.id}`}
              className={buttonVariants({
                variant: searchParams.class === c.id ? "default" : "outline",
                size: "sm",
              })}
            >
              {c.name}
            </Link>
          ) : null
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((assignment) => {
          const classItem = getClassById(assignment.class_id);
          return (
            <Card key={assignment.id}>
              <CardHeader>
                <CardTitle className="text-base">{assignment.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {classItem?.name} ·{" "}
                  {new Date(assignment.due_date).toLocaleDateString("he-IL")}
                </p>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/classes/${assignment.class_id}/assignments/${assignment.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  פתיחה
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground">אין משימות להצגה.</p>
      )}
    </div>
  );
}
