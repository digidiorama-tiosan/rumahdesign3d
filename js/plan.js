// ===================== USER PLAN / FEATURE GATING =====================
// Local, demo-style entitlement system. Plan disimpan di localStorage PC ini.
const PLAN_STORE = 'rumah3d_user_plan';
const PLAN_RANK = { free:0, pro:1, dev:2 };

const PLANS = {
  free: { id:'free', name:'Free', icon:'🆓', price:'Rp 0', per:'selamanya', color:'#8b8fa8', priceM:0,
    tagline:'Untuk coba-coba & desain sederhana',
    perks:['Denah 2D + Smart Wall','Deteksi ruang otomatis','1 lantai','RAB Ringkas','Preview 3D + Tur Jalan','Ekspor PNG / JPG'] },
  pro: { id:'pro', name:'Pro', icon:'⭐', price:'Rp 99rb', per:'/ bulan', color:'#f5a623', priceM:99000,
    tagline:'Untuk arsitek, drafter & kontraktor',
    perks:['Semua fitur Free','Multi-lantai + Rooftop','Site Plan (carport/taman/kolam)','RAB Konstruksi + Struktur + Take-Off','Electrical & Plumbing (MEP)','Ekspor PDF + Gambar Kerja (A4/A3)','Ekspor DXF (AutoCAD/DraftSight)','AI Studio (Layout, RAB Optimizer, dll.)','AI Render fotorealistik'] },
  dev: { id:'dev', name:'Developer', icon:'👑', price:'Rp 299rb', per:'/ bulan', color:'#a78bfa', priceM:299000,
    tagline:'Untuk developer perumahan',
    perks:['Semua fitur Pro','Developer Mode (lahan → unit)','Siteplan otomatis 2D + 3D','Marketplace Template (Tipe 36–90)','Prioritas dukungan'] },
};

// feature key -> minimum plan required
const FEATURE_PLAN = {
  multifloor: 'pro',
  siteplan:   'pro',
  mep:        'pro',
  rab_adv:    'pro',
  pdf:        'pro',
  drawings:   'pro',
  dxf:        'pro',
  aistudio:   'pro',
  airender:   'pro',
  developer:  'dev',
  marketplace:'dev',
};
const FEATURE_LABEL = {
  multifloor:'Multi Lantai', siteplan:'Site Plan', mep:'Electrical & Plumbing (MEP)',
  rab_adv:'RAB Konstruksi / Struktur / Take-Off', pdf:'Ekspor PDF', drawings:'Gambar Kerja',
  dxf:'Ekspor DXF', aistudio:'AI Studio', airender:'AI Render', developer:'Developer Mode', marketplace:'Marketplace Template',
};

function getPlan() { try { return localStorage.getItem(PLAN_STORE) || 'free'; } catch(e){ return 'free'; } }

// ---------- subscription state ----------
const SUB_STORE = 'rumah3d_subscription';
function getSub() { try { return JSON.parse(localStorage.getItem(SUB_STORE)||'null'); } catch(e){ return null; } }
function setSub(s) { try { localStorage.setItem(SUB_STORE, JSON.stringify(s)); } catch(e){} }
function fmtRp(n) { return 'Rp ' + Math.round(n).toLocaleString('id'); }
function fmtDate(ts) { return new Date(ts).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}); }

function setPlan(p) {
  if (!PLANS[p]) return;
  try { localStorage.setItem(PLAN_STORE, p); } catch(e){}
  renderPlanBadge();
  applyPlanLocks();
  if (document.getElementById('modalPlan').classList.contains('show')) renderPlanModal();
  showNotif(`${PLANS[p].icon} Paket aktif: ${PLANS[p].name}`);
}
function planRank() { return PLAN_RANK[getPlan()] ?? 0; }
function hasFeature(key) {
  const need = FEATURE_PLAN[key]; if (!need) return true;
  return planRank() >= PLAN_RANK[need];
}
// guard: returns true if allowed; else opens upgrade modal and returns false
function requireFeature(key, labelOverride) {
  if (hasFeature(key)) return true;
  const need = FEATURE_PLAN[key] || 'pro';
  openPlanModal({ lockedKey:key, label:labelOverride || FEATURE_LABEL[key] || key, need });
  return false;
}

