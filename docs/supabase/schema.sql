-- Full Supabase/PostgreSQL schema for this project (non-community scope)
-- Run in Supabase SQL editor (or via migrations).
--
-- Includes:
-- - profiles (user profile data)
-- - projects (autosave snapshot)
-- - project_snapshots (optional snapshot history)
-- - generation_tasks (image/video generation requests + statuses)
-- - assets (images/videos produced; supports Storage path + external URL)
-- - updated_at trigger utility + indexes + RLS policies

-- Extensions (Supabase typically has these, but keep idempotent)
create extension if not exists pgcrypto;

-- Utility: updated_at trigger function
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================
-- profiles
-- =========================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles for delete
using (auth.uid() = user_id);

-- =========================
-- projects
-- =========================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '未命名项目',
  -- Working snapshot of the canvas/workbench state
  state jsonb not null default '{}'::jsonb,
  -- Mirrors state.version for easier migrations/queries
  state_version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_user_updated_at_idx on public.projects(user_id, updated_at desc);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
on public.projects for select
using (auth.uid() = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
on public.projects for insert
with check (auth.uid() = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
on public.projects for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
on public.projects for delete
using (auth.uid() = user_id);

-- =========================
-- project_snapshots (history)
-- =========================
create table if not exists public.project_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state jsonb not null,
  state_version int not null default 1,
  -- e.g. 'manual', 'before_migration', 'milestone'
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists project_snapshots_project_created_at_idx
on public.project_snapshots(project_id, created_at desc);

alter table public.project_snapshots enable row level security;

drop policy if exists "project_snapshots_select_own" on public.project_snapshots;
create policy "project_snapshots_select_own"
on public.project_snapshots for select
using (auth.uid() = user_id);

drop policy if exists "project_snapshots_insert_own" on public.project_snapshots;
create policy "project_snapshots_insert_own"
on public.project_snapshots for insert
with check (auth.uid() = user_id);

drop policy if exists "project_snapshots_delete_own" on public.project_snapshots;
create policy "project_snapshots_delete_own"
on public.project_snapshots for delete
using (auth.uid() = user_id);

-- =========================
-- generation_tasks
-- =========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'generation_task_kind') then
    create type public.generation_task_kind as enum ('image', 'video');
  end if;
  if not exists (select 1 from pg_type where typname = 'generation_task_status') then
    create type public.generation_task_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');
  end if;
end $$;

create table if not exists public.generation_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.generation_task_kind not null,
  provider text not null, -- e.g. 'seedance'
  provider_task_id text, -- external task id for polling
  status public.generation_task_status not null default 'queued',
  request jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generation_tasks_project_created_at_idx
on public.generation_tasks(project_id, created_at desc);
create index if not exists generation_tasks_user_created_at_idx
on public.generation_tasks(user_id, created_at desc);
create unique index if not exists generation_tasks_provider_task_id_uq
on public.generation_tasks(provider, provider_task_id)
where provider_task_id is not null;

drop trigger if exists trg_generation_tasks_updated_at on public.generation_tasks;
create trigger trg_generation_tasks_updated_at
before update on public.generation_tasks
for each row execute function public.set_updated_at();

alter table public.generation_tasks enable row level security;

drop policy if exists "generation_tasks_select_own" on public.generation_tasks;
create policy "generation_tasks_select_own"
on public.generation_tasks for select
using (auth.uid() = user_id);

drop policy if exists "generation_tasks_insert_own" on public.generation_tasks;
create policy "generation_tasks_insert_own"
on public.generation_tasks for insert
with check (auth.uid() = user_id);

drop policy if exists "generation_tasks_update_own" on public.generation_tasks;
create policy "generation_tasks_update_own"
on public.generation_tasks for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "generation_tasks_delete_own" on public.generation_tasks;
create policy "generation_tasks_delete_own"
on public.generation_tasks for delete
using (auth.uid() = user_id);

-- =========================
-- assets
-- =========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'asset_kind') then
    create type public.asset_kind as enum ('image', 'video');
  end if;
end $$;

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_task_id uuid references public.generation_tasks(id) on delete set null,
  kind public.asset_kind not null,
  -- Supabase Storage location (preferred for durability)
  storage_bucket text,
  storage_path text,
  -- External URL (provider URL or CDN), optional when also stored in Storage
  external_url text,
  mime_type text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint assets_storage_or_external_chk
    check (
      (storage_bucket is not null and storage_path is not null)
      or external_url is not null
    )
);

create index if not exists assets_project_created_at_idx
on public.assets(project_id, created_at desc);
create index if not exists assets_user_created_at_idx
on public.assets(user_id, created_at desc);
create index if not exists assets_generation_task_id_idx
on public.assets(generation_task_id);

alter table public.assets enable row level security;

drop policy if exists "assets_select_own" on public.assets;
create policy "assets_select_own"
on public.assets for select
using (auth.uid() = user_id);

drop policy if exists "assets_insert_own" on public.assets;
create policy "assets_insert_own"
on public.assets for insert
with check (auth.uid() = user_id);

drop policy if exists "assets_update_own" on public.assets;
create policy "assets_update_own"
on public.assets for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "assets_delete_own" on public.assets;
create policy "assets_delete_own"
on public.assets for delete
using (auth.uid() = user_id);

