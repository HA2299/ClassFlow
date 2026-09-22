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

לאחר הגדרת `NEXT_PUBLIC_SUPABASE_URL` ו-`NEXT_PUBLIC_SUPABASE_ANON_KEY`, יש להחיל את כל המיגרציות על אותו פרויקט:

```bash
npx supabase login
npx supabase link --project-ref YOUR_REF
npx supabase db push
```

### טעינת נתוני דוגמה

הקובץ `supabase/seed.sql` אינו מופעל בזמן `npm run build` או `supabase db push`.
משתמשי Auth חייבים להיווצר דרך Supabase Dashboard, ולא בכתיבה ישירה ל־`auth.users`.

כדי לתקן את משתמשי הדמו ולטעון מחדש את כל נתוני הדוגמה בפרויקט המרוחק:

1. ב־**Authentication > Users**, מחקו את משתמשי הדמו הישנים אם הם קיימים.
2. בחרו **Add user > Create new user** וצרו את `9455988@gmail.com` עם הסיסמה `ClassFlow123!`; סמנו אימות אימייל.
3. צרו באותה דרך את `hodaya2299@gmail.com` עם אותה סיסמה.
4. פתחו **SQL Editor**, העתיקו את כל התוכן של `supabase/seed.sql` והריצו אותו פעם אחת.
5. התנתקו מהאפליקציה, פתחו חלון גלישה בסתר והתחברו מחדש.

אם ה־SQL Editor מציג את ההודעה `Create both demo users in Supabase Authentication before running this seed`, חזרו על שלבים 1-3.

אם מחיקה דרך **Authentication > Users** נכשלת עם `Database error loading user`, הריצו ב־SQL Editor את השחזור הבא. הוא מוחק רק את שני משתמשי הדמו, וה־FK מנקה את הפרופילים המקושרים:

```sql
begin;

delete from public.grades
where graded_by in (
	select id from auth.users
	where email in ('9455988@gmail.com', 'hodaya2299@gmail.com')
);

delete from auth.users
where email in ('9455988@gmail.com', 'hodaya2299@gmail.com');

commit;
```

בדקו שהמחיקה הצליחה:

```sql
select email
from auth.users
where email in ('9455988@gmail.com', 'hodaya2299@gmail.com');
```

אם מוחזרות אפס שורות, צרו מחדש את שני המשתמשים דרך **Authentication > Users > Add user**, עם הסיסמה `ClassFlow123!` ו־**Auto Confirm User**, ואז הריצו את `supabase/seed.sql`.

### הסרת המורה `9455988@gmail.com`

כדי למחוק את המורה ואת הכיתות, המשימות, התלמידים, ההגשות, הציונים, הסיכונים, המשאבים וההתראות שבבעלותו בלבד, הריצו את כל הקובץ `supabase/remove-teacher-9455988.sql` ב־SQL Editor. הקובץ אינו מוחק תלמידים שמשתמשים באותו אימייל בשדה הנתונים שלהם אם הם אינם בכיתות של המורה.

להרצה מקומית, לאחר התקנת Supabase CLI והרצת `supabase start`:

```bash
npx supabase db reset
```

אם מתקבלת השגיאה `Could not find the table 'public.resource_library' in the schema cache`, יש להריץ את `supabase/migrations/20240619000000_resource_library.sql` ב-Supabase SQL Editor, ולאחר מכן לרענן את הסכמה עם `NOTIFY pgrst, 'reload schema';`.

## Storage

ההגשות נשמרות במסד הנתונים האמיתי ולא במצב דמו.
