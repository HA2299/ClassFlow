import Link from "next/link";
import { requireTeacher } from "@/lib/auth/session";
import { getClassesByTeacher } from "@/lib/data/store";
import { getTeacherResources } from "@/app/actions/resources";
import { ResourceManager } from "@/components/resources/resource-manager";
import { buttonVariants } from "@/components/ui/button";
import { BookOpen, UploadCloud } from "lucide-react";

export default async function TeacherResourcesPage() {
  const profile = await requireTeacher();
  const classes = await getClassesByTeacher(profile.id);
  const resources = await getTeacherResources(profile.id);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:p-8">
        <div className="absolute -left-16 -top-20 size-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.24em] text-cyan-200"><BookOpen className="size-3.5" /> RESOURCE STUDIO</div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">הספרייה של הכיתה</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">כל הסיכומים, המצגות והקבצים החשובים במקום אחד. העלו חומר חדש, ארגנו אותו ושתפו אותו מיד.</p>
          </div>

          <div className="relative flex flex-wrap gap-2">
            <Link href="#upload-resource" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <UploadCloud className="size-4" /> העלאת חומר
            </Link>
            <Link href="/dashboard" className="inline-flex h-8 items-center rounded-[1rem] border border-white/15 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/15">
              חזרה לדשבורד
            </Link>
          </div>
        </div>
      </section>

      <div id="upload-resource"><ResourceManager initialItems={resources} classes={classes} /></div>
    </div>
  );
}
