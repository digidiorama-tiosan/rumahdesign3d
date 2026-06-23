# 💳 Setup Midtrans (Pembayaran Nyata)

Panduan ini menghubungkan RumahDesign3D ke **Midtrans** — gateway pembayaran terpopuler di Indonesia (QRIS, transfer bank, GoPay, OVO, Dana, kartu kredit).

---

## BAGIAN A — Daftar & Ambil API Key Midtrans

1. Buka **https://dashboard.midtrans.com** → Daftar/Login
2. Pilih mode **Sandbox** dulu untuk testing
3. Menu kiri → **Settings → Access Keys**
4. Catat:
   - **Client Key** (dipakai di browser, aman ditampilkan)
   - **Server Key** (RAHASIA — hanya di server/Edge Function)

---

## BAGIAN B — Deploy Edge Function ke Supabase

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref yxawclwidythmstculql`
4. Buat env var di Supabase Dashboard:
   - Buka **Supabase → Settings → Edge Functions → Secrets**
   - Tambah: `MIDTRANS_SERVER_KEY` = Server Key Midtrans Anda
   - Tambah: `MIDTRANS_ENV` = `sandbox` (atau `production` jika sudah siap)
5. Deploy function:
   ```bash
   supabase functions deploy midtrans-create
   ```

---

## BAGIAN C — Aktifkan Midtrans di App

Buka app → **Akun → Panel Admin** → tambahkan pengaturan berikut ke console browser:

```javascript
// Aktifkan Midtrans (jalankan di console browser)
localStorage.setItem('rumah3d_payment_mode', 'midtrans');
localStorage.setItem('rumah3d_midtrans_client_key', 'SB-Mid-client-XXXX'); // ganti dengan Client Key Anda
localStorage.setItem('rumah3d_midtrans_env', 'sandbox'); // 'sandbox' atau 'production'
```

---

## BAGIAN D — Test Pembayaran

1. Di Midtrans Sandbox, gunakan kartu test:
   - **Kartu**: 4811 1111 1111 1114 | exp: 01/25 | CVV: 123
   - **QRIS**: Scan QR di popup Snap
2. Coba upgrade paket di app → pilih Pro → klik bayar
3. Setelah berhasil, status paket berubah otomatis

---

## BAGIAN E — Go Live (Produksi)

1. Di Midtrans Dashboard → klik **Activate Production**
2. Isi data bisnis (KTP/NPWP)
3. Ganti env var `MIDTRANS_ENV` ke `production`
4. Ganti Client Key & Server Key dengan key produksi
5. Update localStorage:
   ```javascript
   localStorage.setItem('rumah3d_midtrans_client_key', 'Mid-client-PROD-XXXX');
   localStorage.setItem('rumah3d_midtrans_env', 'production');
   ```

---

## Catatan Penting

- **Server Key TIDAK boleh** ada di client/browser — sudah aman di Edge Function
- Midtrans otomatis kirim webhook saat pembayaran sukses — untuk aktifkan paket otomatis perlu Edge Function tambahan (`midtrans-webhook`)
- Untuk sementara, aktifkan paket manual via Panel Admin setelah konfirmasi pembayaran
