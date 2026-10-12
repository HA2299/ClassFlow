"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile, requireTeacher } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getClassById, getClassesByInstitution, getClassesByTeacher, getStudentForProfile } from "@/lib/data/store";
import { syncCalendarEventToGoogle } from "@/lib/google-calendar";
import type { CalendarEvent, Class, Profile } from "@/types/database";

export type CalendarEventRecord = CalendarEvent & {
  class_ids: string[];
  class_names: string[];
};

const calendarTypeOptions = [
  "exam",
  "quiz",
  "makeup_exam",
  "project",
  "submission_deadline",
  "special_lesson",
  "class_activity",
  "school_event",
  "other",
] as const;

function toIso(value: FormDataEntryValue | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function buildCalendarEventId(): string {
  return crypto.randomUUID();
}

export async function getCalendarClassesForProfile(profile: Profile): Promise<Class[]> {
  if (profile.role === "student") {
    const student = await getStudentForProfile(profile);
    if (!student) return [];
    const classItem = await getClassById(student.class_id);
    return classItem ? [classItem] : [];
  }

  if (profile.role === "teacher") {
    return getClassesByTeacher(profile.id);
  }

  return getClassesByInstitution(profile.institution_id);
}

export async function getCalendarEventsForProfile(profile: Profile): Promise<CalendarEventRecord[]> {
  const supabase = createClient();

  let query = supabase
    .from("calendar_events")
    .select("*")
    .eq("institution_id", profile.institution_id)
    .order("start_at", { ascending: true });

  if (profile.role === "student") {
    const student = await getStudentForProfile(profile);
    if (!student) return [];
    const { data: links, error: linksError } = await supabase
      .from("calendar_event_class_links")
      .select("event_id")
      .eq("class_id", student.class_id);

    if (linksError || !links) return [];
    const ids = links.map((link) => link.event_id);
    if (ids.length === 0) return [];

    query = supabase
      .from("calendar_events")
      .select("*")
      .in("id", ids)
      .eq("status", "published")
      .order("start_at", { ascending: true });
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const eventIds = data.map((event) => event.id);
  const { data: linkRows, error: linkError } = eventIds.length
    ? await supabase.from("calendar_event_class_links").select("event_id, class_id").in("event_id", eventIds)
    : { data: [], error: null };

  if (linkError) {
    console.error("Failed to load calendar event class links", linkError);
  }

  const classIdsByEvent = new Map<string, string[]>();
  const classNamesByEvent = new Map<string, string[]>();

  if (linkRows) {
    for (const link of linkRows) {
      const current = classIdsByEvent.get(link.event_id) ?? [];
      current.push(link.class_id);
      classIdsByEvent.set(link.event_id, current);

      const classItem = await getClassById(link.class_id);
      if (classItem) {
        const currentNames = classNamesByEvent.get(link.event_id) ?? [];
        currentNames.push(classItem.name);
        classNamesByEvent.set(link.event_id, currentNames);
      }
    }
  }

  return data.map((event) => ({
    ...event,
    class_ids: classIdsByEvent.get(event.id) ?? [],
    class_names: classNamesByEvent.get(event.id) ?? [],
  }));
}

export async function getCalendarEventById(eventId: string, profile?: Profile | null): Promise<CalendarEventRecord | null> {
  const supabase = createClient();
  const activeProfile = profile ?? (await getSessionProfile());
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !data) return null;
  if (activeProfile && activeProfile.role === "student" && data.status !== "published") return null;
  if (activeProfile && activeProfile.institution_id !== data.institution_id) return null;

  const { data: links, error: linkError } = await supabase
    .from("calendar_event_class_links")
    .select("class_id")
    .eq("event_id", eventId);

  if (linkError) {
    return null;
  }

  const classIds = (links ?? []).map((link) => link.class_id);
  const classNames = (await Promise.all(classIds.map(async (classId) => {
    const classItem = await getClassById(classId);
    return classItem ? classItem.name : null;
  }))).filter((value): value is string => Boolean(value));

  return {
    ...data,
    class_ids: classIds,
    class_names: classNames,
  };
}

export async function createCalendarEvent(formData: FormData): Promise<void> {
  const profile = await requireTeacher();
  const title = toIso(formData.get("title"));
  const eventType = formData.get("event_type");
  const startAt = toIso(formData.get("start_at"));
  const endAt = toIso(formData.get("end_at"));
  const classIds = formData.getAll("class_ids");

  if (!title || !startAt || !classIds.length) {
    throw new Error("כותרת, תאריך התחלה וכיתה אחת לפחות נדרשים");
  }

  if (eventType && typeof eventType !== "string") {
    throw new Error("סוג האירוע אינו תקין");
  }

  const typedEventType: CalendarEvent["event_type"] =
    (eventType && typeof eventType === "string" && calendarTypeOptions.includes(eventType as (typeof calendarTypeOptions)[number]))
      ? (eventType as (typeof calendarTypeOptions)[number])
      : "exam";
  const parsedStart = new Date(startAt);
  if (Number.isNaN(parsedStart.getTime())) {
    throw new Error("תאריך התחלה אינו תקין");
  }

  const parsedEnd = endAt ? new Date(endAt) : null;
  if (parsedEnd && Number.isNaN(parsedEnd.getTime())) {
    throw new Error("שעת הסיום אינה תקינה");
  }
  if (parsedEnd && parsedEnd.getTime() < parsedStart.getTime()) {
    throw new Error("שעת ההתחלה חייבת להיות לפני סיום האירוע");
  }

  const eventId = buildCalendarEventId();
  const now = new Date().toISOString();
  const allDay = formData.get("all_day") === "true";
  const notifyStudents = formData.get("notify_students") === "true";
  const notifyTeacher = formData.get("notify_teacher") !== "false";
  const status: CalendarEvent["status"] = formData.get("status") === "draft" ? "draft" : "published";
  const publishedAt = status === "published" ? now : null;

  const syncStatus: CalendarEvent["sync_status"] = "disabled";

  const eventPayload = {
    id: eventId,
    institution_id: profile.institution_id,
    created_by: profile.id,
    title,
    description: toIso(formData.get("description")),
    event_type: typedEventType,
    subject: toIso(formData.get("subject")),
    location: toIso(formData.get("location")),
    start_at: parsedStart.toISOString(),
    end_at: parsedEnd ? parsedEnd.toISOString() : null,
    all_day: allDay,
    status,
    published_at: publishedAt,
    created_at: now,
    updated_at: now,
    linked_assignment_id: toIso(formData.get("linked_assignment_id")),
    reminder_at: toIso(formData.get("reminder_at")),
    notify_students: notifyStudents,
    notify_teacher: notifyTeacher,
    material: toIso(formData.get("material")),
    topics: typeof formData.get("topics") === "string" && formData.get("topics") ? formData.get("topics")?.toString().split(",").map((item) => item.trim()).filter(Boolean) : null,
    duration_minutes: formData.get("duration_minutes") ? Number(formData.get("duration_minutes")) || null : null,
    max_score: formData.get("max_score") ? Number(formData.get("max_score")) || null : null,
    preparation_links: typeof formData.get("preparation_links") === "string" && formData.get("preparation_links") ? formData.get("preparation_links")?.toString().split(",").map((item) => item.trim()).filter(Boolean) : null,
    special_notes: toIso(formData.get("special_notes")),
    external_provider: null,
    external_calendar_id: null,
    external_event_id: null,
    sync_status: syncStatus,
    last_synced_at: null,
  };

  const supabase = createClient();
  const { data: savedEvent, error } = await supabase.from("calendar_events").insert(eventPayload).select().single();
  if (error) {
    console.error("Calendar insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      payload: { ...eventPayload, institution_id: profile.institution_id, created_by: profile.id },
    });
    throw new Error(
      error.message || `לא ניתן לשמור את האירוע${error.code ? ` (${error.code})` : ""}`
    );
  }

  const classLinks = Array.from(new Set(classIds.map((value) => String(value)).filter(Boolean))).map((classId) => ({
    id: crypto.randomUUID(),
    event_id: eventId,
    class_id: classId,
    created_at: now,
  }));

  if (classLinks.length > 0) {
    const { error: linksError } = await supabase.from("calendar_event_class_links").insert(classLinks);
    if (linksError) {
      throw new Error(linksError.message || "לא ניתן לקשר את האירוע לכיתות");
    }
  }

  const syncResult = await syncCalendarEventToGoogle({
    ...savedEvent,
    class_names: Array.from(new Set(classLinks.map((link) => link.class_id))).map((classId) => classId),
  });

  if (syncResult.status === "error") {
    console.warn("Google Calendar sync failed:", syncResult.error);
  }

  revalidatePath("/calendar");
  redirect("/calendar");
}

