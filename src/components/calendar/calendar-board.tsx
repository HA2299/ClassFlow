"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, List, LayoutGrid } from "lucide-react";
import type { CalendarEventRecord } from "@/app/actions/calendar";

type ViewMode = "month" | "week" | "list";

const eventTone: Record<string, string> = {
  exam: "bg-rose-100 text-rose-700 ring-rose-200",
  quiz: "bg-amber-100 text-amber-800 ring-amber-200",
  makeup_exam: "bg-purple-100 text-purple-700 ring-purple-200",
  project: "bg-cyan-100 text-cyan-700 ring-cyan-200",
  submission_deadline: "bg-orange-100 text-orange-700 ring-orange-200",
  special_lesson: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  class_activity: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  school_event: "bg-blue-100 text-blue-700 ring-blue-200",
  other: "bg-slate-200 text-slate-700 ring-slate-300",
};

function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("he-IL", options).format(date);
}

export function CalendarBoard({ events }: { events: CalendarEventRecord[] }) {
  const [view, setView] = useState<ViewMode>("month");
  const [monthCursor, setMonthCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const monthLabel = formatDate(monthCursor, { month: "long", year: "numeric" });

  const monthDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - startOffset);
    const cells: Date[] = [];

    for (let index = 0; index < 42; index += 1) {
      cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index));
    }

    return cells;
  }, [monthCursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventRecord[]>();
    for (const event of events) {
      const dateKey = new Date(event.start_at).toISOString().slice(0, 10);
      map.set(dateKey, [...(map.get(dateKey) ?? []), event]);
    }
    return map;
  }, [events]);

  const sortedEvents = [...events].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const prevMonth = () => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1));
  const nextMonth = () => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1));

  return (
    <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-white/85 p-4 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><CalendarDays className="size-5" /></span>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-slate-400">CALENDAR</p>
            <p className="text-lg font-black text-slate-900">לוח השנה</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {(["month", "week", "list"] as ViewMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${view === item ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"}`}
              >
                {item === "month" ? <LayoutGrid className="size-3.5" /> : item === "week" ? <CalendarDays className="size-3.5" /> : <List className="size-3.5" />}
                {item === "month" ? "חודש" : item === "week" ? "שבוע" : "רשימה"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1">
            <button type="button" onClick={prevMonth} className="inline-flex size-8 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"><ChevronRight className="size-4" /></button>
            <span className="min-w-[8rem] text-center text-sm font-black text-slate-900">{monthLabel}</span>
            <button type="button" onClick={nextMonth} className="inline-flex size-8 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"><ChevronLeft className="size-4" /></button>
          </div>
        </div>
      </div>

      {view === "month" && (
        <div className="grid grid-cols-7 gap-2 text-center">
          {['שני','שלישי','רביעי','חמישי','שישי','שבת','ראשון'].map((day) => (
            <div key={day} className="pb-2 text-[10px] font-black tracking-[0.2em] text-slate-400">{day}</div>
          ))}
          {monthDays.map((day) => {
            const key = day.toISOString().slice(0, 10);
            const dayEvents = eventsByDay.get(key) ?? [];
            const isCurrentMonth = day.getMonth() === monthCursor.getMonth();
            return (
              <div key={key} className={`min-h-[110px] rounded-2xl border p-2 text-right ${isCurrentMonth ? "border-slate-200 bg-slate-50/50" : "border-slate-100 bg-slate-25 text-slate-400"}`}>
                <div className={`mb-2 inline-flex min-w-7 items-center justify-center rounded-xl px-1.5 py-1 text-xs font-black ${isCurrentMonth ? "bg-white text-slate-700" : "bg-slate-100 text-slate-400"}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div key={event.id} className={`rounded-xl px-2 py-1 text-[10px] font-bold ring-1 ${eventTone[event.event_type] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && <p className="text-[10px] font-bold text-slate-500">+{dayEvents.length - 2}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "week" && (
        <div className="grid gap-3 md:grid-cols-7">
          {Array.from({ length: 7 }, (_, index) => {
            const start = new Date(monthCursor);
            start.setDate(start.getDate() - start.getDay() + index + 1);
            const key = start.toISOString().slice(0, 10);
            const items = eventsByDay.get(key) ?? [];
            return (
              <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="mb-2 text-xs font-black text-slate-500">{formatDate(start, { weekday: "short", day: "numeric" })}</p>
                <div className="space-y-2">
                  {items.length > 0 ? items.map((event) => (
                    <div key={event.id} className={`rounded-xl px-2 py-1 text-[10px] font-bold ring-1 ${eventTone[event.event_type] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
                      {event.title}
                    </div>
                  )) : <p className="text-[10px] text-slate-400">אין אירועים</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "list" && (
        <div className="space-y-3">
          {sortedEvents.length > 0 ? sortedEvents.map((event) => (
            <div key={event.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">{event.title}</p>
                <p className="text-xs text-slate-500">{formatDate(new Date(event.start_at), { dateStyle: "medium" })} · {formatDate(new Date(event.start_at), { timeStyle: "short" })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${eventTone[event.event_type] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>{event.event_type}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{event.status}</span>
              </div>
            </div>
          )) : <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">אין אירועים להצגה.</p>}
        </div>
      )}
    </div>
  );
}
