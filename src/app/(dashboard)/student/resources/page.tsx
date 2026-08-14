import Link from "next/link";
import { requireStudent } from "@/lib/auth/session";
import { getLinkedStudentRecord } from "@/app/actions/students";
import { getStudentResources } from "@/app/actions/resources";
import { ResourceBrowser } from "@/components/resources/resource-browser";
import { buttonVariants } from "@/components/ui/button";

export default async function StudentResourcesPage() {
  const profile = await requireStudent();
  const student = await getLinkedStudentRecord(profile.id);

  if (!student) {
    return <p className="text-slate-500">לא נמצא תלמיד מקושר.</p>;
  }

  const resources = await getStudentResources(student.class_id);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#0f766e)] p-6 text-white shadow-[0_30px_80px_rgba(37,99,235,0.25)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.28em] text-blue-100">
              RESOURCE HUB
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">מרכז חומרי עזר</h1>
            <p className="mt-2 text-sm text-blue-100/85 sm:text-base">
              סיכומים, מצגות, נוסחאות וקישורים שימושיים שמסודרים ונגישים בקלות.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/student" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              חזרה לדשבורד
            </Link>
          </div>
        </div>
      </section>

      <ResourceBrowser initialItems={resources} />
    </div>
  );
}
