-- ==============================================================================
-- BOOK NOTES APP: SUPABASE DATABASE & STORAGE SCHEMA (MULTI-USER + RLS)
-- Run this in your Supabase project SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Books Table
create table if not exists public.books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null default 'Untitled Book',
  cover_color text not null default '#6366f1',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Folders (Chapters) Table
create table if not exists public.folders (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid references public.books(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null default 'New Chapter',
  order_index int not null default 0,
  created_at timestamptz default now()
);

-- 4. Pages (Notes) Table
create table if not exists public.pages (
  id uuid primary key default uuid_generate_v4(),
  folder_id uuid references public.folders(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null default 'Untitled Page',
  content_json jsonb default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  tags text[] default array[]::text[],
  starred boolean default false,
  color text default null,
  order_index int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Enable Row Level Security (RLS) on all tables
alter table public.books enable row level security;
alter table public.folders enable row level security;
alter table public.pages enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can manage their own books" on public.books;
drop policy if exists "Users can manage their own folders" on public.folders;
drop policy if exists "Users can manage their own pages" on public.pages;

-- Row Level Security Policies: Strict User Isolation
create policy "Users can manage their own books" on public.books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own folders" on public.folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own pages" on public.pages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6. Storage Bucket for Page Images
insert into storage.buckets (id, name, public) 
values ('page-images', 'page-images', true)
on conflict (id) do update set public = true;

-- Drop existing storage policies if any
drop policy if exists "Users can upload their own images" on storage.objects;
drop policy if exists "Images are publicly viewable" on storage.objects;
drop policy if exists "Users can delete their own images" on storage.objects;

-- Storage Policies
create policy "Users can upload their own images" on storage.objects 
  for insert with check (bucket_id = 'page-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Images are publicly viewable" on storage.objects 
  for select using (bucket_id = 'page-images');

create policy "Users can delete their own images" on storage.objects 
  for delete using (bucket_id = 'page-images' and auth.uid()::text = (storage.foldername(name))[1]);
