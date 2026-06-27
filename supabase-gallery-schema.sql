-- =====================================================================
--  DadiOmah — GALERI DESAIN (opt-in share)
--  Jalankan SEKALI di Supabase → SQL Editor → New query → Run.
--  Aman dijalankan ulang (IF NOT EXISTS / drop-create policy).
-- =====================================================================
--  Konsep: user HANYA masuk galeri kalau menekan "Bagikan ke Galeri".
--  Yang disimpan = data denah (JSON kecil), BUKAN gambar → hemat kuota.
--  Thumbnail digambar ulang di browser dari JSON ini.
--  Admin memoderasi (approved) sebelum tampil publik.
-- =====================================================================

create table if not exists public.gallery_designs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  title         text not null,
  author_name   text,
  building_type text default 'rumah',           -- rumah/toko/masjid/ruko
  land_w        numeric,                          -- info lebar tanah (m)
  land_h        numeric,                          -- info panjang tanah (m)
  data          jsonb not null default '{}'::jsonb,  -- geometri (floors+siteplan)
  approved      boolean not null default false,   -- moderasi admin
  likes         int not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.gallery_designs enable row level security;

-- 1) User login boleh MENGIRIM desain ke galeri (belum tampil sebelum di-approve)
drop policy if exists "gallery insert" on public.gallery_designs;
create policy "gallery insert"
  on public.gallery_designs for insert
  to authenticated
  with check (
    char_length(title) between 1 and 80
    and approved = false        -- tidak bisa menyetujui sendiri
  );

-- 2) Publik hanya melihat yang sudah DISETUJUI admin
drop policy if exists "gallery read approved" on public.gallery_designs;
create policy "gallery read approved"
  on public.gallery_designs for select
  to anon, authenticated
  using (approved = true);

-- 3) ADMIN: lihat semua, setujui/tolak, hapus
drop policy if exists "gallery admin all" on public.gallery_designs;
create policy "gallery admin all"
  on public.gallery_designs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4) RPC tambah-like aman (siapa saja boleh menambah like +1) ---------
create or replace function public.gallery_like(design_id uuid)
returns int language plpgsql security definer as $$
declare new_likes int;
begin
  update public.gallery_designs
    set likes = likes + 1
    where id = design_id and approved = true
    returning likes into new_likes;
  return coalesce(new_likes, 0);
end; $$;

-- 5) Index untuk galeri publik (yang approved, urut terbaru) ----------
create index if not exists idx_gallery_approved_created
  on public.gallery_designs (created_at desc)
  where approved = true;

analyze public.gallery_designs;

-- =====================================================================
--  MODERASI: Table Editor → gallery_designs → ubah approved = true
--  atau lewat panel Admin (💎 Galeri Desain).
-- =====================================================================
