-- Synthetic local/demo dataset.
-- Destructive: clears the public tenant data before recreating it.
-- Requires confirmed teacher and student Auth users. Never run against production data.

do $$
begin
  if not exists (
      select 1 from auth.users
      where email = '9455988@gmail.com' and email_confirmed_at is not null
    )
    or not exists (
      select 1 from auth.users
      where email = 'hodaya2299@gmail.com' and email_confirmed_at is not null
    )
  then
    raise exception 'Create both confirmed demo Auth users before running this seed';
  end if;
end $$;

truncate table public.in_app_notifications, public.resource_library, public.ai_insights,
  public.risk_flags, public.grades, public.submissions, public.assignments,
  public.students, public.classes, public.profiles, public.institutions cascade;

do $$
<<seed_block>>
declare
  institution_id uuid;
  teacher_id uuid;
  student_profile_id uuid;
  demo_student_id uuid;
  current_class_id uuid;
  current_assignment_id uuid;
  current_student_id uuid;
  current_submission_id uuid;
  class_index integer;
  assignment_index integer;
  student_index integer;
  total_submissions integer := 0;
  class_names text[] := array[
    'י1 - מתמטיקה מתקדמת',
    'י2 - מדעי המחשב',
    'יא1 - אנגלית וכתיבה',
    'י1 - פיזיקה יישומית',
    'יא2 - חקר ויזמות'
  ];
  first_names text[] := array[
    'אביגיל','איתי','אורית','אדם','אלה','בר','גיא','דניאל','הדר','זיו',
    'טליה','יונתן','יעל','כרים','מאיה','נועם','עומר','עמית','רוני','שירה',
    'תומר','תמר','ליאור','מיה','ניב','רותם','שחר','שני','אורי','הילה',
    'אלון','נועה','איתן','עמליה','רועי'
  ];
  last_names text[] := array[
    'אלון','ארז','בן דוד','ברק','גולן','כהן','דגן','הלוי','וייס','זמיר',
    'חן','טל','יעקבי','לוי','מזרחי','נחום','סגל','עוז','פרץ','קציר',
    'רון','שלו','שמאי','שפירא','שרון','תורגמן','אדרי','אשכנזי','פלד','קדם',
    'שקד','רז','לביא','מור','אביטל'
  ];
