// ===================== DEMO CHECKOUT / SUBSCRIPTION =====================
// Simulated payment flow — NO real transaction. Activates plan locally on success.
let coState = null;   // { plan, cycle:'month'|'year', method }

const PAY_METHODS = [
  { id:'qris',   name:'QRIS',            icon:'🟪', desc:'Scan dari semua e-wallet & m-banking' },
  { id:'va_bca', name:'Virtual Account', icon:'🏦', desc:'BCA / Mandiri / BNI / BRI' },
  { id:'gopay',  name:'GoPay',           icon:'🟢', desc:'Saldo GoPay' },
  { id:'ovo',    name:'OVO',             icon:'🟣', desc:'Saldo OVO' },
  { id:'dana',   name:'DANA',            icon:'🔵', desc:'Saldo DANA' },
  { id:'card',   name:'Kartu Kredit/Debit', icon:'💳', desc:'Visa / Mastercard' },
];

function cycleInfo(plan, cycle) {
  const m = PLANS[plan].priceM;
  if (cycle === 'year') { const total = m*10; return { total, label:'tahunan', sub:`${fmtRp(m)} × 12 − 2 bln gratis`, perMonth:total/12 }; }
  return { total:m, label:'bulanan', sub:'ditagih tiap bulan', perMonth:m };
}

function openCheckout(planId) {
  if (!PLANS[planId] || planId==='free') return;
  coState = { plan:planId, cycle:'month', method:'qris' };
  closePlanModal();
  document.getElementById('modalCheckout').classList.add('show');
  renderCheckout();
}
function closeCheckout() { document.getElementById('modalCheckout').classList.remove('show'); coState = null; }

function renderCheckout() {
  const p = PLANS[coState.plan];
  const ci = cycleInfo(coState.plan, coState.cycle);
  const tax = ci.total * 0.11;
  const grand = ci.total + tax;
  document.getElementById('checkoutTitle').innerHTML = `💳 Checkout — ${p.icon} ${p.name}`;
  const body = document.getElementById('checkoutBody');
  body.innerHTML = `
    <div class="co-grid">
      <div class="co-main">
        <div class="co-sec">
          <div class="co-h">1 · Siklus Tagihan</div>
          <div class="co-cycles">
            <label class="co-cycle ${coState.cycle==='month'?'active':''}">
              <input type="radio" name="cyc" ${coState.cycle==='month'?'checked':''} onchange="setCycle('month')">
              <div><div class="co-cycle-t">Bulanan</div><div class="co-cycle-s">${fmtRp(p.priceM)} / bulan</div></div>
            </label>
            <label class="co-cycle ${coState.cycle==='year'?'active':''}">
              <input type="radio" name="cyc" ${coState.cycle==='year'?'checked':''} onchange="setCycle('year')">
              <div><div class="co-cycle-t">Tahunan</div><div class="co-cycle-s">${fmtRp(p.priceM*10)} / tahun <span class="co-save">Hemat 2 bln</span></div></div>
            </label>
          </div>
        </div>

        <div class="co-sec">
          <div class="co-h">2 · Metode Pembayaran</div>
          <div class="co-methods">
            ${PAY_METHODS.map(m=>`<label class="co-method ${coState.method===m.id?'active':''}">
              <input type="radio" name="pay" ${coState.method===m.id?'checked':''} onchange="setMethod('${m.id}')">
              <span class="co-m-ic">${m.icon}</span>
              <span><span class="co-m-n">${m.name}</span><span class="co-m-d">${m.desc}</span></span>
            </label>`).join('')}
          </div>
        </div>

        <div class="co-sec">
          <div class="co-h">3 · Data Akun</div>
          <div class="co-fields">
            <input class="co-input" id="coName" placeholder="Nama lengkap">
            <input class="co-input" id="coEmail" type="email" placeholder="Email (untuk invoice)">
            <input class="co-input" id="coPhone" placeholder="No. HP / WhatsApp">
          </div>
        </div>
      </div>

      <div class="co-summary">
        <div class="co-sum-title">Ringkasan</div>
        <div class="co-sum-row"><span>Paket ${p.name}</span><span>${fmtRp(ci.total)}</span></div>
        <div class="co-sum-sub">${ci.sub}</div>
        <div class="co-sum-row"><span>PPN 11%</span><span>${fmtRp(tax)}</span></div>
        <div class="co-sum-div"></div>
        <div class="co-sum-row total"><span>Total</span><span>${fmtRp(grand)}</span></div>
        <div class="co-sum-permo">≈ ${fmtRp(grand/ (coState.cycle==='year'?12:1))} / bulan</div>
        <button class="co-pay-btn" id="coPayBtn" onclick="processPayment()">🔒 Bayar ${fmtRp(grand)}</button>
        <div class="co-secure">🔒 Demo aman — tidak ada transaksi nyata</div>
      </div>
    </div>`;
}
function setCycle(c) { coState.cycle = c; preserveForm(); renderCheckout(); }
function setMethod(m) { coState.method = m; preserveForm(); renderCheckout(); }
function preserveForm() {
  coState._n = document.getElementById('coName')?.value || coState._n || '';
  coState._e = document.getElementById('coEmail')?.value || coState._e || '';
  coState._p = document.getElementById('coPhone')?.value || coState._p || '';
  setTimeout(()=>{ if(document.getElementById('coName')){ document.getElementById('coName').value=coState._n; document.getElementById('coEmail').value=coState._e; document.getElementById('coPhone').value=coState._p; }},0);
}

