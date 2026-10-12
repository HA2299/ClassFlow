import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { getCalendarClassesForProfile, getCalendarEventsForProfile } from "@/app/actions/calendar";
import { CalendarBoard } from "@/components/calendar/calendar-board";
import { buttonVariants } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";

export default async function CalendarPage() {
  const profile = await requireProfile();
  const [events, classes] = await Promise.all([
    getCalendarEventsForProfile(profile),
    getCalendarClassesForProfile(profile),
  ]);

  const upcomingCount = events.filter((event) => new Date(event.start_at).getTime() >= Date.now()).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,#0f172a,#164e63_48%,#0f766e)] p-6 text-white shadow-[0_26px_70px_rgba(15,23,42,0.2)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-100/10 px-3 py-1 text-[10px] font-black tracking-[0.22em] text-cyan-100">
              <Sparkles className="size-3.5" /> CLASSFLOW CALENDAR
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">לוח השנה</h1>
            <p className="mt-2 text-sm text-cyan-50/75 sm:text-base">
              תצוגת אירועים, בחינות, משימות יומיות ופעילויות כיתתיות במקום אחד.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {profile.role !== "student" && (
              <Link href="/calendar/new" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                <Plus className="size-4" /> יצירת אירוע
              </Link>
            )}
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-lg">
              <p className="text-xs text-cyan-100/80">אירועים קרובים</p>
              <p className="text-3xl font-black">{upcomingCount}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-bold tracking-[0.16em] text-slate-400">סה״כ אירועים</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{events.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-bold tracking-[0.16em] text-slate-400">כיתות</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{classes.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-bold tracking-[0.16em] text-slate-400">מצב</p>
          <p className="mt-2 text-lg font-black text-slate-900">{profile.role === "student" ? "תלמיד" : "מורה"}</p>
        </div>
      </div>

      <CalendarBoard events={events} />
    </div>
  );
}
