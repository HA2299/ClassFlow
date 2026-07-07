import Link from "next/link";
import { getTeacherClasses } from "@/app/actions/auth";
import { requireProfile } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ClassesPage() {
  const profile = await requireProfile();
  const classes = await getTeacherClasses(profile.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">כיתות</h1>
          <p className="text-muted-foreground">ניהול כל הכיתות שלך</p>
        </div>
        <Link href="/classes/new" className={buttonVariants()}>
          כיתה חדשה
        </Link>
      </div>

      {classes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {classes.map((classItem) => (
            <Card key={classItem.id}>
              <CardHeader>
                <CardTitle>{classItem.name}</CardTitle>
                <CardDescription>
                  נוצרה ב-{new Date(classItem.created_at).toLocaleDateString("he-IL")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  כיתה פעילה עם כל המשימות, התלמידים וההתראות במקום אחד.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/classes/${classItem.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    פתיחה
                  </Link>
                  <Link
                    href={`/classes/${classItem.id}/assignments/new/wizard`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    יצירת משימה עם AI
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">אין כיתות עדיין.</p>
            <Link
              href="/classes/new"
              className={buttonVariants({ className: "mt-4" })}
            >
              יצירת כיתה ראשונה
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
