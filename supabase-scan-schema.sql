-- =====================================================================
--  RumahDesign3D — Skema "Scan Foto Denah/Sertifikat" (#4)
--  Jalankan SEKALI di Supabase → SQL Editor → New query → Run.
--  Aman dijalankan ulang (IF NOT EXISTS).
-- =====================================================================

-- Tabel kuota bulanan untuk fitur Scan (per pengguna)
create table if not exists public.scan_account (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  period     text    not null default to_char(now(),'YYYY-MM'),  -- contoh '2026-06'
  used       integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.scan_account enable row level security;

-- Pengguna boleh melihat barisnya sendiri (edge function pakai service-role, bypass RLS)
drop policy if exists "scan_account self read" on public.scan_account;
create policy "scan_account self read"
  on public.scan_account for select
  using (auth.uid() = user_id);

-- Pastikan kolom openai_key ada di app_settings (dipakai bersama AI Render & Scan)
create table if not exists public.app_settings (
  id          integer primary key default 1,
  openai_key  text,
  updated_at  timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- Selesai. Fitur Scan siap dipakai (kuota: free 2×, pro 20×, dev 100× / bulan).
