"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signIn, type AuthActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "מתחבר..." : "התחברות"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(signIn, initialState);

  return (
    <Card className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7">
      <CardHeader className="mb-2 space-y-2">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-blue-500/25">
          C
        </div>
        <CardTitle className="text-2xl text-slate-900">התחברות</CardTitle>
        <CardDescription className="text-sm text-slate-600">
          התחבר באמצעות כתובת האימייל והסיסמה שלך
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              אימייל
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
              className="rounded-2xl border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-900 shadow-sm ring-0 transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              סיסמה
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              dir="ltr"
              className="rounded-2xl border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-900 shadow-sm ring-0 transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}
          <SubmitButton />
          <p className="text-center text-sm text-slate-600">
            אין לך חשבון?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-600 underline-offset-4 transition hover:text-blue-700 hover:underline"
            >
              הרשמה
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
