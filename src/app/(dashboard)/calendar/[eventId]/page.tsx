import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCalendarEvent, getCalendarEventById } from "@/app/actions/calendar";
import { requireProfile } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, Trash2 } from "lucide-react";

export default async function CalendarEventDetailPage({ params }: { params: { eventId: string } }) {
  const profile = await requireProfile();
  const event = await getCalendarEventById(params.eventId, profile);

  if (!event) {
    notFound();
  }

  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-slate-400">EVENT DETAIL</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">{event.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/calendar" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="size-4" /> חזרה
          </Link>
          {profile.role !== "student" && (
            <form action={deleteCalendarEvent.bind(null, event.id)}>
              <button type="submit" className={buttonVariants({ variant: "destructive", size: "sm" })}>
                <Trash2 className="size-4" /> מחיקה
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><CalendarDays className="size-5" /></span>
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-slate-400">DETAILS</p>
              <p className="text-sm font-bold text-slate-700">מידע על האירוע</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <span className="block text-[10px] font-bold tracking-[0.2em] text-slate-400">מועד</span>
              <p className="mt-1 font-bold text-slate-900">{start.toLocaleString("he-IL", { dateStyle: "full", timeStyle: "short" })}</p>
              {end && <p className="mt-1 text-slate-500">עד {end.toLocaleString("he-IL", { dateStyle: "full", timeStyle: "short" })}</p>}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <span className="block text-[10px] font-bold tracking-[0.2em] text-slate-400">כיתות</span>
              <p className="mt-1 font-bold text-slate-900">{event.class_names.length > 0 ? event.class_names.join(", ") : "לא משויך לכיתה"}</p>
            </div>

            {event.location && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                <span className="block text-[10px] font-bold tracking-[0.2em] text-slate-400">מיקום</span>
                <p className="mt-1 font-bold text-slate-900">{event.location}</p>
              </div>
            )}

            {event.description && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                <span className="block text-[10px] font-bold tracking-[0.2em] text-slate-400">תיאור</span>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{event.description}</p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4 rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400">STATUS</p>
            <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{event.status}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400">TYPE</p>
            <p className="mt-2 text-sm font-bold text-slate-900">{event.event_type}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400">הודעות</p>
            <p className="mt-2 text-sm text-slate-700">{event.notify_students ? "לתלמידים" : "ללא התראה לתלמידים"}</p>
            <p className="mt-1 text-sm text-slate-700">{event.notify_teacher ? "למורה" : "ללא התראה למורה"}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
