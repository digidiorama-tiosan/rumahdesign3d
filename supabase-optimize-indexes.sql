-- =====================================================================
--  DadiOmah — OPTIMASI DATABASE (Index) untuk Skalabilitas
--  Jalankan SEKALI di Supabase → SQL Editor → New query → Run.
--  Aman dijalankan ulang (CREATE INDEX IF NOT EXISTS).
--  Tidak mengubah data — hanya menambah "index" agar query cepat
--  walau user/proyek sudah ribuan.
-- =====================================================================
--  Kenapa perlu: tanpa index, setiap "buka daftar proyek saya" atau
--  "cari user" memaksa Postgres membaca SELURUH tabel (lambat saat besar).
--  Dengan index, Postgres langsung lompat ke baris yang relevan (cepat).
-- =====================================================================

-- 1) PROJECTS — paling penting -------------------------------------
--    Query app: "proyek milik user X, urut terbaru"
--    (listProjects: WHERE user_id = … ORDER BY updated_at DESC)
create index if not exists idx_projects_user_updated
  on public.projects (user_id, updated_at desc);

-- 2) PROFILES — untuk panel Admin ----------------------------------
--    Daftar user diurutkan tanggal daftar
create index if not exists idx_profiles_created
  on public.profiles (created_at desc);

--    Pencarian user berdasarkan email (case-insensitive) di Admin
create index if not exists idx_profiles_email_lower
  on public.profiles (lower(email));

-- 3) REVIEWS — testimoni publik di landing page --------------------
--    Pengunjung hanya melihat yang approved, urut terbaru.
--    Partial index = hanya meng-index baris approved (lebih ramping).
create index if not exists idx_reviews_approved_created
  on public.reviews (created_at desc)
  where approved = true;

--    Admin melihat SEMUA ulasan urut terbaru
create index if not exists idx_reviews_created
  on public.reviews (created_at desc);

-- 4) SUBSCRIPTIONS / RENDER / SCAN ---------------------------------
--    Tabel ini sudah cepat: primary key-nya = user_id (otomatis ter-index).
--    Tidak perlu index tambahan.

-- 5) Perbarui statistik agar Postgres memakai index baru -----------
analyze public.projects;
analyze public.profiles;
analyze public.reviews;

-- =====================================================================
--  SELESAI. Setelah ini, query daftar proyek, daftar user, dan
--  testimoni tetap cepat walau data sudah puluhan ribu baris.
-- =====================================================================
