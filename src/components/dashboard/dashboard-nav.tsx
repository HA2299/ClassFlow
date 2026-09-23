"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardCheck, ClipboardList, LayoutDashboard, Menu, Settings2, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const teacherLinks = [
  { href: "/dashboard", label: "סקירה", icon: LayoutDashboard },
  { href: "/classes", label: "הכיתות שלי", icon: Users },
  { href: "/assignments", label: "משימות", icon: ClipboardCheck },
  { href: "/review", label: "בדיקת הגשות", icon: ClipboardList },
  { href: "/teacher/resources", label: "ספרייה", icon: BookOpen },
];

const studentLinks = [
  { href: "/student", label: "סקירה", icon: LayoutDashboard },
  { href: "/student/assignments", label: "המשימות שלי", icon: ClipboardCheck },
  { href: "/student/resources", label: "חומרי עזר", icon: BookOpen },
];

export function DashboardNav({
  role,
  fullName,
}: {
  role: string;
  fullName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const isTeacher = role === "teacher" || role === "institution_admin" || role === "system_admin";
  const links = isTeacher ? teacherLinks : role === "student" ? studentLinks : [{ href: "/parent", label: "סקירה", icon: LayoutDashboard }];
  const isAdmin = role === "institution_admin" || role === "system_admin";

  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && href !== "/student" && pathname.startsWith(`${href}/`));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
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

  return (
    <div ref={navRef} className="relative">
      <div className="hidden items-center gap-1 lg:flex">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn("nav-link", isActive(href) && "nav-link-active")}>
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link href="/admin" className={cn("nav-link", isActive("/admin") && "nav-link-active")}>
            <Settings2 className="size-4" />
            ניהול
          </Link>
        )}
      </div>

      <button type="button" onClick={() => setOpen((value) => !value)} className="icon-button lg:hidden" aria-label={open ? "סגור תפריט" : "פתח תפריט"} aria-expanded={open} aria-controls="mobile-dashboard-menu">
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div id="mobile-dashboard-menu" className="fixed inset-x-3 top-[4.5rem] z-50 max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.16)] lg:hidden sm:absolute sm:inset-x-4 sm:top-[calc(100%+0.75rem)] sm:max-h-none">
          <div className="border-b border-slate-100 px-3 py-3">
            <p className="text-xs font-medium text-slate-500">מחובר/ת כ־</p>
            <p className="mt-1 font-bold text-slate-900">{fullName}</p>
          </div>
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("mobile-nav-link", isActive(href) && "mobile-nav-link-active")}>
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          {isAdmin && <Link href="/admin" onClick={() => setOpen(false)} className={cn("mobile-nav-link", isActive("/admin") && "mobile-nav-link-active")}><Settings2 className="size-4" /> ניהול</Link>}
        </div>
      )}
    </div>
  );
}
