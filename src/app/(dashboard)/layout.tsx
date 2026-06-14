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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/dashboard"
              className="text-xl font-semibold tracking-tight text-foreground"
            >
              ClassFlow
            </Link>
            <nav className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-2 transition hover:bg-muted hover:text-foreground"
              >
                דאשבורד
              </Link>
              <Link
                href="/classes"
                className="rounded-full px-3 py-2 transition hover:bg-muted hover:text-foreground"
              >
                כיתות
              </Link>
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">{profile.full_name}</span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                יציאה
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="border-b border-border/70 bg-muted/60 px-4 py-3 text-center text-sm text-muted-foreground">
        מצב דמו — נתונים מקומיים. Supabase שמור ב-<code className="text-xs">archive/</code>
      </div>
      <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
    </div>
  );
}
