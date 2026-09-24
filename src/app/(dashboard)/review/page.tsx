import { requireTeacher } from "@/lib/auth/session";
import { getTeacherAssignmentsSummary } from "@/app/actions/assignments";
import { getClassById, getGradeBySubmission, getStudentsByClass, getSubmissionsByAssignment } from "@/lib/data/store";
import { ReviewCenter, type ReviewSubmission } from "@/components/review/review-center";

export default async function ReviewPage() {
  const profile = await requireTeacher();
  const { assignments } = await getTeacherAssignmentsSummary(profile.id);
  const classIds = Array.from(new Set(assignments.map((assignment) => assignment.class_id)));
  const classes = (await Promise.all(classIds.map((classId) => getClassById(classId)))).filter(
    (classItem): classItem is NonNullable<typeof classItem> => classItem !== null
  );
  const classMap = new Map(classes.map((classItem) => [classItem.id, classItem]));
  const students = (await Promise.all(classIds.map((classId) => getStudentsByClass(classId)))).flat();
  const studentMap = new Map(students.map((student) => [student.id, student]));
  const reviewResults = await Promise.all(
    assignments.map(async (assignment) => {
      const submissions = await getSubmissionsByAssignment(assignment.id);
      const gradeEntries = await Promise.all(
        submissions.map(async (submission) => [submission.id, await getGradeBySubmission(submission.id)] as const)
      );
      const gradeMap = new Map(gradeEntries);
      const grades = gradeEntries.flatMap(([, grade]) => (grade ? [grade] : []));
      const submitted = submissions.filter(
        (submission) => Boolean(submission.answer.trim()) || (submission.attachment_urls?.length ?? 0) > 0
      ).length;
      const graded = submissions.filter((submission) => submission.status === "graded").length;
      const average = grades.length > 0 ? Math.round(grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length) : 0;
      const submissionRows = submissions.map((submission) => {
        const student = studentMap.get(submission.student_id);
        const grade = gradeMap.get(submission.id);
        return { id: submission.id, assignmentId: assignment.id, classId: assignment.class_id, assignmentName: assignment.name, className: classMap.get(assignment.class_id)?.name ?? "כיתה", studentName: student?.name ?? "תלמיד", studentInitial: (student?.name ?? "תלמיד").charAt(0), submittedAt: submission.submitted_at || submission.created_at, status: submission.status, score: grade?.score ?? null, feedback: grade?.feedback ?? null, answer: submission.answer } satisfies ReviewSubmission;
      });
      return { item: { id: assignment.id, classId: assignment.class_id, name: assignment.name, className: classMap.get(assignment.class_id)?.name ?? "כיתה", submitted, graded, average }, submissionRows };
    })
  );
  const reviewItems = reviewResults.map(({ item }) => item);
  const submissionRows = reviewResults.flatMap(({ submissionRows: rows }) => rows);
  const submittedCount = reviewItems.reduce((sum, item) => sum + item.submitted, 0);
  const gradedCount = reviewItems.reduce((sum, item) => sum + item.graded, 0);
  const pendingReviewCount = Math.max(0, submittedCount - gradedCount);
  const averageScore = reviewItems.filter((item) => item.average > 0).length > 0 ? Math.round(reviewItems.filter((item) => item.average > 0).reduce((sum, item) => sum + item.average, 0) / reviewItems.filter((item) => item.average > 0).length) : 0;
  return <ReviewCenter assignments={reviewItems} submissions={submissionRows} submittedCount={submittedCount} gradedCount={gradedCount} pendingReviewCount={pendingReviewCount} averageScore={averageScore} />;
}
