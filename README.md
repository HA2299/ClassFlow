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
OPENROUTER_API_KEY=...
NEXT_PUBLIC_SITE_URL=...
BREVO_API_KEY=...
BREVO_FROM_EMAIL=...
BREVO_FROM_NAME=ClassFlow
```

## תכונות

- Auth לפי role + redirect
- כיתות, תלמידים, משימות (CRUD)
- הגשות + ציון (grading UI)
- דאשבורד מורה (at-risk, משימות פעילות, הגשות)
- אשף AI ליצירת משימות (`/classes/[id]/assignments/new/wizard`)
- עוזר AI לתלמיד (`/student`)
- אנליטיקה + AI Insights
- Brevo לשליחת דוא״ל (אופציונלי, `BREVO_API_KEY` ו-`BREVO_FROM_EMAIL`)
- `/admin`

## Supabase

המסד מתנהל דרך Supabase. קוד DB שמור ב-`archive/` — ראה `archive/README.md`.

לאחר הגדרת `NEXT_PUBLIC_SUPABASE_URL` ו-`NEXT_PUBLIC_SUPABASE_ANON_KEY`, יש להחיל את כל המיגרציות על אותו פרויקט:

```bash
npx supabase login
npx supabase link --project-ref YOUR_REF
npx supabase db push
```

המיגרציה `20261011230000_remove_parent_accounts.sql` מסירה חשבונות ופרופילים קיימים בתפקיד הורה, ומונעת יצירת תפקיד כזה במסד הנתונים. יש להחיל אותה על פרויקט Supabase באמצעות `npx supabase db push`.

### משתמשי הדמו ונתוני הדוגמה

התחברות מתבצעת דרך כתובת האתר החיה וחשבונות שאומתו ב-Supabase Auth. חשבונות הדמו בנתוני הפרויקט:

| תפקיד | אימייל | סיסמה | מסך ראשי |
|---|---|---|---|
| מורה | `9455988@gmail.com` | `ClassFlow123!` | `/dashboard` |
| תלמידה (Hodaya) | `hodaya2299@gmail.com` | `ClassFlow123!` | `/student` |

החשבונות והנתונים סינתטיים ומיועדים להצגה בלבד.

הקובץ `supabase/seed.sql` אינו מופעל בזמן `npm run build` או `supabase db push`. הוא דורש חשבונות מאומתים למורה ולתלמיד, ו**מוחק את הנתונים בטבלאות הציבוריות ומייצר מחדש** חמש כיתות, 175 תלמידים, 60 משימות, הגשות, ציונים, חומרי לימוד, תובנות, סימוני סיכון והתראות. אין להריץ אותו על סביבת ייצור או על מסד שמכיל נתונים שצריך לשמור.

ליצירת נתוני הדמו מחדש, ודאו שב-Supabase **Authentication > Users** קיימים שני החשבונות שלמעלה ומסומנים כמאומתים. לאחר מכן הריצו את תוכן `supabase/seed.sql` ב-SQL Editor של פרויקט הדמו. אם יצרתם חשבון מחדש, השתמשו בסיסמה שמופיעה בטבלה או עדכנו אותה גם ב-Supabase Auth.

### הסרת המורה `9455988@gmail.com`

להסרת חשבון המורה ונתוני הכיתות שבבעלותו בלבד, הריצו את כל הקובץ `supabase/remove-teacher-9455988.sql` ב־SQL Editor. הקובץ אינו מוחק תלמידים שמשתמשים באותו אימייל בשדה הנתונים שלהם אם הם אינם בכיתות של המורה. אל תריצו אותו על נתוני דמו שבהם `9455988@gmail.com` משמש כמורה, אלא אם זו אכן מטרתכם.

להרצה מקומית, לאחר התקנת Supabase CLI והרצת `supabase start`:

```bash
npx supabase db reset
```

אם מתקבלת השגיאה `Could not find the table 'public.resource_library' in the schema cache`, יש להריץ את `supabase/migrations/20240619000000_resource_library.sql` ב-Supabase SQL Editor, ולאחר מכן לרענן את הסכמה עם `NOTIFY pgrst, 'reload schema';`.

## Storage

ההגשות נשמרות במסד הנתונים האמיתי ולא במצב דמו.
