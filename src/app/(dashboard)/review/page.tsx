import Link from "next/link";
import { requireTeacher } from "@/lib/auth/session";
import { getTeacherAssignmentsSummary } from "@/app/actions/assignments";
import { getClassById, getGradeBySubmission, getSubmissionsByAssignment } from "@/lib/data/store";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpLeft, CheckCircle2, ClipboardCheck, Clock3, GraduationCap, Inbox, Sparkles } from "lucide-react";

export default async function ReviewPage() {
  const profile = await requireTeacher();
  const { assignments } = await getTeacherAssignmentsSummary(profile.id);
  const classIds = Array.from(new Set(assignments.map((assignment) => assignment.class_id)));
  const classes = (await Promise.all(classIds.map((classId) => getClassById(classId)))).filter(
    (classItem): classItem is NonNullable<typeof classItem> => classItem !== null
  );
  const classMap = new Map(classes.map((classItem) => [classItem.id, classItem]));
  const reviewItems = await Promise.all(
    assignments.map(async (assignment) => {
      const submissions = await getSubmissionsByAssignment(assignment.id);
      const grades = (await Promise.all(submissions.map((submission) => getGradeBySubmission(submission.id)))).filter(
        (grade): grade is NonNullable<typeof grade> => grade !== null
      );
      const submitted = submissions.filter(
        (submission) => Boolean(submission.answer.trim()) || (submission.attachment_urls?.length ?? 0) > 0
      ).length;
      const graded = submissions.filter((submission) => submission.status === "graded").length;
      const average = grades.length > 0 ? Math.round(grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length) : 0;
      return { assignment, submitted, graded, average };
    })
  );
  const submittedCount = reviewItems.reduce((sum, item) => sum + item.submitted, 0);
  const gradedCount = reviewItems.reduce((sum, item) => sum + item.graded, 0);
  const pendingReviewCount = Math.max(0, submittedCount - gradedCount);
  const assignmentsToReview = reviewItems.filter((item) => item.submitted > item.graded);

  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0f172a,#164e63_58%,#0f766e)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-8">
        <div className="pointer-events-none absolute -left-16 -top-20 -z-10 size-64 rounded-full border border-cyan-200/15 shadow-[0_0_0_24px_rgba(103,232,249,0.04),0_0_0_48px_rgba(103,232,249,0.03)]" />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <Link href="/dashboard" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 transition hover:text-white"><ArrowUpLeft className="size-4" /> חזרה לסקירה</Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-100/10 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-cyan-100"><ClipboardCheck className="size-3.5" /> REVIEW HUB</div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">מרכז בדיקת ההגשות</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-cyan-50/80 sm:text-base">כל מה שממתין לבדיקה, מכל הכיתות שלך, במקום אחד מסודר.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center"><Inbox className="mx-auto size-4 text-cyan-300" /><p className="mt-2 text-2xl font-black">{pendingReviewCount}</p><p className="text-[10px] text-slate-300">ממתינות לבדיקה</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center"><CheckCircle2 className="mx-auto size-4 text-emerald-300" /><p className="mt-2 text-2xl font-black">{gradedCount}</p><p className="text-[10px] text-slate-300">נבדקו</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center"><GraduationCap className="mx-auto size-4 text-violet-300" /><p className="mt-2 text-2xl font-black">{assignments.length}</p><p className="text-[10px] text-slate-300">משימות</p></div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)]"><CardContent className="p-5"><p className="text-xs font-bold text-slate-500">סה״כ הגשות</p><p className="mt-2 text-3xl font-black text-slate-950">{submittedCount}</p><p className="mt-1 text-xs text-slate-500">מכל הכיתות</p></CardContent></Card>
        <Card className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)]"><CardContent className="p-5"><p className="text-xs font-bold text-slate-500">תור העבודה שלך</p><p className="mt-2 text-3xl font-black text-amber-600">{assignmentsToReview.length}</p><p className="mt-1 text-xs text-slate-500">משימות עם הגשות לבדיקה</p></CardContent></Card>
        <Card className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)]"><CardContent className="p-5"><p className="text-xs font-bold text-slate-500">ממוצע ציונים</p><p className="mt-2 text-3xl font-black text-cyan-700">{reviewItems.filter((item) => item.average > 0).length > 0 ? Math.round(reviewItems.filter((item) => item.average > 0).reduce((sum, item) => sum + item.average, 0) / reviewItems.filter((item) => item.average > 0).length) : 0}</p><p className="mt-1 text-xs text-slate-500">במשימות שנבדקו</p></CardContent></Card>
      </div>

      <Card className="overflow-hidden border-0 bg-white/80 shadow-[0_22px_55px_rgba(15,23,42,0.08)]">
        <CardHeader className="border-b border-slate-200/80 bg-slate-50/80 px-5 py-5 sm:px-6"><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-2xl font-black text-slate-950">תור הבדיקה</CardTitle><CardDescription className="mt-1">פתח משימה כדי לעבור על תלמידים, לצפות בקבצים ולתת ציון.</CardDescription></div><Sparkles className="size-5 text-cyan-600" /></div></CardHeader>
        <CardContent className="p-4 sm:p-6">
          {reviewItems.length > 0 ? <div className="space-y-3">{reviewItems.map(({ assignment, submitted, graded, average }) => { const classItem = classMap.get(assignment.class_id); const needsReview = submitted > graded; return <div key={assignment.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 transition hover:border-cyan-300 hover:shadow-[0_12px_30px_rgba(8,145,178,0.08)] sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white"><ClipboardCheck className="size-5" /></span><div className="min-w-0"><p className="truncate font-black text-slate-900">{assignment.name}</p><p className="mt-1 text-xs text-slate-500">{classItem?.name ?? "כיתה"} · {submitted} הגשות · {graded} נבדקו</p></div></div><div className="flex items-center gap-3 sm:shrink-0">{average > 0 && <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-700">ממוצע {average}</span>}<span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${needsReview ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>{needsReview ? <Clock3 className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}{needsReview ? `${submitted - graded} לבדיקה` : "הכול נבדק"}</span><Link href={`/classes/${assignment.class_id}/assignments/${assignment.id}`} className={buttonVariants({ size: "sm" })}>{needsReview ? "התחל בדיקה" : "פתיחת משימה"}<ArrowUpLeft className="size-4" /></Link></div></div> })}</div> : <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center"><ClipboardCheck className="mx-auto size-8 text-slate-400" /><p className="mt-3 font-bold text-slate-700">אין עדיין משימות לבדיקה</p><p className="mt-1 text-sm text-slate-500">כאשר תלמידים יגישו, ההגשות יופיעו כאן.</p></div>}
        </CardContent>
      </Card>
    </div>
  );
}
