"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signUp, type AuthActionState } from "@/app/actions/auth";
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
      {pending ? "נרשם..." : "הרשמה"}
    </Button>
  );
}

export function SignUpForm() {
  const [state, formAction] = useFormState(signUp, initialState);

  return (
    <Card className="mx-auto max-w-lg rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7">
      <CardHeader className="mb-2 space-y-2">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-blue-500/25">
          C
        </div>
        <CardTitle className="text-2xl text-slate-900">יצירת חשבון</CardTitle>
        <CardDescription className="text-sm text-slate-600">
          צור חשבון חדש כמורה או תלמיד והתחל להשתמש ב-ClassFlow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
              שם מלא
            </Label>
            <Input
              id="fullName"
              name="fullName"
              required
              className="rounded-2xl border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-900 shadow-sm ring-0 transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="institutionName" className="text-sm font-medium text-slate-700">
              שם מוסד
            </Label>
            <Input
              id="institutionName"
              name="institutionName"
              required
              className="rounded-2xl border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-900 shadow-sm ring-0 transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
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
              minLength={8}
              autoComplete="new-password"
              dir="ltr"
              className="rounded-2xl border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-900 shadow-sm ring-0 transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="identityNumber" className="text-sm font-medium text-slate-700">
              תעודת זהות
            </Label>
            <Input
              id="identityNumber"
              name="identityNumber"
              autoComplete="off"
              dir="ltr"
              placeholder="הכנס תעודת זהות"
              className="rounded-2xl border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-900 shadow-sm ring-0 transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium text-slate-700">
              סוג חשבון
            </Label>
            <select
              id="role"
              name="role"
              defaultValue="teacher"
              className="flex h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="teacher">מורה</option>
              <option value="student">תלמיד</option>
            </select>
          </div>
          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}
          <SubmitButton />
          <p className="text-center text-sm text-slate-600">
            כבר יש לך חשבון?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 underline-offset-4 transition hover:text-blue-700 hover:underline"
            >
              התחברות
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
