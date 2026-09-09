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
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-2xl shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4 sm:gap-8">
            <Link
              href={profile.role === "student" ? "/student" : profile.role === "parent" ? "/parent" : "/dashboard"}
              className="inline-flex shrink-0 items-center gap-2 text-xl font-black tracking-tight text-slate-950"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-cyan-300 shadow-lg shadow-slate-900/20">
                CF
              </span>
              ClassFlow
            </Link>
            <DashboardNav role={profile.role} fullName={profile.full_name} />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell initialNotifications={notifications} />
            <div className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 sm:block">
              {profile.full_name}
            </div>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm" className="gap-2">
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
