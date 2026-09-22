-- Local/demo data only. Run after creating the two Auth users through Supabase.
-- All records below are synthetic and intentionally use the two requested emails.

truncate table public.in_app_notifications, public.resource_library, public.ai_insights,
  public.risk_flags, public.grades, public.submissions, public.assignments,
  public.students, public.classes, public.profiles, public.institutions cascade;

do $$
begin
  if (select count(*) from auth.users where email in ('9455988@gmail.com', 'hodaya2299@gmail.com')) <> 2 then
    raise exception 'Create both demo users in Supabase Authentication before running this seed';
  end if;
end $$;

do $$
declare
  institution_id uuid;
begin
  insert into public.institutions (name)
  values ('תיכון אופק')
  returning id into institution_id;

  insert into public.profiles (id, institution_id, role, full_name, email, identity_number)
  select
    id,
    institution_id,
    'teacher'::public.user_role,
    coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    email,
    raw_user_meta_data->>'identity_number'
  from auth.users
  where email in ('9455988@gmail.com', 'hodaya2299@gmail.com');
end $$;

do $$
declare
  institution_id uuid;
  teacher_one uuid;
  teacher_two uuid;
  class_one uuid := '20000000-0000-0000-0000-000000000001';
  class_two uuid := '20000000-0000-0000-0000-000000000002';
  class_three uuid := '20000000-0000-0000-0000-000000000003';
  class_four uuid := '20000000-0000-0000-0000-000000000004';
  class_five uuid := '20000000-0000-0000-0000-000000000005';
  student_id uuid;
  assignment_id uuid;
  submission_id uuid;
  index_number integer;
  class_id uuid;
  assignment_index integer;
  student_index integer;
  names text[] := array[
    'אביגיל אלון','איתי ארז','אורית בן דוד','אדם ברק','אלה גולן',
    'בר כהן','גיא דגן','דניאל הלוי','הדר וייס','זיו זמיר',
    'טליה חן','יונתן טל','יעל יעקבי','כרים לוי','מאיה מזרחי',
    'נועם נחום','עומר סגל','עמית עוז','רוני פרץ','שירה קציר',
    'תומר רון','תמר שלו','ליאור שמאי','מיה שפירא','ניב שרון',
    'רותם תורגמן','שחר אדרי','שני אשכנזי','אורי פלד','הילה קדם'
  ];
