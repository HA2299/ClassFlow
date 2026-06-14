"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createClass, type AuthActionState } from "@/app/actions/auth";
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
    <Button type="submit" disabled={pending}>
      {pending ? "יוצר..." : "יצירת כיתה"}
    </Button>
  );
}

export function CreateClassForm() {
  const [state, formAction] = useFormState(createClass, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>כיתה חדשה</CardTitle>
        <CardDescription>הוסף כיתה חדשה למוסד שלך</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם כיתה</Label>
            <Input id="name" name="name" required placeholder="למשל: כיתה א׳" />
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