async function processPayment() {
  const name = document.getElementById('coName').value.trim();
  const email = document.getElementById('coEmail').value.trim();
  const phone = (document.getElementById('coPhone')?.value || '').trim();
  if (!name || !email) { showNotif('⚠️ Isi nama & email dulu'); return; }
  const p = PLANS[coState.plan];
  const ci = cycleInfo(coState.plan, coState.cycle);
  const grand = Math.round(ci.total * 1.11);
  const method = PAY_METHODS.find(m=>m.id===coState.method);
  const btn = document.getElementById('coPayBtn');
  btn.disabled = true;

  const body = document.getElementById('checkoutBody');
  body.innerHTML = `<div class="co-processing">
    <div class="co-spinner"></div>
    <div class="co-proc-t">Memproses pembayaran…</div>
    <div class="co-proc-s">${method.icon} ${method.name} · ${fmtRp(grand)}</div>
  </div>`;

  // ===== Semua "cara bayar" lewat PaymentProvider — tinggal ganti ke gateway asli =====
  let result;
  try {
    result = await PaymentProvider.pay({
      plan: coState.plan, cycle: coState.cycle, amount: grand,
      method: coState.method, customer: { name, email, phone },
    });
  } catch (e) {
    body.innerHTML = `<div class="co-processing">
      <div class="co-proc-t" style="color:var(--accent2)">❌ Pembayaran gagal</div>
      <div class="co-proc-s">${escHtml(e.message||'')}</div>
      <button class="co-ghost-btn" style="margin-top:16px;" onclick="renderCheckout()">← Coba lagi</button></div>`;
    return;
  }

  // Pada produksi: aktivasi final paket dilakukan backend lewat WEBHOOK gateway
  // (server-to-server) agar tidak bisa dipalsukan. Di demo ini kita aktifkan langsung.
  if (result.status === 'paid' || (PaymentProvider.active === 'demo' && result.status)) {
    const now = Date.now();
    const days = coState.cycle==='year' ? 365 : 30;
    const expiresAt = now + days*86400000;
    const orderId = result.orderId || PaymentProvider.newOrderId();
    setSub({ plan:coState.plan, cycle:coState.cycle, paid:grand, method:method.name, activatedAt:now, expiresAt, orderId, name, email });
    setPlan(coState.plan);
    renderInvoice({ p, grand, method, orderId, expiresAt, name, email, ci });
  } else if (result.status === 'pending') {
    body.innerHTML = `<div class="co-processing">
      <div class="co-proc-t">⏳ Menunggu pembayaran</div>
      <div class="co-proc-s">Selesaikan pembayaran ${method.name}. Paket otomatis aktif setelah pembayaran dikonfirmasi.</div></div>`;
  }
}

