// =====================================================================
// ONBOARDING TOUR + RESPONSIVE (MOBILE) GATE
// Self-contained: injects its own styles + DOM. No app internals needed.
// =====================================================================
(function () {
  'use strict';

  var TOUR_KEY = 'rumah3d_onboarded_v1';
  var GATE_KEY = 'rumah3d_mobilegate_dismissed';   // sessionStorage
  var GATE_MIN_W = 900;

  // ---------------- styles ----------------
  var css = '' +
  '.ob-overlay{position:fixed;inset:0;z-index:4000;display:none;align-items:center;justify-content:center;' +
  'background:rgba(8,9,13,0.78);backdrop-filter:blur(6px);padding:24px;}' +
  '.ob-overlay.show{display:flex;}' +
  '.ob-card{width:100%;max-width:520px;background:#161820;border:1px solid #2a2d3a;border-radius:20px;' +
  'box-shadow:0 30px 80px rgba(0,0,0,0.55);overflow:hidden;animation:obPop .28s cubic-bezier(.2,.9,.3,1);}' +
  '@keyframes obPop{from{opacity:0;transform:translateY(14px) scale(.97);}to{opacity:1;transform:none;}}' +
  '.ob-hero{height:148px;display:flex;align-items:center;justify-content:center;font-size:62px;' +
  'background:radial-gradient(circle at 30% 25%,rgba(245,166,35,0.28),transparent 60%),' +
  'radial-gradient(circle at 80% 80%,rgba(232,82,58,0.22),transparent 55%),#1e2029;' +
  'border-bottom:1px solid #2a2d3a;}' +
  '.ob-body{padding:24px 28px 8px;}' +
  '.ob-step-k{font-family:"Space Mono",monospace;font-size:11px;font-weight:700;letter-spacing:1.5px;' +
  'text-transform:uppercase;color:#f5a623;margin-bottom:8px;}' +
  '.ob-h{font-size:22px;font-weight:800;color:#e8eaf0;margin-bottom:8px;line-height:1.2;}' +
  '.ob-p{font-size:14px;line-height:1.6;color:#8b8fa8;}' +
  '.ob-p b{color:#cfd2de;font-weight:700;}' +
  '.ob-foot{display:flex;align-items:center;justify-content:space-between;padding:16px 28px 22px;gap:14px;}' +
  '.ob-dots{display:flex;gap:7px;}' +
  '.ob-dot{width:7px;height:7px;border-radius:50%;background:#2a2d3a;transition:all .2s;}' +
  '.ob-dot.on{background:#f5a623;width:20px;border-radius:4px;}' +
  '.ob-btns{display:flex;gap:8px;align-items:center;}' +
  '.ob-skip{background:none;border:none;color:#5a5e72;font-family:inherit;font-size:13px;font-weight:600;' +
  'cursor:pointer;padding:9px 6px;}' +
  '.ob-skip:hover{color:#8b8fa8;}' +
  '.ob-next{border:none;border-radius:10px;background:linear-gradient(135deg,#f5a623,#e8523a);color:#fff;' +
  'font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer;padding:11px 22px;transition:opacity .15s;}' +
  '.ob-next:hover{opacity:.9;}' +
  // mobile gate
  '.mg-overlay{position:fixed;inset:0;z-index:4200;display:none;flex-direction:column;align-items:center;' +
  'justify-content:center;text-align:center;background:#0d0f14;padding:40px 28px;}' +
  '.mg-overlay.show{display:flex;}' +
  '.mg-logo{display:flex;align-items:center;gap:10px;font-family:"Space Mono",monospace;font-weight:700;' +
  'font-size:18px;color:#e8eaf0;margin-bottom:28px;}' +
  '.mg-logo i{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;' +
  'font-size:17px;font-style:normal;background:linear-gradient(135deg,#f5a623,#e8523a);}' +
  '.mg-ic{font-size:56px;margin-bottom:18px;}' +
  '.mg-h{font-size:22px;font-weight:800;color:#e8eaf0;margin-bottom:12px;}' +
  '.mg-p{font-size:14.5px;line-height:1.65;color:#8b8fa8;max-width:340px;margin-bottom:26px;}' +
  '.mg-p b{color:#cfd2de;}' +
  '.mg-btn{border:1px solid #2a2d3a;border-radius:10px;background:#1e2029;color:#8b8fa8;font-family:inherit;' +
  'font-size:13px;font-weight:700;cursor:pointer;padding:12px 22px;}' +
  '.mg-btn:hover{border-color:#f5a623;color:#f5a623;}' +
  // help button
  '#obHelpBtn{display:inline-flex;align-items:center;justify-content:center;}';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---------------- tour content ----------------
  var STEPS = [
    { icon: '🏠', k: 'Selamat datang', h: 'RumahDesign3D — Floor Planner',
      p: 'Desain rumah lengkap dalam satu layar: <b>denah 2D</b>, <b>RAB otomatis</b>, <b>preview 3D</b>, sampai <b>gambar kerja</b>. Tur singkat ini (30 detik) menunjukkan alurnya.' },
    { icon: '🧱', k: 'Langkah 1 · Gambar', h: 'Gambar denah di kanvas',
      p: 'Pakai <b>toolbar kiri</b>: <b>🧱 Smart Wall</b> untuk menarik dinding (ruangan terdeteksi otomatis) atau <b>⬛ Ruangan</b> untuk kotak cepat. Tambahkan <b>🚪 pintu</b> &amp; <b>🪟 jendela</b>, lalu elemen <b>SITE</b> (carport, taman, kolam).' },
    { icon: '📋', k: 'Langkah 2 · Hitung', h: 'Material & RAB otomatis',
      p: 'Di <b>panel kanan</b> atur material, pondasi, atap. Buka tab <b>📋 RAB</b> di atas untuk anggaran biaya per kota (HSPK) — Ringkas, Konstruksi, Struktur &amp; Take-Off material.' },
    { icon: '🎲', k: 'Langkah 3 · Lihat', h: '3D, Tur Jalan & AI Studio',
      p: 'Klik <b>🎲 Preview 3D</b> untuk model realistis + <b>tur jalan</b> first-person. <b>✨ AI Studio</b> bisa menyusun denah dari kebutuhan/budget, cek regulasi, dan beri saran hemat biaya.' },
    { icon: '💾', k: 'Langkah 4 · Simpan', h: 'Simpan & ekspor',
      p: 'Proyek tersimpan otomatis di browser. <b>📤 Ekspor</b> ke PNG/PDF, gambar kerja A4/A3, atau DXF (AutoCAD). Aktifkan akun di <b>👤</b> untuk menyimpan ke <b>cloud</b> lintas perangkat.' }
  ];

  var idx = 0, overlay = null;

  function buildTour() {
    overlay = document.createElement('div');
    overlay.className = 'ob-overlay';
    overlay.id = 'obOverlay';
    overlay.innerHTML =
      '<div class="ob-card" role="dialog" aria-modal="true">' +
        '<div class="ob-hero" id="obHero"></div>' +
        '<div class="ob-body">' +
          '<div class="ob-step-k" id="obK"></div>' +
          '<div class="ob-h" id="obH"></div>' +
          '<div class="ob-p" id="obP"></div>' +
        '</div>' +
        '<div class="ob-foot">' +
          '<div class="ob-dots" id="obDots"></div>' +
          '<div class="ob-btns">' +
            '<button class="ob-skip" id="obSkip">Lewati</button>' +
            '<button class="ob-next" id="obNext">Lanjut</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById('obSkip').onclick = closeTour;
    document.getElementById('obNext').onclick = nextStep;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeTour(); });
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('show')) return;
      if (e.key === 'Escape') closeTour();
      else if (e.key === 'Enter' || e.key === 'ArrowRight') nextStep();
    });
  }

  function paint() {
    var s = STEPS[idx];
    document.getElementById('obHero').textContent = s.icon;
    document.getElementById('obK').textContent = s.k;
    document.getElementById('obH').textContent = s.h;
    document.getElementById('obP').innerHTML = s.p;
    document.getElementById('obNext').textContent = (idx === STEPS.length - 1) ? 'Mulai Mendesain' : 'Lanjut';
    document.getElementById('obSkip').style.visibility = (idx === STEPS.length - 1) ? 'hidden' : 'visible';
    var dots = STEPS.map(function (_, i) { return '<span class="ob-dot' + (i === idx ? ' on' : '') + '"></span>'; }).join('');
    document.getElementById('obDots').innerHTML = dots;
  }

  function openTour() { if (!overlay) buildTour(); idx = 0; paint(); overlay.classList.add('show'); }
  function nextStep() { if (idx < STEPS.length - 1) { idx++; paint(); } else closeTour(); }
  function closeTour() {
    if (overlay) overlay.classList.remove('show');
    try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) {}
  }
  window.openOnboarding = openTour;   // for the header help button

  // ---------------- mobile / small-screen gate ----------------
  var gate = null;
  function buildGate() {
    gate = document.createElement('div');
    gate.className = 'mg-overlay';
    gate.id = 'mgOverlay';
    gate.innerHTML =
      '<div class="mg-logo"><i>🏠</i>RumahDesign3D</div>' +
      '<div class="mg-ic">🖥️</div>' +
      '<div class="mg-h">Paling pas di layar besar</div>' +
      '<div class="mg-p">Floor Planner butuh ruang untuk kanvas, toolbar, dan panel. Untuk pengalaman terbaik, buka di <b>laptop atau desktop</b> (atau putar tablet ke <b>lanskap</b>).</div>' +
      '<button class="mg-btn" id="mgGo">Tetap lanjutkan di sini</button>';
    document.body.appendChild(gate);
    document.getElementById('mgGo').onclick = function () {
      try { sessionStorage.setItem(GATE_KEY, '1'); } catch (e) {}
      gate.classList.remove('show');
    };
  }
  function checkGate() {
    var dismissed = false;
    try { dismissed = sessionStorage.getItem(GATE_KEY) === '1'; } catch (e) {}
    var small = window.innerWidth < GATE_MIN_W;
    if (small && !dismissed) {
      if (!gate) buildGate();
      gate.classList.add('show');
    } else if (gate) {
      gate.classList.remove('show');
    }
  }

  // ---------------- header help button ----------------
  function injectHelpButton() {
    var actions = document.querySelector('.header-actions');
    if (!actions || document.getElementById('obHelpBtn')) return;
    var btn = document.createElement('button');
    btn.id = 'obHelpBtn';
    btn.className = 'btn-sm icon-btn';
    btn.title = 'Panduan / tur singkat';
    btn.textContent = '?';
    btn.onclick = openTour;
    // place right before the export menu wrapper, else append
    var menu = actions.querySelector('.menu-wrap');
    if (menu) actions.insertBefore(btn, menu); else actions.appendChild(btn);
  }

  // ---------------- boot ----------------
  function boot() {
    injectHelpButton();
    // mobile gate removed — the app now supports phones & tablets (see js/mobile.js)
    var seen = false;
    try { seen = localStorage.getItem(TOUR_KEY) === '1'; } catch (e) {}
    if (!seen) setTimeout(openTour, 650);   // let app finish first paint
  }

  if (document.readyState === 'loading') {
    window.addEventListener('load', boot);
  } else {
    boot();
  }
})();
