"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { runRiskDetection } from "@/app/actions/dashboard";

export async function runRiskDetectionAction() {
  const admin = await requireAdmin();
  await runRiskDetection(admin.id);
  revalidatePath("/admin");
}
