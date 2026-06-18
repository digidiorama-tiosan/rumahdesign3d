// ===================== CONSTRUCTION / STRUCTURAL ESTIMATOR =====================
// Rough but realistic quantity take-off from the floor-plan geometry.
// All figures are estimates for early planning, NOT a final BoQ.

const ELEMENT_PRICES = {
  pondasi_batu_kali: 850000,   // per m³ pas. batu kali
  footplat: 3800000,           // per m³ beton bertulang
  tiang_pancang: 2500000,      // per titik
  sloof: 3600000,              // per m³
  kolom: 4200000,              // per m³
  ringbalok: 3800000,          // per m³
  dinding: 195000,             // per m² (bata+plester+aci)
  rangka_atap: 175000,         // per m² struktur atap
  plafon: 92000,               // per m²
  kusen: 1250000,              // per unit pintu/jendela
};
// material yields
const CONC = { semenSak:7.0, pasir:0.54, kerikil:0.81, besi:150 }; // per m³ beton
const BATA_PER_M2 = 70;       // ½ bata
const MORTAR = { semenKg:11.5, pasir:0.043 };  // per m² pasangan bata
const PLASTER = { semenKg:7.2, pasir:0.025 };  // per m² plester (per sisi)
const ACI_SEMEN = 3.25;        // kg/m²
const CAT_COVER = 10;          // m² per liter per lapis

