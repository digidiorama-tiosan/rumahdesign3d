-- =====================================================================
-- RumahDesign3D — AI RENDER: kunci OpenAI (admin) + kuota render
-- =====================================================================
-- Jalankan SETELAH supabase-schema.sql & supabase-admin-schema.sql.
-- Supabase → SQL Editor → New query → tempel SEMUA → Run.
-- =====================================================================

-- 1) APP SETTINGS — menyimpan API key OpenAI (HANYA admin) -----------
create table if not exists public.app_settings (
  id          int primary key default 1,
  openai_key  text,
  updated_at  timestamptz default now(),
  constraint app_settings_single check (id = 1)
);
alter table public.app_settings enable row level security;

-- Hanya admin yang boleh baca/tulis. User biasa TIDAK bisa apa-apa.
-- (Edge Function membaca key via service_role yang bypass RLS.)
drop policy if exists "settings_admin_all" on public.app_settings;
create policy "settings_admin_all" on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- 2) RENDER ACCOUNT — kuota render per user --------------------------
create table if not exists public.render_account (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  period      text not null default to_char(now(),'YYYY-MM'),  -- bulan berjalan
  used        int  not null default 0,   -- render GRATIS terpakai bulan ini (reset bulanan)
  credits     int  not null default 0,   -- render BERBAYAR (tidak reset)
  updated_at  timestamptz default now()
);
alter table public.render_account enable row level security;

-- User boleh MEMBACA miliknya (untuk menampilkan sisa kuota). Penulisan
-- jumlah dilakukan Edge Function (service_role). Admin boleh kelola semua.
drop policy if exists "render_select_own" on public.render_account;
create policy "render_select_own" on public.render_account
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "render_admin_all" on public.render_account;
create policy "render_admin_all" on public.render_account
  for all using (public.is_admin()) with check (public.is_admin());

-- 3) RPC SIMULASI PEMBAYARAN — tambah 1 kredit render ----------------
-- ⚠️ SEMENTARA: ini menambah kredit tanpa transaksi nyata. Saat Anda
-- menyambung Midtrans/Xendit, HAPUS hak akses ini dan biarkan WEBHOOK
-- (service_role) yang menambah kredit setelah pembayaran terverifikasi.
create or replace function public.add_render_credit_demo()
returns int language plpgsql security definer as $$
declare new_bal int;
begin
  insert into public.render_account (user_id, credits)
  values (auth.uid(), 1)
  on conflict (user_id)
    do update set credits = render_account.credits + 1, updated_at = now()
  returning credits into new_bal;
  return new_bal;
end; $$;

-- 4) Buat baris render_account saat user mendaftar (opsional) --------
-- handle_new_user sudah ada dari admin-schema; baris dibuat lazily oleh
-- Edge Function saat render pertama, jadi langkah ini tidak wajib.
