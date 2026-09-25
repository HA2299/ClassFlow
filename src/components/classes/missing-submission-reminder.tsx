"use client";

import { useState, useTransition } from "react";
import { BellRing, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendMissingSubmissionReminders } from "@/app/actions/notifications";

export function MissingSubmissionReminder({ classId, assignmentId, count }: { classId: string; assignmentId: string; count: number }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function sendReminders() {
    setMessage("");
    startTransition(async () => {
      const result = await sendMissingSubmissionReminders(classId, assignmentId);
      setMessage(result.error ?? (result.sent > 0 ? `נשלחו ${result.sent} תזכורות` : "התזכורות נרשמו במערכת"));
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Button type="button" size="sm" variant="secondary" onClick={sendReminders} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : message && !message.includes("שגיאה") ? <Check className="size-4" /> : <BellRing className="size-4" />}
        {pending ? "שולח..." : `שליחת תזכורת ל־${count} תלמידים`}
      </Button>
      {message && <span className="text-xs font-semibold text-slate-500" role="status">{message}</span>}
    </div>
  );
}