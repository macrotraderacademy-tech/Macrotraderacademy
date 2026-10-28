-- Macrotrader Academy — schema
create extension if not exists "pgcrypto";

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  full_name     text not null,
  role          text not null check (role in ('STUDENT', 'TEACHER')),
  created_at    timestamptz not null default now()
);

create table if not exists courses (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references users(id) on delete cascade,
  title       text not null,
  summary     text not null default '',
  description text not null default '',
  level       text not null default 'Débutant',
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists courses_teacher_idx on courses (teacher_id);

create table if not exists lessons (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses(id) on delete cascade,
  title      text not null,
  content    text not null default '',
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists lessons_course_idx on lessons (course_id, position);

create table if not exists enrollments (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (course_id, user_id)
);

create table if not exists lesson_completions (
  lesson_id    uuid not null references lessons(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (lesson_id, user_id)
);
