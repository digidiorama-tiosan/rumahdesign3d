// =====================================================================
// PAYMENT PROVIDER ADAPTER
// =====================================================================
// Satu-satunya tempat yang menyentuh "cara bayar". Untuk go-live, cukup
// ganti PaymentProvider.active dari 'demo' ke 'midtrans' / 'xendit', dan
// implementasikan createTransaction() agar memanggil BACKEND Anda.
//
// PENTING (keamanan): JANGAN pernah menaruh Server Key / Secret Key gateway
// di file frontend ini. Frontend hanya memanggil backend Anda; backend yang
// menyimpan key rahasia dan memanggil Midtrans/Xendit.
//
// Kontrak yang dipakai checkout.js:
//   await PaymentProvider.pay(order) -> { status:'paid'|'pending'|'failed', orderId, raw? }
//   order = { plan, cycle, amount, method, customer:{name,email,phone} }
// =====================================================================

const PaymentProvider = {
  // ganti ke 'midtrans' atau 'xendit' saat sudah punya backend
  active: 'demo',

  // alamat backend Anda (Tahap 4). contoh: 'https://api.rumahdesign3d.com'
  backendBaseUrl: '',

  async pay(order) {
    const impl = this[this.active] || this.demo;
    return impl.call(this, order);
  },

  newOrderId() {
    return 'INV-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random()*900000);
  },

  // ---------- DEMO (sekarang) — tanpa transaksi nyata ----------
  async demo(order) {
    await new Promise(r => setTimeout(r, 1900));   // simulasi proses
    return { status: 'paid', orderId: this.newOrderId(), raw: { demo: true } };
  },

  // ---------- MIDTRANS (contoh kerangka — aktifkan saat go-live) ----------
  // Backend Anda membuat Snap transaction & mengembalikan { token } / { redirect_url }.
  // Lalu frontend membuka Snap popup (sudah memuat snap.js).
  async midtrans(order) {
    const orderId = this.newOrderId();
    // 1) minta token ke backend Anda
    const res = await fetch(`${this.backendBaseUrl}/api/midtrans/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, ...order })
    });
    if (!res.ok) throw new Error('Gagal membuat transaksi (HTTP ' + res.status + ')');
    const { token } = await res.json();
    // 2) buka Snap popup (perlu <script src="https://app.midtrans.com/snap/snap.js" data-client-key="..."> di HTML)
    return new Promise((resolve, reject) => {
      if (!window.snap) return reject(new Error('Snap.js belum dimuat'));
      window.snap.pay(token, {
        onSuccess: r => resolve({ status:'paid', orderId, raw:r }),
        onPending: r => resolve({ status:'pending', orderId, raw:r }),
        onError:   r => reject(new Error('Pembayaran gagal')),
        onClose:   () => reject(new Error('Pembayaran dibatalkan')),
      });
    });
    // 3) Aktivasi paket FINAL dilakukan backend via webhook Midtrans (server-to-server),
    //    bukan dari sini — agar tidak bisa dipalsukan.
  },

  // ---------- XENDIT (contoh kerangka) ----------
  // Backend membuat Invoice & mengembalikan { invoice_url }. Frontend redirect ke sana.
  async xendit(order) {
    const orderId = this.newOrderId();
    const res = await fetch(`${this.backendBaseUrl}/api/xendit/create-invoice`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, ...order })
    });
    if (!res.ok) throw new Error('Gagal membuat invoice (HTTP ' + res.status + ')');
    const { invoice_url } = await res.json();
    window.location.href = invoice_url;        // user bayar di halaman Xendit
    return { status: 'pending', orderId };     // status final via webhook -> backend
  },
};
// expose
window.PaymentProvider = PaymentProvider;
