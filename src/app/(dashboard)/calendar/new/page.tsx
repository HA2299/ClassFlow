import Link from "next/link";
import { requireTeacher } from "@/lib/auth/session";
import { createCalendarEvent, getCalendarClassesForProfile } from "@/app/actions/calendar";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, PlusCircle } from "lucide-react";

export default async function NewCalendarEventPage() {
  const profile = await requireTeacher();
  const classes = await getCalendarClassesForProfile(profile);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-slate-400">NEW EVENT</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">יצירת אירוע חדש</h1>
        </div>
        <Link href="/calendar" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ArrowLeft className="size-4" /> חזרה ללוח
        </Link>
      </div>

      <form action={createCalendarEvent} className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">כותרת</span>
            <input name="title" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-cyan-400" placeholder="מבחן מסכם" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">סוג האירוע</span>
            <select name="event_type" defaultValue="exam" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400">
              <option value="exam">מבחן</option>
              <option value="quiz">בוחן</option>
              <option value="makeup_exam">מבחן補</option>
              <option value="project">פרויקט</option>
              <option value="submission_deadline">מועד הגשה</option>
              <option value="special_lesson">שיעור מיוחד</option>
              <option value="class_activity">פעילות כיתה</option>
              <option value="school_event">אירוע בית ספר</option>
              <option value="other">אחר</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">התחלה</span>
            <input type="datetime-local" name="start_at" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">סיום</span>
            <input type="datetime-local" name="end_at" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">מיקום</span>
            <input name="location" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400" placeholder="כיתה 3, אולם 2" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">סטטוס</span>
            <select name="status" defaultValue="published" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400">
              <option value="published">פומבי</option>
              <option value="draft">טיוטה</option>
            </select>
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">תיאור</span>
          <textarea name="description" rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400" placeholder="פרטים חשובים, חומרי הכנה, הנחיות..." />
        </label>

        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-700">קישור לכיתות</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {classes.map((classItem) => (
              <label key={classItem.id} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                <input type="checkbox" name="class_ids" value={classItem.id} defaultChecked className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                {classItem.name}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="notify_students" value="true" defaultChecked className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
            שליחת התראה לתלמידים
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="notify_teacher" value="true" defaultChecked className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
            התראה למורה
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="all_day" value="true" className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
            אירוע שלם ביום
          </label>
        </div>

        <div className="flex justify-end">
          <button type="submit" className={buttonVariants({ size: "lg" })}>
            <PlusCircle className="size-4" /> שמירה
          </button>
        </div>
      </form>
    </div>
  );
}
