/** מצב דמו — ברירת מחדל עד שמוגדר Supabase */
export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_USE_DEMO_DATA === "false") {
    return false;
  }
  if (process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true") {
    return true;
  }
  return !process.env.NEXT_PUBLIC_SUPABASE_URL;
}