export async function updateCalendarEvent(eventId: string, formData: FormData): Promise<void> {
  const profile = await requireTeacher();
  const supabase = createClient();
  const existing = await getCalendarEventById(eventId, profile);
  if (!existing) {
    throw new Error("אירוע לא נמצא");
  }

  const title = toIso(formData.get("title"));
  const startAt = toIso(formData.get("start_at"));
  const classIds = formData.getAll("class_ids");

  if (!title || !startAt || !classIds.length) {
    throw new Error("כותרת, תאריך התחלה וכיתה אחת לפחות נדרשים");
  }

  const endAt = toIso(formData.get("end_at"));
  const parsedStart = new Date(startAt);
  const parsedEnd = endAt ? new Date(endAt) : null;
  if (Number.isNaN(parsedStart.getTime()) || (parsedEnd && Number.isNaN(parsedEnd.getTime()))) {
    throw new Error("תאריך האירוע אינו תקין");
  }
  if (parsedEnd && parsedEnd.getTime() < parsedStart.getTime()) {
    throw new Error("שעת ההתחלה חייבת להיות לפני סיום האירוע");
  }

  const now = new Date().toISOString();
  const status: CalendarEvent["status"] = formData.get("status") === "draft" ? "draft" : "published";
  const rawEventType = formData.get("event_type");
  const eventTypeValue: CalendarEvent["event_type"] =
    typeof rawEventType === "string" && calendarTypeOptions.includes(rawEventType as (typeof calendarTypeOptions)[number])
      ? (rawEventType as (typeof calendarTypeOptions)[number])
      : existing.event_type;

  const { data: updatedEvent, error } = await supabase.from("calendar_events").update({
    title,
    description: toIso(formData.get("description")),
    event_type: eventTypeValue,
    subject: toIso(formData.get("subject")),
    location: toIso(formData.get("location")),
    start_at: parsedStart.toISOString(),
    end_at: parsedEnd ? parsedEnd.toISOString() : null,
    all_day: formData.get("all_day") === "true",
    status,
    published_at: status === "published" && !existing.published_at ? now : existing.published_at,
    updated_at: now,
    linked_assignment_id: toIso(formData.get("linked_assignment_id")),
    reminder_at: toIso(formData.get("reminder_at")),
    notify_students: formData.get("notify_students") === "true",
    notify_teacher: formData.get("notify_teacher") !== "false",
    material: toIso(formData.get("material")),
    topics: typeof formData.get("topics") === "string" && formData.get("topics") ? formData.get("topics")?.toString().split(",").map((item) => item.trim()).filter(Boolean) : null,
    duration_minutes: formData.get("duration_minutes") ? Number(formData.get("duration_minutes")) || null : null,
    max_score: formData.get("max_score") ? Number(formData.get("max_score")) || null : null,
    preparation_links: typeof formData.get("preparation_links") === "string" && formData.get("preparation_links") ? formData.get("preparation_links")?.toString().split(",").map((item) => item.trim()).filter(Boolean) : null,
    special_notes: toIso(formData.get("special_notes")),
  }).eq("id", eventId).eq("institution_id", profile.institution_id).select().single();

  if (error) {
    throw new Error(error.message || "לא ניתן לעדכן את האירוע");
  }

  await supabase.from("calendar_event_class_links").delete().eq("event_id", eventId);
  const inserts = Array.from(new Set(classIds.map((value) => String(value)).filter(Boolean))).map((classId) => ({
    id: crypto.randomUUID(),
    event_id: eventId,
    class_id: classId,
    created_at: now,
  }));
  if (inserts.length > 0) {
    const { error: linkError } = await supabase.from("calendar_event_class_links").insert(inserts);
    if (linkError) {
      throw new Error(linkError.message || "לא ניתן לעדכן את חיבורי הכיתות");
    }
  }

  const syncResult = await syncCalendarEventToGoogle({
    ...updatedEvent,
    class_names: Array.from(new Set(inserts.map((link) => link.class_id))).map((classId) => classId),
  });

  if (syncResult.status === "error") {
    console.warn("Google Calendar sync failed:", syncResult.error);
  }

  revalidatePath("/calendar");
  revalidatePath(`/calendar/${eventId}`);
  redirect(`/calendar/${eventId}`);
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const profile = await requireTeacher();
  const supabase = createClient();

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("institution_id", profile.institution_id);

  if (error) {
    throw new Error(error.message || "לא ניתן למחוק את האירוע");
  }

  revalidatePath("/calendar");
  redirect("/calendar");
}

export async function getUpcomingCalendarEventsForDashboard(profile: Profile, limit = 5): Promise<CalendarEventRecord[]> {
  const allEvents = await getCalendarEventsForProfile(profile);
  return allEvents.filter((event) => new Date(event.start_at).getTime() >= Date.now()).slice(0, limit);
}
