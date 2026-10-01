-- CSG Lipa City Colleges — Supabase schema
-- Run this whole file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'CSG Administrator',
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  body text not null,
  image_url text,
  attachment_url text,
  attachment_name text,
  published_at timestamptz not null default now(),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  poster_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  organizer text,
  registration_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_interest (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  browser_token text not null,
  created_at timestamptz not null default now(),
  unique(event_id, browser_token)
);

create table if not exists public.event_reviews (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  display_name text not null default 'Anonymous Student',
  rating int not null check (rating between 1 and 5),
  comment text,
  browser_token text not null,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.officers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text not null,
  course_year text,
  photo_url text,
  bio text,
  sort_order int not null default 0,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'Student Resource',
  file_url text,
  file_name text,
  link_url text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null,
  description text,
  icon text default 'info',
  sort_order int not null default 0,
  is_published boolean not null default true
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.event_interest enable row level security;
alter table public.event_reviews enable row level security;
alter table public.officers enable row level security;
alter table public.resources enable row level security;
alter table public.contacts enable row level security;

-- Public read policies
create policy "public can read published announcements"
on public.announcements for select to anon, authenticated
using (is_published = true or public.is_admin());

create policy "admins manage announcements"
on public.announcements for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "public can read published events"
on public.events for select to anon, authenticated
using (is_published = true or public.is_admin());

create policy "admins manage events"
on public.events for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "public can read current officers"
on public.officers for select to anon, authenticated
using (is_current = true or public.is_admin());

create policy "admins manage officers"
on public.officers for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "public can read published resources"
on public.resources for select to anon, authenticated
using (is_published = true or public.is_admin());

create policy "admins manage resources"
on public.resources for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "public can read published contacts"
on public.contacts for select to anon, authenticated
using (is_published = true or public.is_admin());

create policy "admins manage contacts"
on public.contacts for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "public can read visible reviews"
on public.event_reviews for select to anon, authenticated
using (is_visible = true or public.is_admin());

create policy "public can submit reviews"
on public.event_reviews for insert to anon, authenticated
with check (is_visible = true and length(display_name) between 2 and 60);

create policy "admins manage reviews"
on public.event_reviews for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "public can read interest counts"
on public.event_interest for select to anon, authenticated
using (true);

create policy "public can add interest"
on public.event_interest for insert to anon, authenticated
with check (length(browser_token) between 20 and 200);

create policy "admins manage interest"
on public.event_interest for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Admin user table: an admin can see the admin list, but the public cannot.
create policy "admins read admin users"
on public.admin_users for select to authenticated
using (public.is_admin());

create policy "admins manage admin users"
on public.admin_users for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Storage buckets
insert into storage.buckets (id, name, public)
values
  ('csg-images', 'csg-images', true),
  ('csg-files', 'csg-files', true)
on conflict (id) do update set public = excluded.public;

create policy "public can view csg images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'csg-images');

create policy "admins upload csg images"
on storage.objects for insert to authenticated
with check (bucket_id = 'csg-images' and public.is_admin());

create policy "admins update csg images"
on storage.objects for update to authenticated
using (bucket_id = 'csg-images' and public.is_admin())
with check (bucket_id = 'csg-images' and public.is_admin());

create policy "admins delete csg images"
on storage.objects for delete to authenticated
using (bucket_id = 'csg-images' and public.is_admin());

create policy "public can view csg files"
on storage.objects for select to anon, authenticated
using (bucket_id = 'csg-files');

create policy "admins upload csg files"
on storage.objects for insert to authenticated
with check (bucket_id = 'csg-files' and public.is_admin());

create policy "admins update csg files"
on storage.objects for update to authenticated
using (bucket_id = 'csg-files' and public.is_admin())
with check (bucket_id = 'csg-files' and public.is_admin());

create policy "admins delete csg files"
on storage.objects for delete to authenticated
using (bucket_id = 'csg-files' and public.is_admin());

-- Useful indexes
create index if not exists announcements_published_idx on public.announcements(published_at desc);
create index if not exists events_starts_idx on public.events(starts_at);
create index if not exists reviews_event_idx on public.event_reviews(event_id);
create index if not exists officers_sort_idx on public.officers(sort_order);
create index if not exists resources_sort_idx on public.resources(sort_order);

-- Updated-at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists announcements_updated_at on public.announcements;
create trigger announcements_updated_at before update on public.announcements
for each row execute function public.set_updated_at();

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists officers_updated_at on public.officers;
create trigger officers_updated_at before update on public.officers
for each row execute function public.set_updated_at();


create table if not exists public.student_feedback (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default (
    'CSG-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  ),
  category text not null check (category in ('Report','Sumbong','Suggestion','Question','Compliment','Other')),
  subject text not null,
  message text not null,
  name text,
  contact text,
  attachment_url text,
  attachment_name text,
  status text not null default 'New' check (status in ('New','In Review','Resolved','Closed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_feedback enable row level security;

create policy "students can submit feedback"
on public.student_feedback for insert to anon, authenticated
with check (
  length(subject) between 3 and 160
  and length(message) between 5 and 5000
  and category in ('Report','Sumbong','Suggestion','Question','Compliment','Other')
);

create policy "admins read feedback"
on public.student_feedback for select to authenticated
using (public.is_admin());

create policy "admins update feedback"
on public.student_feedback for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins delete feedback"
on public.student_feedback for delete to authenticated
using (public.is_admin());

drop trigger if exists student_feedback_updated_at on public.student_feedback;
create trigger student_feedback_updated_at before update on public.student_feedback
for each row execute function public.set_updated_at();

create index if not exists student_feedback_created_idx on public.student_feedback(created_at desc);
create index if not exists student_feedback_status_idx on public.student_feedback(status);