function computeConstruction() {
  const wallH = parseFloat(val('wallHeight')||3);
  const wallT = parseFloat(val('wallThick')||15)/100;
  const city = (typeof cityMultiplier!=='undefined' ? cityMultiplier[val('citySelect')||'jakarta'] : 1) || 1;

  let totalWallLen = 0, groundWallLen = 0, totalArea = 0, openings = 0, nColTotal = 0;
  floors.forEach((f, i) => {
    let len = 0, area = 0;
    f.rooms.forEach(r => { len += 2*((r.w + r.h)/PX_PER_M); area += (r.w/PX_PER_M)*(r.h/PX_PER_M); });
    // smart-wall geometry
    const swLen = (typeof floorWallLen==='function') ? floorWallLen(f) : 0;
    const detArea = (f.detectedRooms||[]).reduce((s,r)=>s+r.area,0);
    len += swLen; area += detArea;
    totalWallLen += len; totalArea += area;
    if (i === 0) groundWallLen = len;
    openings += f.doors.length + f.windows.length;
    nColTotal += Math.max(4, Math.ceil(len / 3.5));
  });
  const topF = floors[floors.length-1];
  const topArea = (topF.rooms.reduce((s,r)=>s+(r.w/PX_PER_M)*(r.h/PX_PER_M),0) + (topF.detectedRooms||[]).reduce((s,r)=>s+r.area,0)) || totalArea;
  const pitch = (parseFloat(val('roofPitch')||30))*Math.PI/180;
  const roofArea = topF.roofType === 'dak' ? topArea : topArea / Math.max(0.5, Math.cos(pitch));

  const A_wall = totalWallLen * wallH;          // gross wall area
  const A_wall_net = A_wall * 0.85;             // minus openings
  const plasterArea = A_wall_net * 2;           // both faces

  // ---- concrete volumes ----
  const vSloof = groundWallLen * 0.15 * 0.20;
  const vKolom = nColTotal * 0.15 * 0.15 * wallH;
  const vRing  = totalWallLen * 0.15 * 0.20;

  // ---- foundation ----
  const pondasiType = val('pondasiType') || 'batu_kali';
  let pondasi;
  if (pondasiType === 'footplat') {
    const vol = nColTotal * 0.15; // m³ per footplat
    pondasi = { name:'Pondasi Footplat', qty:nColTotal, unit:'titik', detail:`${nColTotal} footplat ≈ ${vol.toFixed(2)} m³ beton`, cost: vol*ELEMENT_PRICES.footplat*city, _vConc:vol };
  } else if (pondasiType === 'tiang_pancang') {
    pondasi = { name:'Pondasi Tiang Pancang', qty:nColTotal, unit:'titik', detail:`${nColTotal} titik pancang`, cost: nColTotal*ELEMENT_PRICES.tiang_pancang*city, _vConc:0 };
  } else {
    const vol = groundWallLen * 0.4;
    pondasi = { name:'Pondasi Batu Kali', qty:+vol.toFixed(2), unit:'m³', detail:`Menerus ${groundWallLen.toFixed(1)} m × 0,4 m²`, cost: vol*ELEMENT_PRICES.pondasi_batu_kali*city, _vConc:0 };
  }

  const elements = [
    pondasi,
    { name:'Sloof 15×20', qty:+vSloof.toFixed(2), unit:'m³', detail:`Beton bertulang ${groundWallLen.toFixed(1)} m`, cost:vSloof*ELEMENT_PRICES.sloof*city, _vConc:vSloof },
    { name:'Kolom 15×15', qty:+vKolom.toFixed(2), unit:'m³', detail:`${nColTotal} kolom × ${wallH} m`, cost:vKolom*ELEMENT_PRICES.kolom*city, _vConc:vKolom },
    { name:'Ring Balok 15×20', qty:+vRing.toFixed(2), unit:'m³', detail:`Keliling ${totalWallLen.toFixed(1)} m`, cost:vRing*ELEMENT_PRICES.ringbalok*city, _vConc:vRing },
    { name:'Dinding', qty:+A_wall.toFixed(1), unit:'m²', detail:`Bata + plester + aci`, cost:A_wall*ELEMENT_PRICES.dinding*city, _aWall:A_wall },
    { name:'Atap', qty:+roofArea.toFixed(1), unit:'m²', detail:`${(ROOF_TYPES.find(t=>t.id===topF.roofType)||{}).name||'-'} — rangka + penutup`, cost:roofArea*(ELEMENT_PRICES.rangka_atap + (typeof roofPrices!=='undefined'?roofPrices[val('roofMat')||'genteng_beton']:180000))*city, _roof:roofArea },
    { name:'Finishing', qty:+totalArea.toFixed(1), unit:'m²', detail:`Lantai + plafon + cat + ${openings} kusen`, cost:(totalArea*((typeof floorPrices!=='undefined'?floorPrices[val('floorMat')||'keramik_40']:85000)+ELEMENT_PRICES.plafon) + openings*ELEMENT_PRICES.kusen + plasterArea/CAT_COVER*2*55000)*city },
  ];

  // ---- materials ----
  const vConc = elements.reduce((s,e)=>s+(e._vConc||0),0);
  const semenKg = vConc*CONC.semenSak*40 + A_wall_net*MORTAR.semenKg + plasterArea*PLASTER.semenKg + plasterArea*ACI_SEMEN;
  const pasir   = vConc*CONC.pasir + A_wall_net*MORTAR.pasir + plasterArea*PLASTER.pasir;
  const kerikil = vConc*CONC.kerikil;
  const besi    = vConc*CONC.besi*1.1;
  const bata    = A_wall_net*BATA_PER_M2;
  const catL    = plasterArea/CAT_COVER*2;

  const materials = {
    bata:   { icon:'🧱', name:'Bata Merah', qty:Math.ceil(bata), unit:'pcs', note:'½ bata' },
    semen:  { icon:'🛍️', name:'Semen', qty:Math.ceil(semenKg/40), unit:'sak', note:'@40 kg' },
    pasir:  { icon:'⛏️', name:'Pasir', qty:+pasir.toFixed(1), unit:'m³', note:'pasang+cor+plester' },
    kerikil:{ icon:'🪨', name:'Kerikil/Split', qty:+kerikil.toFixed(1), unit:'m³', note:'cor beton' },
    besi:   { icon:'🔩', name:'Besi Beton', qty:Math.ceil(besi), unit:'kg', note:'+10% susut' },
    cat:    { icon:'🎨', name:'Cat Tembok', qty:Math.ceil(catL/2.5), unit:'galon', note:'@2,5 L · 2 lapis' },
  };

  const subtotal = elements.reduce((s,e)=>s+e.cost,0);
  return { elements, materials, subtotal, vConc, totalArea, A_wall, city };
}

