import { CreateClassForm } from "@/components/classes/create-class-form";

export default function NewClassPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">יצירת כיתה</h1>
        <p className="text-muted-foreground">הגדר כיתה חדשה לניהול תלמידים ומשימות</p>
      </div>
      <CreateClassForm />
    </div>
  );
}
