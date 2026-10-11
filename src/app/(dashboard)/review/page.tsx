import { requireTeacher } from "@/lib/auth/session";
import { getTeacherAssignmentsSummary } from "@/app/actions/assignments";
import { getClassById, getGradesBySubmissions, getStudentsByClass, getSubmissionsByAssignment } from "@/lib/data/store";
import { GlobalReviewHub } from "@/components/review/global-review-hub";

export default async function ReviewPage() {
  const profile = await requireTeacher();
  const { assignments } = await getTeacherAssignmentsSummary(profile.id);
  const classIds = Array.from(new Set(assignments.map((assignment) => assignment.class_id)));
  const classes = (await Promise.all(classIds.map((classId) => getClassById(classId)))).filter(
    (classItem): classItem is NonNullable<typeof classItem> => classItem !== null
  );
  const classMap = new Map(classes.map((classItem) => [classItem.id, classItem]));
  const students = (await Promise.all(classIds.map((classId) => getStudentsByClass(classId)))).flat();
  const reviewResults = await Promise.all(
    assignments.map(async (assignment) => {
      const submissions = await getSubmissionsByAssignment(assignment.id);
      const grades = await getGradesBySubmissions(submissions.map((submission) => submission.id));
      const submitted = submissions.filter(
        (submission) => Boolean(submission.answer.trim()) || (submission.attachment_urls?.length ?? 0) > 0
      ).length;
      const graded = submissions.filter((submission) => submission.status === "graded").length;
      const average = grades.length > 0 ? Math.round(grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length) : 0;
      const totalStudents = students.filter((student) => student.class_id === assignment.class_id).length;
      const averageGradingHours = grades.length > 0 ? grades.reduce((sum, grade) => sum + Math.max(0, (new Date(grade.graded_at).getTime() - Date.now()) / 3600000), 0) / grades.length : 0;
      return { id: assignment.id, classId: assignment.class_id, name: assignment.name, className: classMap.get(assignment.class_id)?.name ?? "כיתה", submitted, graded, totalStudents, dueDate: assignment.due_date, average, averageGradingHours };
    })
  );
  return <GlobalReviewHub assignments={reviewResults} />;
}
