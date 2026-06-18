# 🚀 Panduan Menyambung ke Server (Supabase + GitHub Pages)

Panduan ini untuk **non-programmer**. Ikuti berurutan. Hasil akhir: aplikasi online
gratis, punya **login asli** dan **proyek tersimpan di cloud** (bisa dibuka dari perangkat mana pun).

> Tidak perlu beli domain dan tidak perlu bikin server. Supabase menangani login +
> database, GitHub Pages menyajikan aplikasinya. Semua ada paket gratisnya.

---

## BAGIAN A — Siapkan Supabase (login + database)

### A1. Daftar & buat project
1. Buka **https://supabase.com** → **Start your project** → daftar (boleh pakai akun GitHub).
2. Klik **New Project**.
   - Name: `rumahdesign3d`
   - Database Password: buat password kuat → **simpan baik-baik**.
   - Region: pilih **Southeast Asia (Singapore)**.
3. Tunggu ±2 menit sampai project siap.

### A2. Buat tabel (database)
1. Di menu kiri pilih **SQL Editor** → **New query**.
2. Buka file **`supabase-schema.sql`** (ada di folder ini), salin **semua** isinya.
3. Tempel ke editor → klik **Run**. Harus muncul "Success".

### A3. Ambil kunci API
1. Menu kiri → **Project Settings** (ikon gerigi) → **API**.
2. Salin dua nilai ini:
   - **Project URL** (contoh: `https://abcdxyz.supabase.co`)
   - **anon public** key (teks panjang diawali `eyJ...`)
3. Buka file **`js/supabase-config.js`** di folder aplikasi, isi:
   ```js
   window.SUPABASE_URL = "https://abcdxyz.supabase.co";   // punya Anda
   window.SUPABASE_ANON_KEY = "eyJhbGciOi....";            // punya Anda
   ```
   > Aman: anon key memang untuk dipasang di frontend. Data dilindungi RLS yang
   > sudah dibuat lewat SQL tadi. **Jangan** pakai `service_role` key di sini.

### A4. Atur email login
1. Menu kiri → **Authentication** → **Providers** → pastikan **Email** aktif.
2. Untuk uji coba cepat: **Authentication → Providers → Email →** matikan
   "Confirm email" (agar tidak perlu klik link verifikasi saat tes). Nyalakan lagi nanti.
3. (Opsional) **Login dengan Google:** aktifkan provider **Google**, ikuti petunjuk
   Supabase untuk menempel Client ID/Secret dari Google Cloud Console.

### A5. Izinkan domain Anda
1. Menu kiri → **Authentication** → **URL Configuration**.
2. **Site URL** dan **Redirect URLs**: tambahkan alamat tempat aplikasi di-host,
   mis. `https://USERNAME.github.io/rumah3d/` (lihat Bagian B). Untuk tes lokal
   tambahkan juga `http://localhost`.

✅ Selesai bagian server. **Coba lokal dulu:** jalankan aplikasi (mis. lewat
`npx serve`), buka **Akun.html**, daftar 1 akun, login, lalu di aplikasi klik
**☁ Cloud** → simpan proyek. Kalau berhasil tersimpan & muncul di daftar, server sudah jalan.

---

## BAGIAN B — Online-kan di GitHub Pages (gratis, tanpa domain)

### B1. Buat akun & repository
1. Daftar di **https://github.com** (gratis).
2. Klik **New repository** → Name: `rumah3d` → **Public** → **Create**.

### B2. Unggah file
- **Cara mudah (tanpa terminal):** di halaman repo klik **Add file → Upload files**,
  lalu seret **semua isi folder `rumah3d`** (termasuk folder `js/`) → **Commit changes**.
- Pastikan file `js/supabase-config.js` yang Anda unggah **sudah berisi** URL & key.

### B3. Aktifkan Pages
1. Di repo → **Settings** → **Pages**.
2. **Source: Deploy from a branch** → Branch: **main** → Folder: **/ (root)** → **Save**.
3. Tunggu ±1 menit. Alamat aplikasi muncul di atas, contoh:
   `https://USERNAME.github.io/rumah3d/`
4. Buka alamat itu → aplikasi tampil di `index.html`.

### B4. Sambungkan kembali ke Supabase
- Pastikan alamat GitHub Pages tadi sudah dimasukkan ke **Authentication → URL
  Configuration** (Bagian A5), agar login berfungsi di domain online.

✅ Aplikasi sekarang online, punya login & cloud. Bagikan link `github.io` Anda.

---

## Yang sudah otomatis bekerja
- **Belum isi `supabase-config.js`?** Aplikasi tetap jalan memakai penyimpanan
  browser (seperti sebelumnya). Tidak ada yang rusak.
- **Sudah isi?** Tombol **☁ Cloud** muncul setelah login; proyek tersimpan per-akun
  di database; halaman **Akun.html** memakai login asli.

---

## BAGIAN C — Nanti: Pembayaran asli (ringkas)
Saat siap menarik bayaran:
1. Daftar **Midtrans** atau **Xendit** (siapkan KTP, NPWP, rekening, data usaha).
2. Buat **backend kecil** (mis. Supabase **Edge Functions**) untuk: membuat transaksi
   & menerima **webhook**. Webhook inilah yang menulis tabel `subscriptions`
   (memakai `service_role` key) → paket user aktif secara aman.
3. Di `js/payment-provider.js`, ganti `active: 'demo'` → `'midtrans'`/`'xendit'`
   dan isi `backendBaseUrl`. Frontend sudah disiapkan untuk ini.

> Bagian C butuh sedikit kerja teknis. Kalau sudah sampai sini, beri tahu saya —
> saya buatkan kode Edge Function + langkahnya.

---

## Bantuan cepat
- **Login gagal "Invalid login"** → email belum terdaftar / salah password, atau
  "Confirm email" masih aktif (lihat A4).
- **Tersimpan tapi tak muncul** → cek tabel `projects` di Supabase (menu **Table Editor**).
- **Tombol ☁ Cloud tak muncul** → berarti belum login, atau `supabase-config.js`
  belum diisi. Buka **Akun.html** untuk masuk.
