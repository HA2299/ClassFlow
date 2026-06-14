import type { Class, Institution, Profile } from "@/types/database";
import { createSeedStore, type DemoStore } from "./seed";

const STORE_KEY = Symbol.for("classflow.demo.store");

function getGlobalStore(): DemoStore {
  const globalStore = globalThis as typeof globalThis & {
    [STORE_KEY]?: DemoStore;
  };

  if (!globalStore[STORE_KEY]) {
    globalStore[STORE_KEY] = createSeedStore();
  }

  return globalStore[STORE_KEY];
}

export function getStore(): DemoStore {
  return getGlobalStore();
}

export function findProfileById(id: string): Profile | undefined {
  return getStore().profiles.find((profile) => profile.id === id);
}

export function findProfileByEmail(email: string): Profile | undefined {
  const normalized = email.trim().toLowerCase();
  return getStore().profiles.find((profile) => profile.email === normalized);
}

export function getClassesByTeacher(teacherId: string): Class[] {
  return getStore()
    .classes.filter((classItem) => classItem.teacher_id === teacherId)
    .sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export function getRecentClassesByTeacher(
  teacherId: string,
  limit: number
): Class[] {
  return getStore()
    .classes.filter((classItem) => classItem.teacher_id === teacherId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
}

export function getClassByIdForTeacher(
  classId: string,
  teacherId: string
): Class | undefined {
  return getStore().classes.find(
    (classItem) => classItem.id === classId && classItem.teacher_id === teacherId
  );
}

export function addInstitution(institution: Institution): void {
  getStore().institutions.push(institution);
}

export function addProfile(profile: Profile): void {
  getStore().profiles.push(profile);
}

export function addClass(classItem: Class): void {
  getStore().classes.push(classItem);
}

export function setProfilePassword(profileId: string, password: string): void {
  getStore().passwords[profileId] = password;
}

export function verifyProfilePassword(
  profileId: string,
  password: string
): boolean {
  return getStore().passwords[profileId] === password;
}

export function countClassesByTeacher(teacherId: string): number {
  return getStore().classes.filter(
    (classItem) => classItem.teacher_id === teacherId
  ).length;
}
