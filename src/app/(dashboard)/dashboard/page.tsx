import Link from "next/link";
import {
  getTeacherClassCount,
  getTeacherRecentClasses,
} from "@/app/actions/auth";
import { requireProfile } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const classCount = await getTeacherClassCount(profile.id);
  const recentClasses = await getTeacherRecentClasses(profile.id, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">דאשבורד מורה</h1>
        <p className="text-muted-foreground">
          סקירה מהירה של הכיתות והפעילות שלך
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>כיתות פעילות</CardTitle>
            <CardDescription>כיתות שאתה מנהל</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{classCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>פעולות מהירות</CardTitle>
            <CardDescription>התחל לעבוד עם ClassFlow</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/classes/new" className={buttonVariants()}>
              כיתה חדשה
            </Link>
            <Link
              href="/classes"
              className={buttonVariants({ variant: "outline" })}
            >
              כל הכיתות
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>כיתות אחרונות</CardTitle>
          <CardDescription>הכיתות שיצרת לאחרונה</CardDescription>
        </CardHeader>
        <CardContent>
          {recentClasses.length > 0 ? (
            <ul className="divide-y">
              {recentClasses.map((classItem) => (
                <li
                  key={classItem.id}
                  className="flex items-center justify-between py-3"
                >
                  <span>{classItem.name}</span>
                  <Link
                    href={`/classes/${classItem.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    פתיחה
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              עדיין אין כיתות.{" "}
              <Link href="/classes/new" className="text-primary hover:underline">
                צור כיתה ראשונה
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
