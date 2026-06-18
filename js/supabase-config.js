// =====================================================================
// KONFIGURASI SUPABASE  — SATU-SATUNYA FILE YANG PERLU ANDA EDIT
// =====================================================================
// Cara mengisi (panduan lengkap ada di SETUP-SERVER.md):
//   1. Daftar gratis di https://supabase.com  → New Project
//   2. Buka Project Settings → API
//   3. Salin "Project URL" dan "anon public" key, tempel di bawah.
//
// AMAN: "anon public key" memang BOLEH ada di frontend. Data tetap
// terlindungi oleh Row Level Security (RLS) yang kita pasang di database.
// JANGAN pernah menempel "service_role" key di sini.
// =====================================================================

window.SUPABASE_URL = "";        // contoh: "https://abcdxyz.supabase.co"
window.SUPABASE_ANON_KEY = "";   // contoh: "eyJhbGciOi...."

// ---------------------------------------------------------------------
// AKTIVASI TANPA EDIT FILE (opsional):
// Anda boleh mengaktifkan cloud langsung dari aplikasi tanpa menyentuh file ini.
// Buka halaman "Akun" → kartu "Aktifkan Cloud", tempel Project URL + anon key.
// Nilai itu disimpan di localStorage browser ini dan dibaca di bawah —
// menimpa nilai kosong di atas. (Saat go-live publik, lebih baik tetap isi
// nilai di atas agar berlaku untuk semua pengunjung.)
// ---------------------------------------------------------------------
try {
  var _cfg = JSON.parse(localStorage.getItem('rumah3d_supabase_cfg') || 'null');
  if (_cfg && _cfg.url && _cfg.key) {
    window.SUPABASE_URL = _cfg.url.trim();
    window.SUPABASE_ANON_KEY = _cfg.key.trim();
  }
} catch (e) {}

// Aktif otomatis hanya jika kedua nilai di atas terisi.
window.SUPABASE_ENABLED = !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY);
