# 🔵 Aktifkan Login dengan Google

Kode di app sudah siap. Tinggal **2 setup kredensial** ini (sekali saja, ±15 menit).
Lakukan **berurutan**.

---

## BAGIAN A — Google Cloud (buat OAuth Client)

1. Buka **https://console.cloud.google.com** → login dengan akun Google Anda.
2. Di atas, buat project baru: klik dropdown project → **New Project** → nama
   **RumahDesign3D** → **Create**. Pilih project itu.
3. Menu kiri → **APIs & Services → OAuth consent screen**.
   - User Type: **External** → **Create**.
   - App name: **RumahDesign3D**, email support: email Anda, developer email: email Anda.
   - **Save and Continue** sampai selesai (scopes & test users boleh dilewati).
   - Di **Publishing status**, klik **Publish App** → **Confirm** (agar semua orang
     bisa login, bukan cuma test user).
4. Menu kiri → **APIs & Services → Credentials**.
   - **+ Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: **RumahDesign3D Web**.
   - **Authorized redirect URIs → + Add URI**, tempel **PERSIS** ini:
     ```
     https://yxawclwidythmstculql.supabase.co/auth/v1/callback
     ```
   - **Create**.
5. Muncul **Client ID** dan **Client Secret** — **salin keduanya** (jangan ditutup dulu).

---

## BAGIAN B — Supabase (aktifkan provider Google)

1. Buka **Supabase → project RumahDesign3D**.
2. Menu kiri → **Authentication → Sign In / Providers** (atau **Providers**).
3. Cari **Google** → klik → aktifkan **Enable Sign in with Google**.
4. Tempel:
   - **Client ID (for OAuth)** → dari Bagian A langkah 5.
   - **Client Secret (for OAuth)** → dari Bagian A langkah 5.
5. **Save**.

### Pastikan URL Configuration benar (sekali saja)
**Authentication → URL Configuration**:
- **Site URL**: `https://digidiorama-tiosan.github.io/<NAMA-REPO>/`
- **Redirect URLs**: tambahkan `https://digidiorama-tiosan.github.io/<NAMA-REPO>/**`

> Ganti `<NAMA-REPO>` dengan nama repo RumahDesign3D Anda. URL ini WAJIB cocok,
> kalau tidak, setelah login Google akan error "redirect tidak diizinkan".

---

## BAGIAN C — Tes

1. Upload file terbaru ke GitHub (lihat daftar di chat), tunggu 1 menit.
2. Buka app → **Akun** → klik **Lanjut dengan Google**.
3. Pilih akun Google → setujui → otomatis kembali & masuk dashboard.
4. User Google baru muncul juga di **Panel Admin** (default paket Free) — Anda
   bisa ubah perannya/paketnya dari sana.

---

## Catatan
- Login Google & email/password **bisa berdampingan** — user bebas pilih.
- Akun Google pertama kali login = **Free**. Jadikan Pro/Dev/Admin lewat Panel Admin.
- Di **APK**, login Google membuka tab browser untuk memilih akun lalu kembali ke app
  — ini normal & aman.
- Kalau muncul error **"redirect_uri_mismatch"** → redirect URI di Bagian A langkah 4
  tidak sama persis. Pastikan tepat `https://yxawclwidythmstculql.supabase.co/auth/v1/callback`.
