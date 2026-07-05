import Link from "next/link";
import { getTeacherClassById } from "@/app/actions/auth";
import { requireTeacher } from "@/lib/auth/session";
import { AssignmentWizard } from "@/components/assignments/assignment-wizard";
import { buttonVariants } from "@/components/ui/button";

export default async function AssignmentWizardPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireTeacher();
  const classItem = await getTeacherClassById(params.id, profile.id);

  if (!classItem) {
    return <p>כיתה לא נמצאה</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">יצירת משימה עם AI</h1>
        <Link
          href={`/classes/${params.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          חזרה
        </Link>
      </div>
      <AssignmentWizard classId={params.id} className={classItem.name} />
    </div>
  );
}
