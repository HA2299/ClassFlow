# ClassFlow

מערכת AI לניהול למידה — Next.js 14, shadcn/ui, מצב דemo.

## הרצה

```bash
npm install
npm run dev
```

## התחברות דemo

| תפקיד | אימייל | סיסמה |
|--------|--------|--------|
| מורה | `teacher@demo.classflow` | `demo1234` |
| תלמיד | `student@demo.classflow` | `demo1234` |
| הורה | `parent@demo.classflow` | `demo1234` |
| מנהל | `admin@demo.classflow` | `demo1234` |

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

קוד DB שמור ב-`archive/` — ראה `archive/README.md`.

## Data layer

`src/lib/data/` — abstraction לעתיד Supabase (`isDemoMode()`).
