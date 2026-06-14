import type { Class, Institution, Profile } from "@/types/database";
import {
  DEMO_CLASS_A_ID,
  DEMO_CLASS_B_ID,
  DEMO_CLASS_C_ID,
  DEMO_INSTITUTION_ID,
  DEMO_TEACHER_EMAIL,
  DEMO_TEACHER_ID,
  DEMO_PASSWORD,
} from "./constants";

const now = "2026-01-15T10:00:00.000Z";
const weekAgo = "2026-01-08T10:00:00.000Z";
const twoWeeksAgo = "2026-01-01T10:00:00.000Z";

export const seedInstitution: Institution = {
  id: DEMO_INSTITUTION_ID,
  name: "בית ספר הדגמה",
  created_at: twoWeeksAgo,
};

export const seedTeacher: Profile = {
  id: DEMO_TEACHER_ID,
  institution_id: DEMO_INSTITUTION_ID,
  role: "teacher",
  full_name: "שרה לוי",
  email: DEMO_TEACHER_EMAIL,
  created_at: twoWeeksAgo,
  updated_at: now,
};

export const seedClasses: Class[] = [
  {
    id: DEMO_CLASS_A_ID,
    institution_id: DEMO_INSTITUTION_ID,
    name: "כיתה א׳",
    teacher_id: DEMO_TEACHER_ID,
    created_at: weekAgo,
    updated_at: now,
  },
  {
    id: DEMO_CLASS_B_ID,
    institution_id: DEMO_INSTITUTION_ID,
    name: "כיתה ב׳",
    teacher_id: DEMO_TEACHER_ID,
    created_at: weekAgo,
    updated_at: now,
  },
  {
    id: DEMO_CLASS_C_ID,
    institution_id: DEMO_INSTITUTION_ID,
    name: "מתמטיקה מתקדמת",
    teacher_id: DEMO_TEACHER_ID,
    created_at: twoWeeksAgo,
    updated_at: weekAgo,
  },
];

export interface DemoStore {
  institutions: Institution[];
  profiles: Profile[];
  classes: Class[];
  passwords: Record<string, string>;
}

export function createSeedStore(): DemoStore {
  return {
    institutions: [structuredClone(seedInstitution)],
    profiles: [structuredClone(seedTeacher)],
    classes: structuredClone(seedClasses),
    passwords: { [DEMO_TEACHER_ID]: DEMO_PASSWORD },
  };
}
