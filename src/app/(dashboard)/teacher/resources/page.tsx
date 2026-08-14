import Link from "next/link";
import { requireTeacher } from "@/lib/auth/session";
import { getClassesByTeacher } from "@/lib/data/store";
import { getTeacherResources } from "@/app/actions/resources";
import { ResourceManager } from "@/components/resources/resource-manager";
import { buttonVariants } from "@/components/ui/button";

export default async function TeacherResourcesPage() {
  const profile = await requireTeacher();
  const classes = await getClassesByTeacher(profile.id);
  const resources = await getTeacherResources(profile.id);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.3em] text-violet-600">RESOURCES</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">סיכומים וסטטיסטיקות</h1>
            <p className="mt-1 text-sm text-slate-500">ניהול חומרי עזר, מצגות, נוסחאות וקישורים שימושיים.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
              חזרה לדשבורד
            </Link>
          </div>
        </div>
      </section>

      <ResourceManager initialItems={resources} classes={classes} />
    </div>
  );
}
