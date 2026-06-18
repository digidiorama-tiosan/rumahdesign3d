// ===================== MEP (Mechanical-Electrical-Plumbing) =====================
const MEP_LIB = [
  // ELECTRICAL
  { id:'lampu',      cat:'elec',  name:'Lampu',       icon:'💡', unit:'titik', cost:165000, cableM:8 },
  { id:'stopkontak', cat:'elec',  name:'Stop Kontak', icon:'🔌', unit:'titik', cost:185000, cableM:9 },
  { id:'saklar',     cat:'elec',  name:'Saklar',      icon:'🎚️', unit:'titik', cost:135000, cableM:6 },
  { id:'mcb',        cat:'elec',  name:'MCB / Panel', icon:'🗄️', unit:'unit',  cost:950000, cableM:0 },
  { id:'cctv',       cat:'elec',  name:'CCTV',        icon:'📹', unit:'titik', cost:1050000, cableM:14 },
  { id:'internet',   cat:'elec',  name:'Internet',    icon:'🌐', unit:'titik', cost:380000, cableM:14 },
  // PLUMBING
  { id:'wastafel',   cat:'plumb', name:'Wastafel',    icon:'🚰', unit:'titik', cost:850000,  supplyM:4, drainM:4 },
  { id:'toilet',     cat:'plumb', name:'Toilet',      icon:'🚽', unit:'titik', cost:1850000, supplyM:4, drainM:5 },
  { id:'shower',     cat:'plumb', name:'Shower',      icon:'🚿', unit:'titik', cost:780000,  supplyM:4, drainM:4 },
  { id:'sink',       cat:'plumb', name:'Kitchen Sink',icon:'🧼', unit:'titik', cost:950000,  supplyM:5, drainM:5 },
  { id:'septic',     cat:'plumb', name:'Septic Tank', icon:'🛢️', unit:'unit',  cost:6500000, supplyM:0, drainM:8 },
];
const MEP_COLORS = { elec:'#f5a623', plumb:'#4a9eff' };
let mepActiveCat = 'elec';

function mepDef(id) { return MEP_LIB.find(m => m.id === id); }

// ---- panel ----
function openMep(cat) { switchPanel('mep'); setMepCat(cat); }
function setMepCat(cat) {
  mepActiveCat = cat;
  document.querySelectorAll('.mep-cat').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  renderMepPalette();
}
function renderMepPalette() {
  const el = document.getElementById('mepPalette'); if (!el) return;
  el.innerHTML = MEP_LIB.filter(m => m.cat === mepActiveCat).map(m => `
    <div class="mep-sym ${pendingMep===m.id?'armed':''}" onclick="armMep('${m.id}')">
      <span class="ms-ic">${m.icon}</span><span class="ms-name">${m.name}</span>
    </div>`).join('');
}
function armMep(id) {
  pendingMep = (pendingMep === id) ? null : id;
  currentTool = pendingMep ? 'mep' : 'select';
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  if (!pendingMep) document.getElementById('tool-select')?.classList.add('active');
  const d = mepDef(id);
  document.getElementById('mepHint').textContent = pendingMep
    ? `Klik di kanvas untuk menaruh ${d.icon} ${d.name}. Esc / klik simbol lagi untuk berhenti.`
    : 'Klik simbol di bawah, lalu klik di kanvas untuk menaruh titik.';
  canvas.style.cursor = pendingMep ? 'crosshair' : 'default';
  renderMepPalette();
}
function disarmMep() { if (pendingMep) { pendingMep = null; renderMepPalette(); document.getElementById('mepHint').textContent = 'Klik simbol di bawah, lalu klik di kanvas untuk menaruh titik.'; } }

