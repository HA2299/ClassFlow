export const DEMO_INSTITUTION_ID = "11111111-1111-1111-1111-111111111111";
export const DEMO_TEACHER_ID = "22222222-2222-2222-2222-222222222222";
export const DEMO_CLASS_A_ID = "33333333-3333-3333-3333-333333333331";
export const DEMO_CLASS_B_ID = "33333333-3333-3333-3333-333333333332";
export const DEMO_CLASS_C_ID = "33333333-3333-3333-3333-333333333333";

export const DEMO_STUDENT_PROFILE_ID = "44444444-4444-4444-4444-444444444444";
export const DEMO_STUDENT_RECORD_ID = "student-1";
export const DEMO_STUDENT_EMAIL = "student@demo.classflow";

export const DEMO_SESSION_COOKIE = "classflow_demo_user";
export const DEMO_ROLE_COOKIE = "classflow_demo_role";
export const DEMO_PASSWORD = "demo1234";
export const DEMO_TEACHER_EMAIL = "teacher@demo.classflow";
export const DEMO_PARENT_EMAIL = "parent@demo.classflow";
export const DEMO_PARENT_PROFILE_ID = "55555555-5555-5555-5555-555555555555";

export function getHomePathForRole(role: string): string {
  switch (role) {
    case "student":
      return "/student";
    case "parent":
      return "/parent";
    case "institution_admin":
    case "system_admin":
      return "/admin";
    default:
      return "/dashboard";
  }
}
