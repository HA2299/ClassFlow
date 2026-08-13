# ClassFlow — ארכיון Supabase (Phase 1)

קוד ומיגרציות Supabase שמורות כאן לשימוש עתידי. המערכת פועלת מול Supabase אמיתי.

## מה נמצא כאן

| נתיב | תיאור |
|------|--------|
| `supabase/migrations/` | סכמה + RLS |
| `lib/supabase/` | client, server, middleware |
| `app/auth/callback/route.ts` | OAuth callback |

## שחזור Supabase

1. העתק `supabase/` לשורש הפרויקט
2. העתק `lib/supabase/` ל-`src/lib/supabase/`
3. העתק `app/auth/callback/` ל-`src/app/auth/callback/`
4. עדכן `src/middleware.ts` לשימוש ב-`@/lib/supabase/middleware`
5. עדכן `src/lib/auth/session.ts` ו-`src/app/actions/auth.ts` לקרוא ל-Supabase
6. הגדר `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
7. הרץ את המיגרציות ב-SQL Editor (לפי סדר):
   - `20240614000000_initial_schema.sql`
   - `20240615000000_phase2_entities.sql`
