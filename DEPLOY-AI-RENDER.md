# ✨ Deploy AI Render (aman) — Edge Function + Kuota

Setelah ini: API key OpenAI hanya dipegang **admin** (server), user **tidak** melihatnya.
Kuota render: **Pro 1×/bulan, Dev 3×/bulan** (reset tiap bulan). Habis → beli per render Rp 5.000 (sementara simulasi).

Lakukan **berurutan**. Perkiraan 15 menit.

---

## 1. Jalankan SQL
Supabase (project RumahDesign3D) → **SQL Editor → New query** → tempel seluruh isi
**`supabase-airender-schema.sql`** → **Run**. Harus "Success".
(Pastikan `supabase-schema.sql` & `supabase-admin-schema.sql` sudah dijalankan lebih dulu.)

---

## 2. Deploy Edge Function `ai-render`
Cara termudah lewat **dashboard** (tanpa instal apa pun di komputer):

1. Supabase → menu kiri **Edge Functions**.
2. Klik **Deploy a new function** → **Via Editor** (atau "Create function").
3. **Nama fungsi**: ketik persis **`ai-render`**.
4. Hapus kode contoh, lalu **tempel seluruh isi** file
   **`supabase/functions/ai-render/index.ts`** (ada di folder proyek Anda).
5. Klik **Deploy**.

> Variabel `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sudah tersedia otomatis
> di Edge Function — tidak perlu Anda isi.

### Kalau lebih suka pakai CLI (opsional, untuk yang paham terminal)
```bash
npm i -g supabase
supabase login
supabase link --project-ref <REF-PROJECT-ANDA>
supabase functions deploy ai-render
```

---

## 3. Izinkan domain memanggil fungsi (CORS sudah ditangani di kode)
Tidak ada langkah tambahan — fungsi sudah mengirim header CORS `*`. Cukup pastikan
user **login** saat memakai AI Render (kuota terikat akun).

---

## 4. Admin mengisi API key OpenAI
1. Buka app → login admin → **Akun → ⚙️ Panel Admin** (atau `Admin.html`).
2. Di kartu **"✨ AI Render — API Key OpenAI"**, tempel key dari
   **platform.openai.com → API keys** (diawali `sk-...`) → **Simpan**.
3. Status berubah jadi **"✅ Key sudah diatur"**.

> Akun OpenAI Anda harus punya akses **Images API (gpt-image-1-mini)** dan
> **organisasi terverifikasi**. Biaya render ditagih ke akun OpenAI Anda.
> Disarankan aktifkan **auto-recharge** di billing OpenAI agar saldo tidak
> keburu habis (pelanggan tetap aman: kuota tidak terpotong bila provider gagal).

---

## 5. Tes
1. Login sebagai user **Pro/Dev** (atau set paket lewat Panel Admin).
2. Buka **Preview 3D → AI Render**. Panel kiri menampilkan **sisa kuota**.
3. Klik **Render Fotorealistik**. Setelah sukses, sisa kuota berkurang 1.
4. Habiskan kuota → tombol **"Beli 1 render — Rp 5.000"** muncul → klik
   (simulasi) → kuota bertambah 1 → bisa render lagi.

---

## Catatan
- **User Free** tidak bisa membuka AI Render (terkunci paket, butuh Pro).
- **Kuota reset** otomatis tiap pergantian bulan (berdasarkan UTC).
- **Pembayaran asli**: nanti ganti fungsi `add_render_credit_demo()` dengan
  webhook Midtrans/Xendit yang menambah `credits` SETELAH pembayaran lunas.
  (Hapus akses RPC demo agar tidak bisa diakali.)
- Jika render gagal "Edge Function belum di-deploy" → ulangi langkah 2.

---

## Update model / pesan error (tanpa SQL)
Kalau Anda hanya memperbarui **kode** fungsi (mis. ganti model ke
`gpt-image-1-mini`, ubah ukuran, atau pesan error), **tidak perlu** menjalankan
SQL apa pun — cukup **redeploy** fungsi `ai-render` (langkah 2). Database tidak
berubah. Model saat ini: **gpt-image-1-mini**, ukuran default **1024x1024**,
quality **medium**. Bila kredit OpenAI habis, fungsi membalas pesan ramah dan
kuota pelanggan **tidak** terpotong.

---

## Estimasi Biaya AI (Edge Function `ai-cost`)
Fitur "Estimasi dengan AI" (RAB) memakai edge function terpisah **`ai-cost`**
(OpenAI `gpt-4o-mini`, key admin yang sama). Deploy caranya **sama** seperti
`ai-render` (Edge Functions → nama fungsi `ai-cost` → tempel isi
`supabase/functions/ai-cost/index.ts` → Deploy). **Tanpa SQL tambahan.**
- Wajib login; biaya teks sangat kecil → tanpa kuota.
- Di situs ter-deploy memakai AI; di preview memakai `window.claude`; bila
  keduanya tak ada → otomatis fallback ke perkiraan rumus (tetap tampil).
