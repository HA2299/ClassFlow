"use server";

import type { Assignment, Student, Submission } from "@/types/database";
import { ensureDemoStoreHydrated } from "@/lib/demo/hydrate.server";
import {
  detectRiskFlagsForTeacher,
  getActiveAssignmentsForTeacher,
  getAtRiskStudentsForTeacher,
  getClassAnalytics,
  getClassSubmissionStats,
  getAIInsightsForClass,
  getRecentSubmissionsForTeacher,
  getClassesByTeacher,
} from "@/lib/demo/store";

function hydrate(): void {
  ensureDemoStoreHydrated();
}

export async function getDashboardData(teacherId: string): Promise<{
  atRiskStudents: Student[];
  activeAssignments: Assignment[];
  recentSubmissions: Array<
    Submission & { assignment?: Assignment; student?: Student }
  >;
  classCount: number;
}> {
  hydrate();
  return {
    atRiskStudents: getAtRiskStudentsForTeacher(teacherId),
    activeAssignments: getActiveAssignmentsForTeacher(teacherId),
    recentSubmissions: getRecentSubmissionsForTeacher(teacherId),
    classCount: getClassesByTeacher(teacherId).length,
  };
}

export async function getClassDashboardData(classId: string) {
  hydrate();
  return {
    stats: getClassSubmissionStats(classId),
    analytics: getClassAnalytics(classId),
    insights: getAIInsightsForClass(classId),
  };
}

export async function runRiskDetection(teacherId: string) {
  hydrate();
  const flags = detectRiskFlagsForTeacher(teacherId);
  const { saveDemoStore } = await import("@/lib/demo/hydrate.server");
  const { getStore } = await import("@/lib/demo/store");
  const store = getStore();
  for (const flag of flags) {
    if (!store.riskFlags.some((f) => f.id === flag.id)) {
      store.riskFlags.push(flag);
    }
  }
  saveDemoStore();
  return flags.length;
}
