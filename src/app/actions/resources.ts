"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ResourceType } from "@/types/database";

export type ResourceItem = {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  tags: string[];
  url?: string | null;
  uploadedBy: string;
  createdAt: string;
  teacherId?: string;
  classId?: string | null;
};

const fallbackResources: ResourceItem[] = [
  {
    id: "fallback-summary",
    title: "סיכום פרק 1",
    description: "מושגי יסוד, דוגמאות ותרגילים מהירים",
    type: "summary",
    tags: ["מתמטיקה", "סיכום"],
    uploadedBy: "מורה",
    createdAt: new Date().toISOString(),
    classId: null,
  },
  {
    id: "fallback-link",
    title: "קישור תרגול",
    description: "משאבי תרגול נוספים למבחן",
    type: "link",
    tags: ["תרגול", "קישורים"],
    url: "https://example.com",
    uploadedBy: "מורה",
    createdAt: new Date().toISOString(),
    classId: null,
  },
];

function normalizeType(value: FormDataEntryValue | null | undefined): ResourceType {
  const type = String(value ?? "summary").trim();
  if (type === "presentation" || type === "formula" || type === "link" || type === "notes") {
    return type;
  }
  return "summary";
}

function mapResourceRow(row: Record<string, any>): ResourceItem {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    type: normalizeType(row.type),
    tags: Array.isArray(row.tags) ? row.tags.map((tag: unknown) => String(tag)) : [],
    url: typeof row.url === "string" && row.url.trim() ? row.url : undefined,
    uploadedBy: typeof row.uploaded_by === "string" ? row.uploaded_by : "מורה",
    createdAt: String(row.created_at ?? new Date().toISOString()),
    teacherId: typeof row.teacher_id === "string" ? row.teacher_id : undefined,
    classId: typeof row.class_id === "string" ? row.class_id : null,
  };
}

export async function getTeacherResources(teacherId: string): Promise<ResourceItem[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("resource_library")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return fallbackResources;
    }

    return data.map(mapResourceRow);
  } catch {
    return fallbackResources;
  }
}

export async function getStudentResources(classId: string): Promise<ResourceItem[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("resource_library")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return fallbackResources;
    }

    return data.map(mapResourceRow);
  } catch {
    return fallbackResources;
  }
}

export async function addResourceAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "נדרשת התחברות" };

  const classId = String(formData.get("classId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = normalizeType(formData.get("type"));
  const tagsRaw = String(formData.get("tags") ?? "");
  const url = String(formData.get("url") ?? "").trim();

  if (!title || !description) {
    return { error: "יש למלא כותרת ותיאור" };
  }

  const supabase = createClient();

  try {
    const payload = {
      id: crypto.randomUUID(),
      institution_id: profile.institution_id,
      teacher_id: profile.id,
      class_id: classId || null,
      title,
      description,
      type,
      tags: tagsRaw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      url: url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("resource_library").insert(payload);
    if (error) {
      return { error: error.message || "לא ניתן להעלות חומר" };
    }

    revalidatePath("/teacher/resources");
    revalidatePath("/student/resources");
    return {};
  } catch {
    return { error: "לא ניתן להעלות חומר" };
  }
}

export async function deleteResourceAction(id: string): Promise<boolean> {
  const profile = await getSessionProfile();
  if (!profile) return false;

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("resource_library")
      .delete()
      .eq("id", id)
      .eq("teacher_id", profile.id);

    if (error) {
      return false;
    }

    revalidatePath("/teacher/resources");
    revalidatePath("/student/resources");
    return true;
  } catch {
    return false;
  }
}