// ---------- header badge ----------
function renderPlanBadge() {
  const el = document.getElementById('planBadge'); if (!el) return;
  const p = PLANS[getPlan()];
  const sub = getSub();
  let exp = '';
  if (p.id !== 'free' && sub && sub.expiresAt) exp = `<span class="pb-exp">s/d ${fmtDate(sub.expiresAt)}</span>`;
  el.innerHTML = `<span class="pb-ic">${p.icon}</span><span class="pb-name">${p.name}</span>${exp}`;
  el.style.borderColor = p.color; el.style.color = p.color;
}

// ---------- lock indicators on locked controls ----------
function applyPlanLocks() {
  document.querySelectorAll('[data-feat]').forEach(el => {
    const key = el.getAttribute('data-feat');
    const locked = !hasFeature(key);
    el.classList.toggle('feat-locked', locked);
  });
  // AI nav items
  document.querySelectorAll('.ai-nav-item[data-ai]').forEach(el => {
    const tab = el.dataset.ai;
    let key = null;
    if (tab === 'developer') key = 'developer';
    else if (tab === 'template') key = 'marketplace';
    else key = 'aistudio';
    el.classList.toggle('feat-locked', !hasFeature(key));
  });
}

// ---------- plan modal ----------
let planModalCtx = null;
function openPlanModal(ctx) {
  planModalCtx = ctx || null;
  document.getElementById('modalPlan').classList.add('show');
  renderPlanModal();
}
function closePlanModal() { document.getElementById('modalPlan').classList.remove('show'); planModalCtx = null; }
function renderPlanModal() {
  const body = document.getElementById('planBody');
  const cur = getPlan();
  const banner = planModalCtx ? `<div class="plan-locked-banner">🔒 <b>${planModalCtx.label}</b> tersedia di paket <b>${PLANS[planModalCtx.need].name}</b> ke atas. Upgrade untuk membukanya.</div>` : '';
  body.innerHTML = banner + `<div class="plan-grid">` + Object.values(PLANS).map(p => {
    const isCur = p.id === cur;
    const highlight = planModalCtx && planModalCtx.need === p.id;
    return `<div class="plan-card ${isCur?'current':''} ${highlight?'highlight':''}" style="--pc:${p.color}">
      <div class="plan-card-h">
        <div class="plan-ic">${p.icon}</div>
        <div><div class="plan-name">${p.name}</div><div class="plan-tag">${p.tagline}</div></div>
      </div>
      <div class="plan-price">${p.price}<span class="plan-per">${p.per}</span></div>
      <ul class="plan-perks">${p.perks.map(x=>`<li>${x}</li>`).join('')}</ul>
      ${isCur ? planCardCurrentFooter()
              : `<button class="plan-btn" onclick="openCheckout('${p.id}')">${PLAN_RANK[p.id]>PLAN_RANK[cur]?'Upgrade ke '+p.name:'Pilih '+p.name}</button>`}
    </div>`;
  }).join('') + `</div>
  <div class="plan-note">Demo checkout: tidak ada transaksi nyata. Pembayaran asli butuh payment gateway (Midtrans/Xendit/Stripe) + backend. Dengan mendaftar Anda menyetujui <a href="Syarat & Ketentuan.html" target="_blank" style="color:var(--violet)">Syarat & Ketentuan</a> & <a href="Kebijakan Privasi.html" target="_blank" style="color:var(--violet)">Kebijakan Privasi</a>.</div>`;
}

function planCardCurrentFooter() {
  const sub = getSub();
  if (getPlan() === 'free' || !sub) return `<button class="plan-btn cur" disabled>✓ Paket Aktif</button>`;
  return `<div class="plan-substat">✓ Aktif s/d <b>${fmtDate(sub.expiresAt)}</b><br><span>${sub.cycle==='year'?'Tahunan':'Bulanan'} · ${fmtRp(sub.paid)} · ${sub.method}</span></div>
    <button class="plan-btn cancel" onclick="cancelSub()">Batalkan Langganan</button>`;
}
function cancelSub() {
  if (!confirm('Batalkan langganan & kembali ke paket Free?')) return;
  setSub(null); setPlan('free');
  showNotif('Langganan dibatalkan — kembali ke Free');
}

// run on load
function initPlan() { renderPlanBadge(); applyPlanLocks(); }
