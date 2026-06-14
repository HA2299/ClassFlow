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
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold tracking-tight">
              ClassFlow
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground"
              >
                דאשבורד
              </Link>
              <Link
                href="/classes"
                className="text-muted-foreground hover:text-foreground"
              >
                כיתות
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {profile.full_name}
            </span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                יציאה
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="border-b bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
        מצב דמו — נתונים מקומיים. Supabase שמור ב-{" "}
        <code className="text-xs">archive/</code>
      </div>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