// ===================== RENDER: KONSTRUKSI (Advanced RAB) =====================
function renderKonstruksi(container) {
  if (!floors.some(f=>f.rooms.length)) { container.innerHTML = emptyRab(); return; }
  const c = computeConstruction();
  const mepc = (typeof getMEPForRAB==='function') ? getMEPForRAB() : { elec:0, plumb:0 };
  const rup = v => 'Rp' + Math.round(v).toLocaleString('id');

  const structRows = c.elements.map(e => `
    <tr><td class="el-name">${e.name}<div class="el-sub">${e.detail}</div></td>
        <td class="num">${e.qty.toLocaleString('id')} ${e.unit}</td>
        <td class="num el-total">${rup(e.cost)}</td></tr>`).join('');

  const mepRows = `
    <tr><td class="el-name">Instalasi Listrik<div class="el-sub">Lampu, stop kontak, saklar, MCB, dll</div></td><td class="num">—</td><td class="num el-total">${rup(mepc.elec)}</td></tr>
    <tr><td class="el-name">Instalasi Plumbing<div class="el-sub">Sanitair + pipa supply & drain</div></td><td class="num">—</td><td class="num el-total">${rup(mepc.plumb)}</td></tr>`;

  const structTotal = c.subtotal + mepc.elec + mepc.plumb;
  const overhead = structTotal*0.12, ppn = (structTotal+overhead)*0.11, grand = structTotal+overhead+ppn;

  container.innerHTML = `
    <div class="rab-section-title">Pekerjaan Struktur & Arsitektur</div>
    <table class="con-table"><thead><tr><th>Elemen</th><th class="num">Volume</th><th class="num">Biaya</th></tr></thead>
      <tbody>${structRows}</tbody></table>
    <div class="rab-section-title">Pekerjaan MEP</div>
    <table class="con-table"><thead><tr><th>Elemen</th><th class="num">Vol</th><th class="num">Biaya</th></tr></thead>
      <tbody>${mepRows}</tbody></table>
    <div class="rab-total-box">
      <div class="rab-total-label">TOTAL ESTIMASI (DETAIL KONSTRUKSI)</div>
      <div class="rab-total-value">${rup(grand)}</div>
      <div class="rab-total-sub">Subtotal ${rup(structTotal)} + Overhead 12% + PPN 11% · ≈ ${rup(grand/c.totalArea)}/m² · ${c.totalArea.toFixed(1)} m²</div>
    </div>`;
}

// ===================== RENDER: MATERIAL TAKE-OFF =====================
function renderTakeOff(container) {
  if (!floors.some(f=>f.rooms.length)) { container.innerHTML = emptyRab(); return; }
  const c = computeConstruction();
  const mats = Object.values(c.materials);
  const mepEst = (typeof estimateMEP==='function') ? estimateMEP() : null;

  const cards = mats.map(m => `
    <div class="mat-card"><div class="mc-ic">${m.icon}</div>
      <div class="mc-q">${m.qty.toLocaleString('id')}</div>
      <div class="mc-u">${m.unit}</div>
      <div class="mc-n">${m.name} · ${m.note}</div></div>`).join('');

  let mepBlock = '';
  if (mepEst) {
    mepBlock = `
      <div class="rab-section-title">Material MEP</div>
      <div class="takeoff-grid">
        <div class="mat-card"><div class="mc-ic">🔋</div><div class="mc-q">${mepEst.elec.cableTotal}</div><div class="mc-u">m</div><div class="mc-n">Kabel NYM</div></div>
        <div class="mat-card"><div class="mc-ic">🧵</div><div class="mc-q">${mepEst.elec.conduit}</div><div class="mc-u">m</div><div class="mc-n">Pipa Conduit</div></div>
        <div class="mat-card"><div class="mc-ic">🔵</div><div class="mc-q">${mepEst.plumb.supplyTotal}</div><div class="mc-u">m</div><div class="mc-n">Pipa Supply PVC</div></div>
        <div class="mat-card"><div class="mc-ic">⚫</div><div class="mc-q">${mepEst.plumb.drainTotal}</div><div class="mc-u">m</div><div class="mc-n">Pipa Drain PVC</div></div>
        <div class="mat-card"><div class="mc-ic">🔩</div><div class="mc-q">${mepEst.plumb.fittings}</div><div class="mc-u">pcs</div><div class="mc-n">Fitting</div></div>
      </div>`;
  }

  container.innerHTML = `
    <div class="rab-section-title">Material Struktur & Arsitektur</div>
    <div class="takeoff-grid">${cards}</div>
    ${mepBlock}
    <div class="rab-total-box">
      <div class="rab-total-label">CATATAN</div>
      <div class="rab-total-sub" style="font-size:12px; margin-top:2px;">Take-off dihitung dari ${c.totalArea.toFixed(1)} m² lantai &amp; ${c.A_wall.toFixed(0)} m² dinding (${c.vConc.toFixed(2)} m³ beton). Tambahkan faktor susut 5–10% saat pembelian. Estimasi awal, bukan BoQ final.</div>
    </div>`;
}

function emptyRab() { return '<div class="empty-state"><div class="empty-icon">📋</div>Tambahkan ruangan untuk melihat perhitungan</div>'; }
