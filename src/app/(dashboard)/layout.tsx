import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const isTeacher =
    profile.role === "teacher" ||
    profile.role === "institution_admin" ||
    profile.role === "system_admin";
  const isStudent = profile.role === "student";
  const isParent = profile.role === "parent";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.12),_transparent_25%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/75 backdrop-blur-2xl shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href={isStudent ? "/student" : isParent ? "/parent" : "/dashboard"}
              className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-500 text-sm font-black text-white shadow-lg shadow-blue-500/25">
                C
              </span>
              ClassFlow
            </Link>
            <nav className="flex flex-wrap gap-2 text-sm text-slate-600">
              {isTeacher && (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-full px-3 py-2 font-medium transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    דאשבורד
                  </Link>
                  <Link
                    href="/classes"
                    className="rounded-full px-3 py-2 font-medium transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    כיתות
                  </Link>
                  <Link
                    href="/assignments"
                    className="rounded-full px-3 py-2 font-medium transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    משימות
                  </Link>
                </>
              )}
              {isStudent && (
                <Link
                  href="/student"
                  className="rounded-full px-3 py-2 font-medium transition hover:bg-slate-100 hover:text-slate-900"
                >
                  המשימות שלי
                </Link>
              )}
              {isParent && (
                <Link
                  href="/parent"
                  className="rounded-full px-3 py-2 font-medium transition hover:bg-slate-100 hover:text-slate-900"
                >
                  התקדמות הילד
                </Link>
              )}
              {(profile.role === "institution_admin" ||
                profile.role === "system_admin") && (
                <Link
                  href="/admin"
                  className="rounded-full px-3 py-2 font-medium transition hover:bg-slate-100 hover:text-slate-900"
                >
                  ניהול
                </Link>
              )}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
              {profile.full_name}
            </div>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                יציאה
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</main>
    </div>
  );
}
