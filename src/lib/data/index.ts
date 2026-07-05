import { isDemoMode } from "@/lib/config";

/**
 * Data layer entry — routes to demo or Supabase when configured.
 * Currently demo-only; restore Supabase from archive/ when ready.
 */
export function getDataSource(): "demo" | "supabase" {
  return isDemoMode() ? "demo" : "supabase";
}

export { isDemoMode } from "@/lib/config";
