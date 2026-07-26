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
}> {
  const classes = await getClassesByTeacher(teacherId);
  return {
    atRiskStudents: await getAtRiskStudentsForTeacher(teacherId),
    activeAssignments: await getActiveAssignmentsForTeacher(teacherId),
    recentSubmissions: await getRecentSubmissionsForTeacher(teacherId),
    classCount: classes.length,
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
