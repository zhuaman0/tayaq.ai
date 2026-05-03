-- Vocabulary table for Tayaq.ai
-- Run this in: Supabase Dashboard → SQL Editor

create table if not exists public.vocabulary (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  word text not null,
  definition text not null default '',
  example text not null default '',
  translation text not null default '',
  created_at timestamp with time zone default now()
);

alter table public.vocabulary enable row level security;

create policy "Users can view own vocab"
  on public.vocabulary for select
  using (auth.uid() = user_id);

create policy "Users can insert own vocab"
  on public.vocabulary for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own vocab"
  on public.vocabulary for delete
  using (auth.uid() = user_id);
