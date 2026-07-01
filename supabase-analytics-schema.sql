-- ============================================================
-- DadiOmah — Analytics Pengunjung (self-hosted)
-- Jalankan sekali di Supabase → SQL Editor → RUN.
-- Setelah ini, tab "Analytics" di halaman Admin akan berisi data.
-- ============================================================

create table if not exists public.page_views (
  id          bigint generated always as identity primary key,
  path        text,
  referrer    text,
  visitor_id  text,
  created_at  timestamptz not null default now()
);

create index if not exists page_views_created_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx    on public.page_views (path);

alter table public.page_views enable row level security;

-- Siapa pun (pengunjung anonim) boleh MENCATAT kunjungan.
drop policy if exists "public insert page_views" on public.page_views;
create policy "public insert page_views"
  on public.page_views for insert
  to anon, authenticated
  with check (true);

-- Hanya ADMIN yang boleh MEMBACA laporan.
drop policy if exists "admin read page_views" on public.page_views;
create policy "admin read page_views"
  on public.page_views for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and coalesce(p.active, true)
    )
  );

-- (opsional) auto-hapus data lebih tua dari 1 tahun bila mau hemat:
-- delete from public.page_views where created_at < now() - interval '365 days';
