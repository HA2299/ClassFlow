import { requireAdmin } from "@/lib/auth/session";
import { runRiskDetectionAction } from "@/app/actions/admin";
import { ensureDemoStoreHydrated } from "@/lib/demo/hydrate.server";
import { getStore } from "@/lib/demo/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  ensureDemoStoreHydrated();
  const profile = await requireAdmin();
  const store = getStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">ניהול מוסד</h1>
        <p className="text-muted-foreground">{profile.full_name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">כיתות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{store.classes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תלמידים</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{store.students.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">מורים</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {store.profiles.filter((p) => p.role === "teacher").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">משימות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{store.assignments.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Detection AI</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={runRiskDetectionAction}>
            <Button type="submit">הרץ זיהוי סיכון</Button>
          </form>
          <p className="mt-2 text-sm text-muted-foreground">
            מנתח ציונים והגשות ומסמן תלמידים בסיכון
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
