import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeacherClassById } from "@/app/actions/auth";
import { requireProfile } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ClassDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const classItem = await getTeacherClassById(params.id, profile.id);

  if (!classItem) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {classItem.name}
          </h1>
          <p className="text-muted-foreground">עמוד כיתה — נתוני דמו</p>
        </div>
        <Link
          href="/classes"
          className={buttonVariants({ variant: "outline" })}
        >
          חזרה לכיתות
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>תלמידים</CardTitle>
            <CardDescription>רשימת תלמידים בכיתה</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              תלמידים יתווספו בשלב 3 של הפיתוח.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>משימות</CardTitle>
            <CardDescription>משימות פעילות בכיתה</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              משימות יתווספו בשלב 2 של הפיתוח.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