function renderInvoice({ p, grand, method, orderId, expiresAt, name, email, ci }) {
  document.getElementById('checkoutTitle').innerHTML = `✅ Pembayaran Berhasil`;
  const body = document.getElementById('checkoutBody');
  body.innerHTML = `
    <div class="co-success">
      <div class="co-check">✓</div>
      <div class="co-suc-t">Selamat! Paket <b style="color:${p.color}">${p.icon} ${p.name}</b> aktif</div>
      <div class="co-suc-s">Semua fitur ${p.name} sudah terbuka. Berlaku sampai <b>${fmtDate(expiresAt)}</b>.</div>

      <div class="co-invoice">
        <div class="co-inv-h"><span>INVOICE</span><span>${orderId}</span></div>
        <div class="co-inv-row"><span>Nama</span><span>${escHtml(name)}</span></div>
        <div class="co-inv-row"><span>Email</span><span>${escHtml(email)}</span></div>
        <div class="co-inv-row"><span>Paket</span><span>${p.name} (${ci.label})</span></div>
        <div class="co-inv-row"><span>Metode</span><span>${method.icon} ${method.name}</span></div>
        <div class="co-inv-row"><span>Tanggal</span><span>${fmtDate(Date.now())}</span></div>
        <div class="co-inv-div"></div>
        <div class="co-inv-row total"><span>Total Dibayar</span><span>${fmtRp(grand)}</span></div>
      </div>

      <div class="co-suc-btns">
        <button class="plan-btn" style="background:${p.color}" onclick="closeCheckout(); showNotif('🎉 Selamat menikmati fitur ${p.name}!');">Mulai Pakai Fitur ${p.name}</button>
        <button class="co-ghost-btn" onclick="printInvoice('${orderId}')">🖨 Cetak Invoice</button>
      </div>
      <div class="co-secure" style="margin-top:6px;">Demo — tidak ada transaksi nyata. Invoice ini contoh tampilan.</div>
    </div>`;
}
function printInvoice(orderId) {
  const sub = getSub(); if (!sub) return;
  const p = PLANS[sub.plan];
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>${orderId}</title><style>body{font-family:system-ui,sans-serif;padding:40px;color:#1c1c22;max-width:600px;margin:auto}h1{color:#f5a623}table{width:100%;border-collapse:collapse;margin-top:20px}td{padding:8px 0;border-bottom:1px solid #eee}.r{text-align:right}.tot{font-size:20px;font-weight:800}</style></head><body>
    <h1>🏠 RumahDesign3D</h1><p>Invoice ${orderId} · ${fmtDate(sub.activatedAt)}</p>
    <table>
      <tr><td>Nama</td><td class="r">${escHtml(sub.name||'-')}</td></tr>
      <tr><td>Email</td><td class="r">${escHtml(sub.email||'-')}</td></tr>
      <tr><td>Paket</td><td class="r">${p.name} (${sub.cycle==='year'?'Tahunan':'Bulanan'})</td></tr>
      <tr><td>Metode</td><td class="r">${sub.method}</td></tr>
      <tr><td>Berlaku s/d</td><td class="r">${fmtDate(sub.expiresAt)}</td></tr>
      <tr><td class="tot">Total Dibayar</td><td class="r tot">${fmtRp(sub.paid)}</td></tr>
    </table>
    <p style="margin-top:30px;color:#888;font-size:12px">Demo — bukan dokumen pajak resmi.</p>
    </body></html>`);
  w.document.close(); w.print();
}
function escHtml(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
