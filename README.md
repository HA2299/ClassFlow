# ClassFlow

מערכת AI לניהול למידה — Next.js 14, shadcn/ui, Supabase.

## הרצה

```bash
npm install
npm run dev
```

## תצורה

הגדר משתני סביבה אמיתיים עבור Supabase ו-AI:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
RESEND_API_KEY=...
```

## תכונות

- Auth לפי role + redirect
- כיתות, תלמידים, משימות (CRUD)
- הגשות + ציון (grading UI)
- דאשבורד מורה (at-risk, משימות פעילות, הגשות)
- אשף AI ליצירת משימות (`/classes/[id]/assignments/new/wizard`)
- עוזר AI לתלמיד (`/student`)
- אנליטיקה + AI Insights
- Resend (אופציונלי, `RESEND_API_KEY`)
- `/parent`, `/admin`

## Supabase

המסד מתנהל דרך Supabase. קוד DB שמור ב-`archive/` — ראה `archive/README.md`.

## Storage

ההגשות נשמרות במסד הנתונים האמיתי ולא במצב דמו.
