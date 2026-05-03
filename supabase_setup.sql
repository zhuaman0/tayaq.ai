-- ============================================
-- Tayaq.ai — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  total_xp integer default 0,
  total_roasts integer default 0,
  streak_days integer default 1,
  last_login_at date default current_date,
  created_at timestamp with time zone default now()
);

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;

-- 3. RLS Policies
-- Everyone can READ all profiles (for leaderboard)
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can INSERT their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can UPDATE their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 4. Auto-create profile on user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
