const PaymentProvider={
  // Ganti 'demo' dengan 'midtrans' setelah setup selesai
  active: localStorage.getItem('rumah3d_payment_mode') || 'demo',

  // URL backend Supabase (otomatis dari config)
  get backendBaseUrl() {
    return (typeof window.SUPABASE_URL !== 'undefined' ? window.SUPABASE_URL : '') + '/functions/v1';
  },

  async pay(order) {
    const impl = this[this.active] || this.demo;
    return impl.call(this, order);
  },

  newOrderId() {
    return 'INV-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
  },

  // ── DEMO (default, tidak memerlukan setup) ──────────────
  async demo(order) {
    await new Promise(r => setTimeout(r, 1800));
    return { status: 'paid', orderId: this.newOrderId(), raw: { demo: true } };
  },

  // ── MIDTRANS ────────────────────────────────────────────
  async midtrans(order) {
    const orderId = this.newOrderId();

    // Muat Snap.js jika belum ada
    if (!window.snap) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        const isProd = localStorage.getItem('rumah3d_midtrans_env') === 'production';
        s.src = isProd
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js';
        s.setAttribute('data-client-key', localStorage.getItem('rumah3d_midtrans_client_key') || '');
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }

    // Minta token dari Edge Function
    const res = await fetch(this.backendBaseUrl + '/midtrans-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': typeof window.SUPABASE_ANON_KEY !== 'undefined' ? window.SUPABASE_ANON_KEY : '',
      },
      body: JSON.stringify({
        orderId,
        amount: order.amount,
        items: order.items,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
      }),
    });

    if (!res.ok) throw new Error('Gagal membuat transaksi (HTTP ' + res.status + ')');
    const { token, error } = await res.json();
    if (error) throw new Error(error);

    return new Promise((resolve, reject) => {
      window.snap.pay(token, {
        onSuccess: r => resolve({ status: 'paid',    orderId, raw: r }),
        onPending: r => resolve({ status: 'pending', orderId, raw: r }),
        onError:   r => reject(new Error('Pembayaran gagal: ' + (r.status_message || ''))),
        onClose:   () => reject(new Error('Pembayaran dibatalkan')),
      });
    });
  },

  // ── XENDIT (opsional) ───────────────────────────────────
  async xendit(order) {
    const orderId = this.newOrderId();
    const res = await fetch(this.backendBaseUrl + '/xendit-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': window.SUPABASE_ANON_KEY || '' },
      body: JSON.stringify({ orderId, ...order }),
    });
    if (!res.ok) throw new Error('Gagal membuat invoice (HTTP ' + res.status + ')');
    const { invoice_url } = await res.json();
    window.location.href = invoice_url;
    return { status: 'pending', orderId };
  },
};

window.PaymentProvider = PaymentProvider;
