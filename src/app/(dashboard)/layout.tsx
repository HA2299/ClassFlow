import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { LogOut } from "lucide-react";
import { getMyNotifications } from "@/app/actions/notifications";
import { NotificationBell } from "@/components/dashboard/notification-bell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const notifications = await getMyNotifications();
  const roleLabel =
    profile.role === "teacher"
      ? "מרחב מורה"
      : profile.role === "student"
        ? "מרחב תלמיד"
        : "מרחב ניהול";
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] text-slate-900">
      <header className="teacher-navbar sticky top-0 z-40 border-b border-white/80 bg-white/85 backdrop-blur-2xl">
        <div className="relative mx-auto flex min-h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <Link
              href={profile.role === "student" ? "/student" : "/dashboard"}
              className="group inline-flex shrink-0 items-center gap-2.5 text-xl font-black tracking-tight text-slate-950"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-cyan-300 shadow-lg shadow-slate-900/20 transition duration-200 group-hover:-rotate-3 group-hover:bg-cyan-700 group-hover:text-white">
                CF
              </span>
              <span className="hidden sm:block">ClassFlow</span>
            </Link>
            <DashboardNav role={profile.role} fullName={profile.full_name} />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <NotificationBell initialNotifications={notifications} />
            <div className="hidden items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 sm:flex">
              <span className="flex size-7 items-center justify-center rounded-xl bg-cyan-100 text-xs font-black text-cyan-800">{profile.full_name.charAt(0)}</span>
              <div className="max-w-32 leading-tight">
                <p className="truncate text-xs font-black text-slate-800">{profile.full_name}</p>
                <p className="text-[10px] font-semibold text-slate-400">{roleLabel}</p>
              </div>
            </div>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm" className="gap-2 border-slate-200/80 bg-white/70">
                <LogOut className="size-4" /> <span className="hidden sm:inline">יציאה</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">{children}</main>
    </div>
  );
}
