import Link from "next/link";
import { requireTeacher } from "@/lib/auth/session";
import { getDashboardData } from "@/app/actions/dashboard";
import { getTeacherRecentClasses } from "@/app/actions/auth";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AtRiskAlert } from "@/components/dashboard/at-risk-alert";
import { ActiveAssignments } from "@/components/dashboard/active-assignments";
import { RecentSubmissions } from "@/components/dashboard/recent-submissions";

export default async function DashboardPage() {
  const profile = await requireTeacher();
  const dashboard = await getDashboardData(profile.id);
  const recentClasses = await getTeacherRecentClasses(profile.id, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">דאשבורד מורה</h1>
        <p className="text-muted-foreground">
          סקירה מהירה של הכיתות והפעילות שלך
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>כיתות פעילות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{dashboard.classCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>תלמידים בסיכון</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-destructive">
              {dashboard.atRiskStudents.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>משימות פעילות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {dashboard.activeAssignments.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>פעולות מהירות</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/classes/new" className={buttonVariants({ size: "sm" })}>
              כיתה חדשה
            </Link>
            <Link
              href="/assignments"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              משימות
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AtRiskAlert students={dashboard.atRiskStudents} />
        <ActiveAssignments assignments={dashboard.activeAssignments} />
      </div>

      <RecentSubmissions submissions={dashboard.recentSubmissions} />

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