begin
  select id into teacher_id
  from auth.users
  where email = '9455988@gmail.com'
  limit 1;

  if teacher_id is null then
    raise exception 'Create 9455988@gmail.com in Supabase Authentication before running this seed';
  end if;

  select id into student_profile_id
  from auth.users
  where email = 'hodaya2299@gmail.com'
  limit 1;

  if student_profile_id is null then
    raise exception 'Create hodaya2299@gmail.com in Supabase Authentication before running this seed';
  end if;

  insert into public.institutions (name)
  values ('תיכון אופק')
  returning id into institution_id;

  insert into public.profiles (id, institution_id, role, full_name, email)
  select
    teacher_id,
    institution_id,
    'teacher'::public.user_role,
    coalesce(raw_user_meta_data->>'full_name', 'מורה דמו'),
    email
  from auth.users
  where id = teacher_id;

  for class_index in 1..array_length(class_names, 1) loop
    current_class_id := gen_random_uuid();

    insert into public.classes (id, institution_id, name, teacher_id)
    values (current_class_id, institution_id, class_names[class_index], teacher_id);

    for student_index in 1..35 loop
      current_student_id := gen_random_uuid();
      insert into public.students (id, class_id, institution_id, name, email, identity_number, status)
      values (
        current_student_id,
        current_class_id,
        institution_id,
        first_names[student_index] || ' ' || last_names[student_index],
        format('student.%s.%s@classflow.demo', class_index, student_index),
        '20' || lpad(((class_index - 1) * 35 + student_index)::text, 8, '0'),
        case
          when student_index in (7, 19) then 'at_risk'::public.student_status
          when student_index = 35 then 'inactive'::public.student_status
          else 'active'::public.student_status
        end
      );

      if class_index = 1 and student_index = 1 then
        demo_student_id := current_student_id;
      end if;
    end loop;

    for assignment_index in 1..12 loop
      current_assignment_id := gen_random_uuid();

      insert into public.assignments (id, class_id, institution_id, name, description, due_date, difficulty, type)
      values (
        current_assignment_id,
        current_class_id,
        institution_id,
        case assignment_index % 4
          when 1 then 'תרגול מסכם'
          when 2 then 'פרויקט חקר'
          when 3 then 'בוחן אמצע יחידה'
          else 'משימת כתיבה ויישום'
        end || ' #' || assignment_index,
        'משימה מעשית הכוללת הסבר, פתרון עצמאי ורפלקציה קצרה על תהליך הלמידה.',
        now() + (assignment_index || ' days')::interval,
        case assignment_index % 3
          when 1 then 'easy'::public.assignment_difficulty
          when 2 then 'medium'::public.assignment_difficulty
          else 'hard'::public.assignment_difficulty
        end,
        case assignment_index % 4
          when 1 then 'homework'::public.assignment_type
          when 2 then 'project'::public.assignment_type
          when 3 then 'quiz'::public.assignment_type
          else 'exam'::public.assignment_type
        end
      );

      for student_index in 1..35 loop
        if (student_index + assignment_index + class_index) % 5 <> 0 then
          select s.id into current_student_id
          from public.students s
          where s.class_id = current_class_id
          order by s.created_at, s.id
          offset student_index - 1
          limit 1;

          current_submission_id := gen_random_uuid();
          total_submissions := total_submissions + 1;

          insert into public.submissions (id, assignment_id, student_id, institution_id, answer, submitted_at, status)
          values (
            current_submission_id,
            current_assignment_id,
            current_student_id,
            institution_id,
            'פתרון מלא עם שלבי עבודה, דוגמה יישומית ומסקנה אישית של התלמיד.',
            now() - (((student_index + assignment_index) % 12) || ' days')::interval,
            case
              when (student_index + assignment_index) % 11 = 0 then 'late'::public.submission_status
              when (student_index + assignment_index + class_index) % 3 <> 0 then 'graded'::public.submission_status
              else 'submitted'::public.submission_status
            end
          );

          if (student_index + assignment_index + class_index) % 3 <> 0 then
            insert into public.grades (submission_id, student_id, assignment_id, institution_id, score, max_score, feedback, graded_by)
            values (
              current_submission_id,
              current_student_id,
              current_assignment_id,
              institution_id,
              greatest(42, 96 - ((student_index * assignment_index + class_index) % 39)),
              100,
              'עבודה מסודרת. כדאי להרחיב את ההסבר בשלב האחרון ולבדוק את התוצאה שוב.',
              teacher_id
            );
          end if;
        end if;
      end loop;
    end loop;

    insert into public.resource_library (institution_id, teacher_id, class_id, title, description, type, tags, url)
    values (
      institution_id,
      teacher_id,
      current_class_id,
      'חומר חזרה לכיתה',
      'סיכום מסודר עם דוגמאות, תרגול וטיפים לקראת המשימות הקרובות.',
      'summary',
      array['חזרה', 'תרגול', class_names[class_index]],
      'https://example.com/classflow/study'
    );

    insert into public.ai_insights (institution_id, class_id, title, summary, insight_type)
    values (
      institution_id,
      current_class_id,
      'מגמת פעילות בכיתה',
      'רוב התלמידים פעילים ומגישים בקצב יציב. מומלץ להמשיך עם משוב קצר ורציף.',
      'class_summary'
    );
  end loop;

  update public.students
  set name = 'Hodaya', email = 'hodaya2299@gmail.com'
  where id = seed_block.demo_student_id;

  insert into public.profiles (id, institution_id, role, full_name, email, identity_number, linked_student_id)
  values (
    seed_block.student_profile_id,
    seed_block.institution_id,
    'student'::public.user_role,
    'Hodaya',
    (select email from auth.users where id = seed_block.student_profile_id),
    (select identity_number from public.students where id = seed_block.demo_student_id),
    seed_block.demo_student_id
  );

  insert into public.risk_flags (student_id, class_id, institution_id, flag_type, severity, description)
  select s.id, s.class_id, seed_block.institution_id, 'low_grades'::public.risk_flag_type, 'medium'::public.risk_severity, 'נדרש מעקב נוסף אחרי ציונים והגשות.'
  from public.students s
  where s.institution_id = seed_block.institution_id
    and s.status = 'at_risk'::public.student_status;

  insert into public.in_app_notifications (institution_id, recipient_id, type, title, message, href)
  values
    (institution_id, teacher_id, 'submission', 'הגשות חדשות התקבלו', total_submissions || ' הגשות זמינות במרכז הבדיקה.', '/review'),
    (institution_id, teacher_id, 'assignment', 'מאגר הנתונים מוכן', 'נוצרו 5 כיתות, 175 תלמידים ו-60 משימות לדמו.', '/classes'),
    (institution_id, teacher_id, 'resource', 'חומרי עזר זמינים', 'נוסף חומר חזרה לכל כיתה.', '/teacher/resources');
end $$;
