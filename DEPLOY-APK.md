# 📱 Deploy ke Web + Jadikan APK (Android)

Panduan lengkap untuk **non-programmer**. Hasil akhir:
1. Aplikasi bisa dibuka di browser mana pun lewat sebuah link (HTTPS).
2. Bisa **dipasang** di HP (PWA) tanpa Play Store.
3. Bisa dijadikan **file APK** untuk dibagikan / diunggah ke Play Store.

Urutannya **wajib berurutan**: APK dibuat dari versi web. Jadi deploy dulu, baru APK.

---

## BAGIAN A — Online di GitHub Pages (±10 menit)

1. Buka **github.com** → tombol **New** → buat repository baru, mis. `rumahdesign3d`. Set **Public**. Klik **Create**.
2. Di halaman repo, klik **Add file → Upload files**.
3. Seret **SEMUA isi folder `rumah3d`** ke sana — pastikan ikut:
   - `index.html`, `Floor Planner 2.0.html`, `Akun.html`
   - folder `js/`, folder `icons/`
   - `styles.css`, `manifest.webmanifest`, `sw.js`
   - `.well-known/assetlinks.json` (untuk APK nanti — boleh diisi belakangan)
   > Penting: `index.html` harus berada di **root** repo (bukan di dalam subfolder), supaya link utama langsung membuka app.
4. Klik **Commit changes**.
5. Masuk **Settings → Pages**. Di **Source** pilih **Deploy from a branch** → Branch **main** → folder **/ (root)** → **Save**.
6. Tunggu ±1 menit, refresh. Muncul link seperti:
   **`https://NAMA-ANDA.github.io/rumahdesign3d/`**
7. Buka link itu di browser — app harus muncul. 🎉

### Sambungkan ke Supabase
Di dashboard Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://NAMA-ANDA.github.io/rumahdesign3d/`
- **Redirect URLs**: tambahkan baris yang sama.

Lalu di app (halaman **Akun** → **Aktifkan Cloud**), tempel **Project URL** + **anon key** Anda. Login & simpan cloud langsung jalan.

---

## BAGIAN B — Pasang di HP sebagai App (PWA, gratis, tanpa Play Store)

1. Buka link GitHub Pages di **Chrome Android**.
2. Akan muncul tombol **⬇ Pasang App** (atau lewat menu ⋮ → **Install app / Add to Home screen**).
3. Ikon RumahDesign3D muncul di layar HP, terbuka layar penuh seperti aplikasi biasa.

> iPhone/iPad: buka di **Safari** → tombol Bagikan (⬆) → **Tambah ke Layar Utama**.

Untuk banyak kebutuhan, **PWA ini sudah cukup** — tidak perlu APK. Lanjut ke Bagian C hanya kalau Anda butuh file APK atau mau masuk Play Store.

---

## BAGIAN C — Jadikan APK dengan PWABuilder (±15 menit)

1. Buka **https://www.pwabuilder.com**.
2. Tempel link GitHub Pages Anda → **Start**. Ia akan memeriksa PWA (manifest, service worker, ikon — semuanya sudah disiapkan, skor harus hijau).
3. Klik **Package For Stores → Android**.
4. Pilih **Generate Package**. Isi:
   - **Package ID**: mis. `com.namaanda.rumahdesign3d` (huruf kecil, unik, jangan diubah-ubah nanti).
   - **App name**: RumahDesign3D.
   - Biarkan sisanya default.
5. **Download**. Anda dapat file ZIP berisi:
   - `app-release-signed.apk` → **ini APK** untuk dipasang/dibagikan langsung.
   - `app-release-bundle.aab` → untuk **diunggah ke Google Play**.
   - `signing.keystore` + `signing-key-info.txt` → **SIMPAN BAIK-BAIK & RAHASIA**. Tanpa ini Anda tidak bisa update app di Play Store nanti.

### Pasang APK langsung di HP
- Kirim `app-release-signed.apk` ke HP → buka → izinkan **"Install dari sumber tak dikenal"** → Install.

### (Opsional) Hilangkan bar alamat browser di app — Digital Asset Links
Agar APK terbuka full-screen tanpa address bar:
1. Di hasil PWABuilder ada nilai **SHA-256 fingerprint** (di `assetlinks.json` / `signing-key-info.txt`).
2. Buka file `.well-known/assetlinks.json` di repo, ganti `PASTE_SHA256_FINGERPRINT_DI_SINI` dan `com.example.rumahdesign3d` dengan milik Anda.
3. Commit. Tunggu 1–2 menit. Buka ulang app dari ikon — address bar hilang.

### (Opsional) Unggah ke Google Play
- Perlu **akun Google Play Developer** (bayar $25 sekali seumur hidup).
- Play Console → Create app → unggah file **.aab** → isi deskripsi, ikon, screenshot → submit untuk review.

---

## Saat ada perubahan / update
1. Edit file di komputer → upload ulang ke repo (atau edit langsung di GitHub).
2. Buka `sw.js`, naikkan **`CACHE_VERSION`** (mis. `rd3d-v1` → `rd3d-v2`) supaya HP user ambil versi baru.
3. Untuk APK: cukup ulangi Bagian C **hanya jika** Anda mengubah ikon/nama/ID. Perubahan isi app otomatis ikut karena APK memuat dari web Anda (selama Package ID & keystore sama).

---

## Catatan jujur
- **Service worker & "Pasang App" hanya jalan di HTTPS** (GitHub Pages sudah HTTPS) — tidak jalan saat membuka file `.html` langsung dari penyimpanan HP. Jadi untuk pengalaman app sebenarnya, selalu pakai **link GitHub Pages**.
- Library 3D/PDF dimuat dari internet (CDN), jadi pemakaian pertama butuh koneksi; setelah itu sebagian tersimpan untuk offline.
