"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type InAppNotification,
} from "@/app/actions/notifications";
import { cn } from "@/lib/utils";

function formatNotificationTime(value: string) {
  const date = new Date(value);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דקות`;
  if (minutes < 1440) return `לפני ${Math.floor(minutes / 60)} שעות`;
  return date.toLocaleDateString("he-IL", { day: "numeric", month: "short" });
}

export function NotificationBell({ initialNotifications }: { initialNotifications: InAppNotification[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleRead = async (notification: InAppNotification) => {
    if (!notification.read_at) {
      const previousNotifications = notifications;
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
      setActionError("");
      setPendingNotificationId(notification.id);
      const success = await markNotificationRead(notification.id);
      setPendingNotificationId(null);
      if (!success) {
        setNotifications(previousNotifications);
        setActionError("לא ניתן לעדכן את ההתראה. נסו שוב.");
        return;
      }
    }
    setOpen(false);
    router.push(notification.href);
  };

  const handleMarkAllRead = () => {
    const previousNotifications = notifications;
    setNotifications((current) => current.map((notification) => ({ ...notification, read_at: notification.read_at ?? new Date().toISOString() })));
    setActionError("");
    startTransition(() => {
      void markAllNotificationsRead().then((success) => {
        if (!success) {
          setNotifications(previousNotifications);
          setActionError("לא ניתן לעדכן את ההתראות. נסו שוב.");
        }
      });
    });
  };

  return (
    <div ref={bellRef} className="relative">
      <button type="button" className="icon-button relative" aria-label={unreadCount ? `${unreadCount} התראות שלא נקראו` : "התראות"} aria-expanded={open} aria-controls="notifications-panel" onClick={() => setOpen((value) => !value)}>
        <Bell className={cn("size-4", unreadCount > 0 && "text-cyan-700")} />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-black leading-4 text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default bg-transparent" aria-label="סגור התראות" onClick={() => setOpen(false)} />
          <section id="notifications-panel" className="fixed inset-x-3 top-[4.5rem] z-50 max-h-[calc(100vh-5.5rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:absolute sm:left-0 sm:right-auto sm:top-12 sm:w-[min(22rem,calc(100vw-2rem))] sm:max-h-none">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div><h2 className="font-black text-slate-950">התראות</h2><p className="text-xs text-slate-500">{unreadCount ? `${unreadCount} חדשות` : "הכול נקרא"}</p></div>
              {unreadCount > 0 && <button type="button" onClick={handleMarkAllRead} disabled={isPending} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-900"><CheckCheck className="size-3.5" /> סמן הכול כנקרא</button>}
            </header>
            {actionError && <p className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700" role="alert">{actionError}</p>}
            <div className="max-h-[min(28rem,65vh)] overflow-y-auto p-2">
              {isPending && notifications.length === 0 && <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" /> טוען התראות...</div>}
              {!isPending && notifications.length === 0 && <div className="p-8 text-center"><span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Bell className="size-5" /></span><p className="mt-3 text-sm font-bold text-slate-700">אין התראות חדשות</p><p className="mt-1 text-xs text-slate-500">נעדכן אותך כאן כשיהיה משהו חדש.</p></div>}
              {notifications.map((notification) => (
                <button type="button" key={notification.id} onClick={() => void handleRead(notification)} disabled={isPending || pendingNotificationId !== null} className={cn("flex w-full gap-3 rounded-2xl p-3 text-right transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70", !notification.read_at && "bg-cyan-50/70")}>
                  <span className={cn("mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl", notification.read_at ? "bg-slate-100 text-slate-400" : "bg-cyan-600 text-white")}>
                    {notification.read_at ? <Check className="size-4" /> : <Bell className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1"><span className={cn("block text-sm leading-5", notification.read_at ? "font-semibold text-slate-700" : "font-black text-slate-950")}>{notification.title}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{notification.message}</span><span className="mt-1 block text-[10px] font-medium text-slate-400">{formatNotificationTime(notification.created_at)}</span></span>
                  {!notification.read_at && <span className="mt-2 size-2 shrink-0 rounded-full bg-cyan-500" />}
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}