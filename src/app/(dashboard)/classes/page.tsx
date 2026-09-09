import Link from "next/link";
import { getTeacherClasses } from "@/app/actions/auth";
import { requireProfile } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { ArrowUpRight, Plus, Sparkles, Users } from "lucide-react";
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
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_26px_70px_rgba(15,23,42,0.18)] sm:p-8">
        <div className="absolute -left-10 -top-20 size-56 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold tracking-[0.22em] text-cyan-200"><Sparkles className="size-3.5" /> WORKSPACE</div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">הכיתות שלך</h1>
          <p className="mt-2 text-sm text-slate-300">כל תלמיד, משימה והתקדמות במקום אחד.</p>
        </div>
        <Link href="/classes/new" className={buttonVariants({ variant: "secondary" })}>
          <Plus className="size-4" /> כיתה חדשה
        </Link>
      </div>
      </section>

      <div className="flex items-center justify-between">
        <div><p className="text-sm font-bold text-slate-900">הכיתות הפעילות</p><p className="text-sm text-slate-500">{classes.length} כיתות מנוהלות</p></div>
      </div>

      {classes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="group border-0 bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
              <CardHeader>
                <div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-800"><Users className="size-5" /></span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">פעילה</span></div>
                <CardTitle className="mt-3">{classItem.name}</CardTitle>
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
                    פתיחת כיתה <ArrowUpRight className="size-4" />
                  </Link>
                  <Link
                    href={`/classes/${classItem.id}/assignments/new/wizard`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    יצירת משימה עם AI <Sparkles className="size-4" />
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
