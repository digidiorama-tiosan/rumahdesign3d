-- =====================================================================
--  DadiOmah — Tabel Ulasan / Testimoni Pengguna
--  Jalankan SEKALI di Supabase → SQL Editor → New query → Run.
--  Aman dijalankan ulang (IF NOT EXISTS).
-- =====================================================================

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text,                       -- mis. "Pemilik rumah", "Kontraktor"
  rating      int  not null check (rating between 1 and 5),
  message     text not null,
  approved    boolean not null default false,  -- admin moderasi sebelum tampil publik
  created_at  timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- 1) Siapa saja boleh MENGIRIM ulasan (insert), tapi tidak bisa langsung tampil
drop policy if exists "reviews insert anon" on public.reviews;
create policy "reviews insert anon"
  on public.reviews for insert
  to anon, authenticated
  with check (
    char_length(name) between 1 and 60
    and char_length(message) between 3 and 600
    and rating between 1 and 5
    and approved = false          -- tidak bisa menyetujui ulasannya sendiri
  );

-- 2) Publik hanya bisa MELIHAT ulasan yang sudah disetujui admin
drop policy if exists "reviews read approved" on public.reviews;
create policy "reviews read approved"
  on public.reviews for select
  to anon, authenticated
  using (approved = true);

-- 3) ADMIN boleh melihat SEMUA ulasan (termasuk yang belum disetujui),
--    menyetujui/menolak (update), dan menghapus.
drop policy if exists "reviews admin all" on public.reviews;
create policy "reviews admin all"
  on public.reviews for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
--  MODERASI (untuk Anda sebagai admin):
--  Lihat semua ulasan masuk  → Table Editor → reviews
--  Setujui agar tampil publik → ubah kolom approved jadi TRUE lalu Save
--  (Atau jalankan: update public.reviews set approved=true where id='...';)
-- =====================================================================
