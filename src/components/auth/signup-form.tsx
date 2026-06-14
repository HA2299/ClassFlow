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
    <Card>
      <CardHeader>
        <CardTitle>הרשמה למורה</CardTitle>
        <CardDescription>
          צור מוסד חדש והתחל לנהל כיתות ב-ClassFlow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">שם מלא</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="institutionName">שם מוסד</Label>
            <Input id="institutionName" name="institutionName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
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
              minLength={8}
              autoComplete="new-password"
              dir="ltr"
            />
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <SubmitButton />
          <p className="text-center text-sm text-muted-foreground">
            כבר יש לך חשבון?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              התחברות
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
