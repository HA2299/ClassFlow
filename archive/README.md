# ClassFlow — ארכיון Supabase (Phase 1)

קוד ומיגרציות Supabase שמורות כאן לשימוש עתידי. האפליקציה רצה כרגע במצב **דמו** (`src/lib/demo/`).

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
5. עדכן `src/lib/auth/session.ts` ו-`src/app/actions/auth.ts` לקרוא ל-Supabase (או הוסף branching ב-`isDemoMode()`)
6. הגדר `.env.local`:
   ```
   NEXT_PUBLIC_USE_DEMO_DATA=false
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
7. הרץ המיגרציה ב-Supabase SQL Editor