begin
  select id into teacher_one from auth.users where email = '9455988@gmail.com';
  select id into teacher_two from auth.users where email = 'hodaya2299@gmail.com';
  select id into institution_id from public.institutions limit 1;

  insert into public.classes (id, institution_id, name, teacher_id)
  values
    (class_one, institution_id, 'י1 - מתמטיקה מתקדמת', teacher_one),
    (class_two, institution_id, 'י2 - מדעי המחשב', teacher_one),
    (class_three, institution_id, 'יא1 - אנגלית וכתיבה', teacher_two),
    (class_four, institution_id, 'י1 - פיזיקה יישומית', teacher_two),
    (class_five, institution_id, 'יא2 - חקר ויזמות', teacher_one);

  for index_number in 1..15 loop
    class_id := case
      when index_number <= 3 then class_one
      when index_number <= 6 then class_two
      when index_number <= 9 then class_three
      when index_number <= 12 then class_four
      else class_five
    end;
    student_id := ('30000000-0000-0000-0000-' || lpad(index_number::text, 12, '0'))::uuid;
    insert into public.students (id, class_id, institution_id, name, email, identity_number, status)
    values (
      student_id,
      class_id,
      institution_id,
      names[index_number],
      case when index_number % 2 = 0 then '9455988@gmail.com' else 'hodaya2299@gmail.com' end,
      '20' || lpad(index_number::text, 8, '0'),
       case when index_number in (7, 14) then 'at_risk'::public.student_status
         when index_number in (13, 15) then 'inactive'::public.student_status
           else 'active'::public.student_status end
    );
  end loop;

  for assignment_index in 1..9 loop
    class_id := case
      when assignment_index <= 2 then class_one
      when assignment_index <= 4 then class_two
      when assignment_index <= 6 then class_three
      when assignment_index = 7 then class_four
      else class_five
    end;
    assignment_id := ('40000000-0000-0000-0000-' || lpad(assignment_index::text, 12, '0'))::uuid;
    insert into public.assignments (id, class_id, institution_id, name, description, due_date, difficulty, type)
    values (
      assignment_id,
      class_id,
      institution_id,
      case assignment_index % 4
        when 1 then 'תרגול מסכם - פונקציות'
        when 2 then 'פרויקט חקר קבוצתי'
        when 3 then 'בוחן אמצע יחידה'
        else 'משימת כתיבה ויישום' end || ' #' || assignment_index,
      'משימה מעשית הכוללת הסבר, פתרון עצמאי ורפלקציה קצרה על תהליך הלמידה.',
      now() + ((assignment_index - 5) || ' days')::interval,
      case assignment_index % 3 when 1 then 'easy'::public.assignment_difficulty when 2 then 'medium'::public.assignment_difficulty else 'hard'::public.assignment_difficulty end,
      case assignment_index % 4 when 1 then 'homework'::public.assignment_type when 2 then 'project'::public.assignment_type when 3 then 'quiz'::public.assignment_type else 'exam'::public.assignment_type end
    );
  end loop;

  for assignment_index in 1..9 loop
    assignment_id := ('40000000-0000-0000-0000-' || lpad(assignment_index::text, 12, '0'))::uuid;
    for student_index in 1..15 loop
      class_id := case
        when student_index <= 3 then class_one
        when student_index <= 6 then class_two
        when student_index <= 9 then class_three
        when student_index <= 12 then class_four
        else class_five
      end;
      if class_id = (select a.class_id from public.assignments as a where a.id = assignment_id)
        and (student_index - 1) % 3 < 2 then
        student_id := ('30000000-0000-0000-0000-' || lpad(student_index::text, 12, '0'))::uuid;
          submission_id := ('50000000-0000-0000-0000-' || lpad(((assignment_index - 1) * 15 + student_index)::text, 12, '0'))::uuid;
        insert into public.submissions (id, assignment_id, student_id, institution_id, answer, submitted_at, status)
        values (
          submission_id,
          assignment_id,
          student_id,
          institution_id,
          'פתרון מלא עם שלבי עבודה, דוגמה יישומית ומסקנה אישית של התלמיד.',
          case when student_index % 7 = 0 then null else now() - ((student_index % 9) || ' days')::interval end,
          case when student_index % 7 = 0 then 'late'::public.submission_status
               when student_index % 3 = 0 then 'graded'::public.submission_status
               else 'submitted'::public.submission_status end
        );
        if assignment_index % 2 = 0 then
          insert into public.grades (submission_id, student_id, assignment_id, institution_id, score, max_score, feedback, graded_by)
          values (
            submission_id, student_id, assignment_id, institution_id,
            greatest(42, 96 - ((student_index * assignment_index) % 39)),
            100,
            'עבודה מסודרת. כדאי להרחיב את ההסבר בשלב האחרון ולבדוק את התוצאה שוב.',
            case when class_id = class_one then teacher_one else teacher_two end
          );
        end if;
      end if;
    end loop;
  end loop;

  insert into public.risk_flags (student_id, class_id, institution_id, flag_type, severity, description)
  values
    ('30000000-0000-0000-0000-000000000007', class_three, institution_id, 'low_grades', 'high', 'ממוצע ציונים מתחת ל-60 בשתי משימות רצופות'),
    ('30000000-0000-0000-0000-000000000014', class_five, institution_id, 'missing_submissions', 'medium', 'שתי הגשות חסרות במהלך השבוע האחרון'),
    ('30000000-0000-0000-0000-000000000015', class_five, institution_id, 'no_activity', 'high', 'לא נרשמה פעילות במערכת במשך עשרה ימים'),
    ('30000000-0000-0000-0000-000000000010', class_four, institution_id, 'low_grades', 'medium', 'נדרש חיזוק בתרגול העצמאי'),
    ('30000000-0000-0000-0000-000000000004', class_two, institution_id, 'other', 'low', 'נדרש מעקב נוסף לאחר היעדרות');

  insert into public.ai_insights (institution_id, class_id, student_id, title, summary, insight_type)
  values
    (institution_id, class_one, null, 'מגמת שיפור בכיתה', 'רוב התלמידים שיפרו את הדיוק בפתרון משוואות לאחר תרגול מודרך.', 'class_summary'),
    (institution_id, class_three, '30000000-0000-0000-0000-000000000014', 'נדרשת התערבות אישית', 'מומלץ לקבוע פגישת השלמה ולפרק את הפרויקט לשלבי ביניים ברורים.', 'student_analysis'),
    (institution_id, class_three, null, 'המלצה לשיעור הבא', 'תרגול קצר של כתיבה ביקורתית עשוי לחזק את המעבר בין טענה לראיה.', 'recommendation'),
    (institution_id, class_two, '30000000-0000-0000-0000-000000000007', 'סיכון לימודי', 'נראית ירידה עקבית בציונים ובקצב ההגשות; כדאי להפעיל תוכנית תמיכה.', 'risk'),
    (institution_id, class_four, null, 'דפוס למידה חיובי', 'התלמידים מגיבים היטב לתרגול קצר לפני משימה מורכבת.', 'class_summary');

  insert into public.resource_library (institution_id, teacher_id, class_id, title, description, type, tags, url)
  values
    (institution_id, teacher_one, class_one, 'דף נוסחאות - אלגברה', 'סיכום מסודר של נוסחאות, דוגמאות וטיפים לבדיקת תשובה.', 'formula', array['אלגברה','חזרה','י1'], 'https://example.com/classflow/algebra'),
    (institution_id, teacher_one, class_two, 'מצגת מבוא לפייתון', 'שיעור מבוא הכולל משתנים, תנאים, לולאות ותרגילי חימום.', 'presentation', array['Python','תכנות','י2'], 'https://example.com/classflow/python'),
    (institution_id, teacher_two, class_three, 'מחוון כתיבה טיעונית', 'מחוון להערכת טענה, ראיות, מבנה וסגנון כתיבה.', 'summary', array['אנגלית','כתיבה','מחוון'], 'https://example.com/classflow/writing'),
    (institution_id, teacher_two, null, 'קישורים לתרגול עצמאי', 'אוסף קישורים לתרגול קריאה, אוצר מילים והבנת הנקרא.', 'link', array['תרגול','קריאה'], 'https://example.com/classflow/reading'),
    (institution_id, teacher_one, class_five, 'מדריך להצגת מיזם', 'מבנה להצגת בעיה, פתרון, קהל יעד ומדדי הצלחה.', 'notes', array['יזמות','פרזנטציה'], 'https://example.com/classflow/entrepreneurship');

  insert into public.in_app_notifications (institution_id, recipient_id, type, title, message, href)
  values
    (institution_id, teacher_one, 'submission', 'הגשה חדשה התקבלה', 'אביגיל אלון הגישה את משימת פונקציות #1.', '/classes/' || class_one::text),
    (institution_id, teacher_one, 'grade', 'נדרש מעקב אחר תלמיד', 'נוצרה התראת סיכון עבור התלמידה אביגיל אלון.', '/classes/' || class_one::text),
    (institution_id, teacher_two, 'assignment', 'מועד הגשה מתקרב', 'משימת כתיבה ויישום #12 תיסגר בעוד יומיים.', '/assignments'),
    (institution_id, teacher_two, 'resource', 'משאב חדש נוסף', 'מחוון כתיבה טיעונית זמין לתלמידי יא1.', '/teacher/resources'),
    (institution_id, teacher_one, 'submission', 'הגשה ממתינה לבדיקה', 'הגשה חדשה ממתינה לבדיקה בכיתת חקר ויזמות.', '/classes/' || class_five::text);
end $$;
