import { requireStudent } from "@/lib/auth/session";
import { getLinkedStudentRecord } from "@/app/actions/students";
import { getStudentResources } from "@/app/actions/resources";
import { ResourceBrowser } from "@/components/resources/resource-browser";

export default async function StudentResourcesPage() {
  const profile = await requireStudent();
  const student = await getLinkedStudentRecord(profile.id);

  if (!student) {
    return <p className="text-slate-500">לא נמצא תלמיד מקושר.</p>;
  }

  const resources = await getStudentResources(student.class_id);

  return (
    <div className="space-y-6"><ResourceBrowser initialItems={resources} /></div>
  );
}
