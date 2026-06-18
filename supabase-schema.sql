-- =====================================================================
-- RumahDesign3D — Skema Database Supabase
-- =====================================================================
-- Cara pakai: buka Supabase → menu "SQL Editor" → "New query" →
-- tempel SELURUH isi file ini → klik "Run".
-- =====================================================================

-- 1) Tabel PROYEK ----------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'Tanpa nama',
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

alter table public.projects enable row level security;

-- Setiap user hanya bisa melihat & mengubah proyek miliknya sendiri
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);


-- 2) Tabel LANGGANAN -------------------------------------------------
create table if not exists public.subscriptions (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  plan        text not null default 'free',     -- 'free' | 'pro' | 'dev'
  cycle       text default 'month',             -- 'month' | 'year'
  status      text default 'active',
  expires_at  timestamptz,
  updated_at  timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- User boleh MEMBACA langganannya sendiri.
create policy "subs_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- CATATAN PENTING soal pembayaran:
-- Jangan biarkan user MENULIS langganannya sendiri (nanti bisa dipalsukan jadi Pro gratis).
-- Saat Anda menyambung Midtrans/Xendit, biarkan WEBHOOK dari backend yang menulis tabel ini
-- memakai service_role key (bypass RLS). Untuk fase login+proyek (tanpa bayar), tabel ini
-- cukup dibaca saja; semua user otomatis dianggap 'free'.


-- 3) (Opsional) Otomatis buat baris langganan 'free' saat user mendaftar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.subscriptions (user_id, plan) values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
