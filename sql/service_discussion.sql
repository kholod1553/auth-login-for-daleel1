create extension if not exists pgcrypto;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  service_id text not null,
  user_id text not null,
  user_name text,
  content text not null,
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  service_id text not null,
  user_id text not null,
  vote_type text not null check (vote_type in ('up', 'down')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.comments add column if not exists service_id text;
alter table public.comments add column if not exists user_id text;
alter table public.comments add column if not exists user_name text;
alter table public.comments add column if not exists content text;
alter table public.comments add column if not exists rating integer;
alter table public.comments add column if not exists created_at timestamptz default now();

alter table public.votes add column if not exists service_id text;
alter table public.votes add column if not exists user_id text;
alter table public.votes add column if not exists vote_type text;
alter table public.votes add column if not exists created_at timestamptz default now();
alter table public.votes add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'votes_service_user_unique'
      and conrelid = 'public.votes'::regclass
  ) then
    alter table public.votes
      add constraint votes_service_user_unique unique (service_id, user_id);
  end if;
end $$;

create index if not exists comments_service_id_created_at_idx
on public.comments (service_id, created_at desc);

create index if not exists votes_service_id_idx
on public.votes (service_id);

alter table public.comments enable row level security;
alter table public.votes enable row level security;

drop policy if exists "Allow public read comments" on public.comments;
create policy "Allow public read comments"
on public.comments
for select
using (true);

drop policy if exists "Allow authenticated insert own comments" on public.comments;
create policy "Allow authenticated insert own comments"
on public.comments
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "Allow authenticated update own comments" on public.comments;
create policy "Allow authenticated update own comments"
on public.comments
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "Allow authenticated delete own comments" on public.comments;
create policy "Allow authenticated delete own comments"
on public.comments
for delete
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "Allow public read votes" on public.votes;
create policy "Allow public read votes"
on public.votes
for select
using (true);

drop policy if exists "Allow authenticated insert own votes" on public.votes;
create policy "Allow authenticated insert own votes"
on public.votes
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "Allow authenticated update own votes" on public.votes;
create policy "Allow authenticated update own votes"
on public.votes
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "Allow authenticated delete own votes" on public.votes;
create policy "Allow authenticated delete own votes"
on public.votes
for delete
to authenticated
using (user_id = auth.uid()::text);
