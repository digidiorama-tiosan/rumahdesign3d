-- =====================================================================
-- RumahDesign3D — TAMBAHAN ADMIN & MANAJEMEN USER
-- =====================================================================
-- Jalankan SETELAH supabase-schema.sql.
-- Buka Supabase → SQL Editor → New query → tempel SEMUA → Run.
-- Aman dijalankan ulang (pakai if not exists / or replace / drop-create).
-- =====================================================================

-- 1) Tabel PROFIL (cermin dari auth.users + peran) -------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,
  phone       text,
  role        text not null default 'user',   -- 'user' | 'admin'
  active      boolean not null default true,   -- admin bisa nonaktifkan
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 2) Helper: apakah pemanggil seorang admin? ------------------------
-- security definer → bisa baca profiles tanpa kena RLS (hindari rekursi).
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

-- 3) RLS untuk profiles ---------------------------------------------
-- User boleh baca profilnya sendiri; admin boleh baca SEMUA.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- User boleh ubah datanya sendiri TAPI tidak boleh menaikkan role/active sendiri.
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admin boleh ubah profil siapa pun (termasuk role & active).
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- Admin boleh hapus profil.
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

-- 4) Saat user mendaftar → buat baris profile + subscription 'free' --
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name, phone)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
          new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Admin boleh MELIHAT & MENGELOLA semua proyek & langganan -------
drop policy if exists "projects_admin_all" on public.projects;
create policy "projects_admin_all" on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

-- Admin boleh menulis langganan siapa pun (mis. upgrade manual ke Pro).
drop policy if exists "subs_admin_all" on public.subscriptions;
create policy "subs_admin_all" on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- 6) Isi profile untuk user yang SUDAH terdaftar sebelum skema ini --
insert into public.profiles (id, email, name)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'name', split_part(u.email,'@',1))
from auth.users u
on conflict (id) do nothing;

-- =====================================================================
-- 7) JADIKAN DIRI ANDA ADMIN  ⚠️ WAJIB & DILAKUKAN SEKALI
-- =====================================================================
-- Daftar dulu 1 akun lewat aplikasi (halaman Akun). Lalu ganti email di
-- bawah dengan email akun Anda, dan jalankan baris ini:
--
--   update public.profiles set role = 'admin' where email = 'email-anda@contoh.com';
--
-- Setelah itu, login ulang di aplikasi → menu Admin akan muncul.
-- =====================================================================
