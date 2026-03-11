-- ============================================
-- WordClass - Supabase Database Schema
-- Supabase SQL Editor에 이 내용을 붙여넣고 실행하세요
-- ============================================

-- 1. Profiles (사용자 정보)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null check (role in ('superadmin', 'teacher', 'student')) default 'student',
  approved boolean not null default false,
  created_at timestamptz default now()
);

-- 학생은 가입 즉시 approved, 교사는 관리자 승인 필요
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, name, role, approved)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', '사용자'),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    case when coalesce(new.raw_user_meta_data->>'role', 'student') = 'student' then true else false end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 2. Classes (클래스)
create table classes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  teacher_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- 3. Class Members (클래스 학생)
create table class_members (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(class_id, student_id)
);

-- 4. Word Sets (단어 세트)
create table word_sets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  created_by uuid references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- 5. Words (단어)
create table words (
  id uuid default gen_random_uuid() primary key,
  word_set_id uuid references word_sets(id) on delete cascade,
  term text not null,
  definition text not null,
  example text,
  order_index integer default 0
);

-- 6. Assignments (과제)
create table assignments (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade,
  word_set_id uuid references word_sets(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  min_score integer check (min_score between 0 and 100),
  max_attempts integer check (max_attempts > 0),
  created_by uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- 7. Study Logs (학습 시간 로그)
create table study_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  word_set_id uuid references word_sets(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete set null,
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds integer,
  mode text check (mode in ('flashcard', 'quiz', 'typing'))
);

-- 8. Word Progress (단어별 학습 현황)
create table word_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  word_id uuid references words(id) on delete cascade,
  word_set_id uuid references word_sets(id) on delete cascade,
  known boolean default false,
  attempts integer default 0,
  last_seen timestamptz default now(),
  unique(user_id, word_id)
);

-- 9. Test Results (시험 결과)
create table test_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete set null,
  word_set_id uuid references word_sets(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  correct integer not null,
  total integer not null,
  passed boolean not null default false,
  answers jsonb,
  created_at timestamptz default now()
);

-- ============================================
-- Row Level Security (RLS) 설정
-- ============================================

alter table profiles enable row level security;
alter table classes enable row level security;
alter table class_members enable row level security;
alter table word_sets enable row level security;
alter table words enable row level security;
alter table assignments enable row level security;
alter table study_logs enable row level security;
alter table word_progress enable row level security;
alter table test_results enable row level security;

-- Profiles: 본인 조회, superadmin 전체 조회
create policy "profiles_select" on profiles for select using (
  auth.uid() = id or
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create policy "profiles_update" on profiles for update using (
  auth.uid() = id or
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create policy "profiles_delete" on profiles for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);

-- Classes: 교사/관리자는 관리, 학생은 소속 클래스만
create policy "classes_select" on classes for select using (
  teacher_id = auth.uid() or
  exists (select 1 from class_members where class_id = classes.id and student_id = auth.uid()) or
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create policy "classes_insert" on classes for insert with check (
  teacher_id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role in ('superadmin', 'teacher'))
);
create policy "classes_update" on classes for update using (teacher_id = auth.uid());
create policy "classes_delete" on classes for delete using (teacher_id = auth.uid());

-- Class Members
create policy "class_members_select" on class_members for select using (
  student_id = auth.uid() or
  exists (select 1 from classes where id = class_members.class_id and teacher_id = auth.uid()) or
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create policy "class_members_insert" on class_members for insert with check (
  exists (select 1 from classes where id = class_members.class_id and teacher_id = auth.uid()) or
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create policy "class_members_delete" on class_members for delete using (
  exists (select 1 from classes where id = class_members.class_id and teacher_id = auth.uid())
);

-- Word Sets
create policy "word_sets_select" on word_sets for select using (
  created_by = auth.uid() or is_public = true or
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin') or
  exists (
    select 1 from assignments a
    join class_members cm on cm.class_id = a.class_id
    where a.word_set_id = word_sets.id and cm.student_id = auth.uid()
  )
);
create policy "word_sets_insert" on word_sets for insert with check (created_by = auth.uid());
create policy "word_sets_update" on word_sets for update using (created_by = auth.uid());
create policy "word_sets_delete" on word_sets for delete using (created_by = auth.uid());

-- Words
create policy "words_select" on words for select using (
  exists (
    select 1 from word_sets ws where ws.id = words.word_set_id and (
      ws.created_by = auth.uid() or ws.is_public = true or
      exists (select 1 from profiles where id = auth.uid() and role = 'superadmin') or
      exists (
        select 1 from assignments a
        join class_members cm on cm.class_id = a.class_id
        where a.word_set_id = ws.id and cm.student_id = auth.uid()
      )
    )
  )
);
create policy "words_insert" on words for insert with check (
  exists (select 1 from word_sets where id = words.word_set_id and created_by = auth.uid())
);
create policy "words_delete" on words for delete using (
  exists (select 1 from word_sets where id = words.word_set_id and created_by = auth.uid())
);

-- Assignments
create policy "assignments_select" on assignments for select using (
  created_by = auth.uid() or
  exists (select 1 from class_members where class_id = assignments.class_id and student_id = auth.uid()) or
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create policy "assignments_insert" on assignments for insert with check (created_by = auth.uid());
create policy "assignments_delete" on assignments for delete using (created_by = auth.uid());

-- Study Logs
create policy "study_logs_select" on study_logs for select using (
  user_id = auth.uid() or
  exists (
    select 1 from assignments a
    join classes c on c.id = a.class_id
    where a.id = study_logs.assignment_id and c.teacher_id = auth.uid()
  ) or
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create policy "study_logs_insert" on study_logs for insert with check (user_id = auth.uid());
create policy "study_logs_update" on study_logs for update using (user_id = auth.uid());

-- Word Progress
create policy "word_progress_select" on word_progress for select using (user_id = auth.uid());
create policy "word_progress_upsert" on word_progress for insert with check (user_id = auth.uid());
create policy "word_progress_update" on word_progress for update using (user_id = auth.uid());

-- Test Results
create policy "test_results_select" on test_results for select using (
  user_id = auth.uid() or
  exists (
    select 1 from assignments a
    join classes c on c.id = a.class_id
    where a.id = test_results.assignment_id and c.teacher_id = auth.uid()
  ) or
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create policy "test_results_insert" on test_results for insert with check (user_id = auth.uid());
