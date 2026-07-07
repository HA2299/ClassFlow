"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signIn, type AuthActionState } from "@/app/actions/auth";
import {
  DEMO_PASSWORD,
  DEMO_STUDENT_EMAIL,
  DEMO_TEACHER_EMAIL,
} from "@/lib/demo/constants";
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
    <Card>
      <CardHeader>
        <CardTitle>ClassFlow</CardTitle>
        <CardDescription>
          מורה: {DEMO_TEACHER_EMAIL} · תלמיד: {DEMO_STUDENT_EMAIL} · הורה: parent@demo.classflow · סיסמה: {DEMO_PASSWORD}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={DEMO_TEACHER_EMAIL}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              defaultValue={DEMO_PASSWORD}
              dir="ltr"
            />
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <p className="text-sm text-muted-foreground">
            להתחברות כהורה, השתמש באימייל parent@demo.classflow.
          </p>
          <SubmitButton />
          <p className="text-center text-sm text-muted-foreground">
            אין לך חשבון?{" "}
            <Link
              href="/signup"
              className="text-primary underline-offset-4 hover:underline"
            >
              הרשמה
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
