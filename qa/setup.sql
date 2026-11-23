-- Q&A for rusabujjaman.github.io
-- Paste ALL of this into Supabase → SQL Editor → New query → Run.
-- Only this e-mail can answer, hide or delete:
--   rusabujjaman1@gmail.com

create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 60),
  body        text not null check (char_length(body) between 1 and 2000),
  media_path  text check (media_path is null or media_path ~ '^q/[0-9a-f-]{36}\.[a-z0-9]{2,5}$'),
  media_type  text check (media_type in ('image','video')),
  answer      text check (answer is null or char_length(answer) <= 5000),
  answered_at timestamptz,
  hidden      boolean not null default false
);

create or replace function public.is_owner() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'rusabujjaman1@gmail.com'
$$;

alter table public.questions enable row level security;

drop policy if exists "read visible"   on public.questions;
drop policy if exists "anyone can ask" on public.questions;
drop policy if exists "owner updates"  on public.questions;
drop policy if exists "owner deletes"  on public.questions;

create policy "read visible" on public.questions
  for select using (hidden = false or public.is_owner());

create policy "anyone can ask" on public.questions
  for insert to anon, authenticated
  with check (answer is null and answered_at is null and hidden = false);

create policy "owner updates" on public.questions
  for update using (public.is_owner()) with check (public.is_owner());

create policy "owner deletes" on public.questions
  for delete using (public.is_owner());

-- simple flood guard: at most 5 questions per minute for the whole site
create or replace function public.questions_flood_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() and
     (select count(*) from public.questions where created_at > now() - interval '1 minute') >= 5 then
    raise exception 'Too many questions right now. Please try again in a minute.';
  end if;
  if not public.is_owner() then
    new.created_at := now();
  end if;
  return new;
end $$;
drop trigger if exists questions_flood_guard on public.questions;
create trigger questions_flood_guard before insert on public.questions
  for each row execute function public.questions_flood_guard();

-- storage for photos and videos (max 50 MB each)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 52428800,
        array['image/jpeg','image/png','image/webp','image/gif','image/heic',
              'video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = 52428800,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anyone uploads to q" on storage.objects;
drop policy if exists "owner removes uploads" on storage.objects;

create policy "anyone uploads to q" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = 'q');

create policy "owner removes uploads" on storage.objects
  for delete using (bucket_id = 'uploads' and public.is_owner());
