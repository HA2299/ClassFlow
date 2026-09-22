"use server";

import type { Assignment, Student, Submission } from "@/types/database";
import {
  detectRiskFlagsForTeacher,
  getActiveAssignmentsForTeacher,
  getAtRiskStudentsForTeacher,
  getClassAnalytics,
  getClassSubmissionStats,
  getAIInsightsForClass,
  getRecentSubmissionsForTeacher,
  getClassesByTeacher,
  getSubmissionRateForTeacher,
  addRiskFlag,
  riskFlagExists,
} from "@/lib/data/store";

export async function getDashboardData(teacherId: string): Promise<{
  atRiskStudents: Student[];
  activeAssignments: Assignment[];
  recentSubmissions: Array<
    Submission & { assignment?: Assignment; student?: Student }
  >;
  classCount: number;
  submissionRate: number;
}> {
  const classes = await getClassesByTeacher(teacherId);
  const [atRiskStudents, activeAssignments, recentSubmissions, submissionRate] = await Promise.all([
    getAtRiskStudentsForTeacher(teacherId),
    getActiveAssignmentsForTeacher(teacherId),
    getRecentSubmissionsForTeacher(teacherId),
    getSubmissionRateForTeacher(teacherId),
  ]);
  return {
    atRiskStudents,
    activeAssignments,
    recentSubmissions,
    classCount: classes.length,
    submissionRate,
  };
}

export async function getClassDashboardData(classId: string) {
  return {
    stats: await getClassSubmissionStats(classId),
    analytics: await getClassAnalytics(classId),
    insights: await getAIInsightsForClass(classId),
  };
}

export async function runRiskDetection(teacherId: string) {
  const flags = await detectRiskFlagsForTeacher(teacherId);
  for (const flag of flags) {
    if (!(await riskFlagExists(flag.id))) {
      await addRiskFlag(flag);
    }
  }
  return flags.length;
}
