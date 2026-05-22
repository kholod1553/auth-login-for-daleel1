create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  sender text not null check (sender in ('user', 'bot')),
  content text not null,
  provider text,
  matched_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_session_created_at
  on public.chat_messages (session_id, created_at desc);

create index if not exists idx_chat_messages_created_at
  on public.chat_messages (created_at);

alter table public.chat_messages disable row level security;
