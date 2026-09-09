"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ResourceType } from "@/types/database";
import { getStudentsByClass } from "@/lib/data/store";
import { notifyStudentsAboutResource } from "@/app/actions/notifications";

const RESOURCE_BUCKET = "classflow-resources";
const MAX_RESOURCE_FILE_SIZE = 20 * 1024 * 1024;

export type ResourceItem = {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  tags: string[];
  url?: string | null;
  fileName?: string | null;
  filePath?: string | null;
  uploadedBy: string;
  createdAt: string;
  teacherId?: string;
  classId?: string | null;
};

function normalizeType(value: unknown): ResourceType {
  const type = String(value ?? "summary").trim();
  if (type === "presentation" || type === "formula" || type === "link" || type === "notes") {
    return type;
  }
  return "summary";
}

function mapResourceRow(row: Record<string, unknown>): ResourceItem {
  const tags = row.tags;
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    type: normalizeType(row.type),
    tags: Array.isArray(tags) ? tags.map((tag) => String(tag)) : [],
    url: typeof row.url === "string" && row.url.trim() ? row.url : undefined,
    fileName: typeof row.file_name === "string" ? row.file_name : null,
    filePath: typeof row.file_path === "string" ? row.file_path : null,
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

    if (error) {
      console.error("Failed to load teacher resources from Supabase", error);
      return [];
    }

    return (data ?? []).map(mapResourceRow);
  } catch (error) {
    console.error("Exception while loading teacher resources", error);
    return [];
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

    if (error) {
      console.error("Failed to load student resources from Supabase", error);
      return [];
    }

    return (data ?? []).map(mapResourceRow);
  } catch (error) {
    console.error("Exception while loading student resources", error);
    return [];
  }
}

export async function addResourceAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string; url?: string | null; fileName?: string | null; filePath?: string | null }> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "נדרשת התחברות" };

  const classId = String(formData.get("classId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = normalizeType(formData.get("type"));
  const tagsRaw = String(formData.get("tags") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const fileEntry = formData.get("file");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;

  if (!title || !description) {
    return { error: "יש למלא כותרת ותיאור" };
  }

  if (file && file.size > MAX_RESOURCE_FILE_SIZE) {
    return { error: "גודל הקובץ המרבי הוא 20MB" };
  }

  const supabase = createClient();

  try {
    const resourceId = crypto.randomUUID();
    let resourceUrl = url || null;
    let uploadedPath: string | null = null;

    if (file) {
      const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "bin";
      uploadedPath = `${profile.institution_id}/${profile.id}/${resourceId}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(RESOURCE_BUCKET)
        .upload(uploadedPath, file, { contentType: file.type || "application/octet-stream", upsert: false });

      if (uploadError) {
        return { error: uploadError.message || "לא ניתן להעלות את הקובץ" };
      }

      resourceUrl = supabase.storage.from(RESOURCE_BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
    }

    const payload = {
      id: resourceId,
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
      url: resourceUrl,
      file_name: file?.name ?? null,
      file_path: uploadedPath,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("resource_library").insert(payload);
    if (error) {
      if (uploadedPath) {
        await supabase.storage.from(RESOURCE_BUCKET).remove([uploadedPath]);
      }
      return { error: error.message || "לא ניתן להעלות חומר" };
    }

    if (classId) {
      const students = await getStudentsByClass(classId);
      await notifyStudentsAboutResource({
        institutionId: profile.institution_id,
        studentIds: students.map((student) => student.id),
        resourceTitle: title,
      });
    }

    revalidatePath("/teacher/resources");
    revalidatePath("/student/resources");
    return { url: resourceUrl, fileName: file?.name ?? null, filePath: uploadedPath };
  } catch {
    return { error: "לא ניתן להעלות חומר" };
  }
}

export async function deleteResourceAction(id: string): Promise<boolean> {
  const profile = await getSessionProfile();
  if (!profile) return false;

  const supabase = createClient();

  try {
    const { data: resource } = await supabase
      .from("resource_library")
      .select("url, file_path")
      .eq("id", id)
      .eq("teacher_id", profile.id)
      .maybeSingle();
    const { error } = await supabase
      .from("resource_library")
      .delete()
      .eq("id", id)
      .eq("teacher_id", profile.id);

    if (error) {
      return false;
    }

    if (resource?.file_path) {
      await supabase.storage.from(RESOURCE_BUCKET).remove([resource.file_path]);
    } else if (resource?.url?.includes(`/storage/v1/object/public/${RESOURCE_BUCKET}/`)) {
      const filePath = resource.url.split(`/storage/v1/object/public/${RESOURCE_BUCKET}/`)[1];
      if (filePath) await supabase.storage.from(RESOURCE_BUCKET).remove([filePath]);
    }

    revalidatePath("/teacher/resources");
    revalidatePath("/student/resources");
    return true;
  } catch {
    return false;
  }
}
