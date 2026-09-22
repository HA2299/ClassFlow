import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import { getAssignmentById, getClassById, getStudentById } from "@/lib/data/store";
import { createAdminClient } from "@/lib/supabase/server";

const BUCKET_NAME = "submission-files";

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  const rawPath = request.nextUrl.searchParams.get("path")?.trim() ?? "";
  let path = rawPath;
  if (rawPath.startsWith("http")) {
    try {
      const url = new URL(rawPath);
      const legacyPrefix = `/storage/v1/object/public/${BUCKET_NAME}/`;
      if (!url.pathname.startsWith(legacyPrefix)) {
        return new NextResponse("קובץ לא נמצא", { status: 404 });
      }
      path = decodeURIComponent(url.pathname.slice(legacyPrefix.length));
    } catch {
      return new NextResponse("קובץ לא נמצא", { status: 404 });
    }
  }
  const segments = path.split("/");

  if (!profile || !path || segments.length < 4 || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    return new NextResponse("קובץ לא נמצא", { status: 404 });
  }

  const [institutionId, assignmentId, studentId] = segments;
  if (institutionId !== profile.institution_id) {
    return new NextResponse("אין הרשאה לקובץ", { status: 403 });
  }

  const [assignment, student] = await Promise.all([
    getAssignmentById(assignmentId),
    getStudentById(studentId),
  ]);
  if (!assignment || !student || student.class_id !== assignment.class_id) {
    return new NextResponse("קובץ לא נמצא", { status: 404 });
  }

  const classItem = await getClassById(assignment.class_id);
  const canAccess =
    (profile.role === "student" && profile.linked_student_id === studentId) ||
    (profile.role === "parent" && profile.linked_student_id === studentId) ||
    ((profile.role === "teacher" || profile.role === "institution_admin" || profile.role === "system_admin") &&
      (profile.role !== "teacher" || classItem?.teacher_id === profile.id));

  if (!canAccess) {
    return new NextResponse("אין הרשאה לקובץ", { status: 403 });
  }

  const adminClient = createAdminClient();
  if (!adminClient) return new NextResponse("שירות הקבצים אינו מוגדר", { status: 503 });

  const { data, error } = await adminClient.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    return new NextResponse("קובץ לא נמצא", { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}