// ---- placement ----
function placeMep(id, x, y) {
  const def = mepDef(id); if (!def) return;
  mep.push({ mid: Date.now() + Math.random(), defId: id, cat: def.cat, x, y });
  renderMepPanel(); recalcRAB(); render();
}
function getMepAt(p) {
  const R = 13;
  for (let i = mep.length - 1; i >= 0; i--) {
    const m = mep[i];
    if (Math.hypot(p.x - m.x, p.y - m.y) <= R) return m;
  }
  return null;
}
function selectMep(mid) {
  selectedMepId = mid; selectedRoom = null; selectedFurnId = null;
  document.getElementById('furnInfobar').classList.remove('show');
  render();
}
function deleteMep(mid) {
  saveSnapshot();
  const f = activeFloor();
  f.mep = mep = mep.filter(m => m.mid !== mid);
  if (selectedMepId === mid) selectedMepId = null;
  renderMepPanel(); recalcRAB(); render();
}

// ---- render on canvas ----
function drawMep(invZ) {
  mep.forEach(m => {
    const def = mepDef(m.defId); if (!def) return;
    const sel = m.mid === selectedMepId;
    const col = MEP_COLORS[m.cat];
    const r = 11 * invZ;
    ctx.save();
    ctx.fillStyle = '#0d0f14'; ctx.strokeStyle = col; ctx.lineWidth = (sel ? 2.4 : 1.6) * invZ;
    ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    if (sel) { ctx.setLineDash([3*invZ,2*invZ]); ctx.beginPath(); ctx.arc(m.x, m.y, r+4*invZ, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]); }
    ctx.font = `${12*invZ}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(def.icon, m.x, m.y + 0.5*invZ);
    ctx.restore();
  });
}

// ---- auto-layout ----
function autoMep() {
  if (!rooms.length) { showNotif('⚠️ Belum ada ruangan di lantai ini'); return; }
  saveSnapshot();
  rooms.forEach(r => {
    const cx = r.x + r.w/2, cy = r.y + r.h/2;
    const inset = Math.min(r.w, r.h) * 0.22;
    placeMepSilent('lampu', cx, cy);
    placeMepSilent('saklar', r.x + inset, r.y + r.h - inset);
    placeMepSilent('stopkontak', r.x + inset, r.y + inset);
    placeMepSilent('stopkontak', r.x + r.w - inset, r.y + inset);
    if (r.type === 'Kamar Mandi') { placeMepSilent('toilet', cx, r.y + inset); placeMepSilent('shower', r.x + r.w - inset, cy); placeMepSilent('wastafel', r.x + inset, cy); }
    if (r.type === 'Dapur') { placeMepSilent('sink', cx, r.y + inset); }
  });
  // one MCB + one septic for the building (place on ground floor only)
  if (currentFloorIndex === 0) {
    if (!mep.some(m => m.defId === 'mcb')) placeMepSilent('mcb', rooms[0].x + 20, rooms[0].y + 20);
    if (!mep.some(m => m.defId === 'septic')) { const b = floorBounds(rooms); if (b) placeMepSilent('septic', b.maxX + 30, b.maxY + 30); }
  }
  renderMepPanel(); recalcRAB(); render();
  showNotif('✨ Titik MEP otomatis ditata');
}
function placeMepSilent(id, x, y) {
  const def = mepDef(id); if (!def) return;
  mep.push({ mid: Date.now() + Math.random(), defId: id, cat: def.cat, x: Math.round(x), y: Math.round(y) });
}

// ---- estimate (whole building) ----
function estimateMEP() {
  const counts = {};
  let elecCost = 0, plumbCost = 0, cableM = 0, supplyM = 0, drainM = 0;
  floors.forEach(f => (f.mep||[]).forEach(m => {
    const d = mepDef(m.defId); if (!d) return;
    counts[m.defId] = (counts[m.defId]||0) + 1;
    if (d.cat === 'elec') { elecCost += d.cost; cableM += d.cableM||0; }
    else { plumbCost += d.cost; supplyM += d.supplyM||0; drainM += d.drainM||0; }
  }));
  // cable: add ~15% spare + drops; conduit ≈ 0.9× cable
  const cableTotal = Math.round(cableM * 1.15);
  const conduit = Math.round(cableTotal * 0.9);
  const supplyTotal = Math.round(supplyM * 1.1);
  const drainTotal = Math.round(drainM * 1.1);
  const fittings = Math.round((supplyTotal + drainTotal) / 3);
  // material cost rough
  const cableCost = cableTotal * 12000;     // NYM 3×2.5 per m
  const conduitCost = conduit * 6000;
  const pipeCost = supplyTotal * 28000 + drainTotal * 42000; // PVC supply + drain per m
  const fittingCost = fittings * 18000;
  return {
    counts,
    elec: { fixtureCost: elecCost, cableTotal, conduit, cableCost, conduitCost, total: elecCost + cableCost + conduitCost },
    plumb: { fixtureCost: plumbCost, supplyTotal, drainTotal, fittings, pipeCost, fittingCost, total: plumbCost + pipeCost + fittingCost },
  };
}

function renderMepPanel() {
  renderMepPalette();
  const est = estimateMEP();
  const box = document.getElementById('mepEstimate'); if (!box) return;
  const rupiah = v => 'Rp' + Math.round(v).toLocaleString('id');
  if (mepActiveCat === 'elec') {
    const e = est.elec;
    box.innerHTML = `
      ${mepRow('💡 Fixture & titik', rupiah(e.fixtureCost))}
      ${mepRow('🔋 Kabel NYM (≈+15%)', e.cableTotal + ' m')}
      ${mepRow('🧵 Pipa conduit', e.conduit + ' m')}
      ${mepRow('💰 Material kabel+conduit', rupiah(e.cableCost + e.conduitCost))}
      <div class="mep-est-row total"><span class="mer-k">Total Listrik</span><span class="mer-v">${rupiah(e.total)}</span></div>`;
  } else {
    const p = est.plumb;
    box.innerHTML = `
      ${mepRow('🚰 Fixture sanitair', rupiah(p.fixtureCost))}
      ${mepRow('🔵 Pipa supply PVC ¾"', p.supplyTotal + ' m')}
      ${mepRow('⚫ Pipa drain PVC 3-4"', p.drainTotal + ' m')}
      ${mepRow('🔩 Fitting (elbow/tee)', p.fittings + ' pcs')}
      ${mepRow('💰 Material pipa+fitting', rupiah(p.pipeCost + p.fittingCost))}
      <div class="mep-est-row total"><span class="mer-k">Total Plumbing</span><span class="mer-v">${rupiah(p.total)}</span></div>`;
  }
  // list (current floor)
  const list = document.getElementById('mepList');
  const fm = mep.filter(m => mepDef(m.defId)?.cat === mepActiveCat);
  if (!fm.length) { list.innerHTML = '<div class="empty-state mini">Belum ada titik di lantai ini.</div>'; return; }
  const grouped = {};
  fm.forEach(m => { grouped[m.defId] = (grouped[m.defId]||[]); grouped[m.defId].push(m); });
  list.innerHTML = Object.entries(grouped).map(([id, arr]) => {
    const d = mepDef(id);
    return `<div class="mep-list-item"><span>${d.icon} ${d.name} × ${arr.length}</span>
      <span class="mli-del" onclick="deleteMepType('${id}')">✕ semua</span></div>`;
  }).join('');
}
function mepRow(k, v) { return `<div class="mep-est-row"><span class="mer-k">${k}</span><span class="mer-v">${v}</span></div>`; }
function deleteMepType(id) {
  saveSnapshot();
  const f = activeFloor();
  f.mep = mep = mep.filter(m => m.defId !== id);
  renderMepPanel(); recalcRAB(); render();
  showNotif('🗑 Titik ' + mepDef(id).name + ' dihapus dari lantai ini');
}

function getMEPForRAB() {
  const e = estimateMEP();
  return { elec: e.elec.total, plumb: e.plumb.total };
}
