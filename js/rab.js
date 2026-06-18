// ===================== RAB CALCULATION (multi-floor) =====================
const cityMultiplier = { jakarta:1.0, surabaya:0.92, bandung:0.88, medan:0.85, makassar:0.80, yogyakarta:0.82 };
const floorPrices = { keramik_40:85000, keramik_60:110000, granit:220000, vinyl:75000, semen:45000 };
const wallPrices = { bata_merah:120000, hebel:145000, batako:95000 };
const roofPrices = { genteng_beton:180000, genteng_metal:210000, asbes:85000, spandek:160000 };
const pondasiPrices = { batu_kali:350000, footplat:520000, tiang_pancang:850000 };
const ZONE_PRICES = { carport:450000, garden:180000, pool:2200000 }; // per m²

function gatherRABData() {
  const wallH = parseFloat(val('wallHeight') || 3);
  let totalArea = 0, totalWallArea = 0, totalRooms = 0, totalBath = 0;
  let footprint = 0; // ground floor area for foundation
  floors.forEach((f, i) => {
    const detArea = (f.detectedRooms||[]).reduce((s,r)=>s+r.area,0);
    const detLen = (typeof floorWallLen==='function') ? floorWallLen(f) : 0;
    const a = f.rooms.reduce((s,r)=>s+(r.w/PX_PER_M)*(r.h/PX_PER_M),0) + detArea;
    const k = f.rooms.reduce((s,r)=>s+2*((r.w+r.h)/PX_PER_M),0) + detLen;
    totalArea += a; totalWallArea += k * wallH; totalRooms += f.rooms.length + (f.detectedRooms||[]).length;
    totalBath += f.rooms.filter(r=>r.type==='Kamar Mandi').length + (f.detectedRooms||[]).filter(r=>(r.name||r.type)==='Kamar Mandi').length;
    if (i === 0) footprint = a;
  });
  // top-floor footprint for roof
  const topArea = (floors[floors.length-1].rooms.reduce((s,r)=>s+(r.w/PX_PER_M)*(r.h/PX_PER_M),0)
    + (floors[floors.length-1].detectedRooms||[]).reduce((s,r)=>s+r.area,0)) || footprint;
  return { wallH, totalArea, totalWallArea, totalRooms, totalBath: totalBath||1, footprint: footprint||totalArea, topArea };
}

function buildRABItems() {
  const city = val('citySelect') || 'jakarta';
  const mult = cityMultiplier[city] || 1;
  const floor = val('floorMat') || 'keramik_40';
  const wall = val('wallMat') || 'bata_merah';
  const roof = val('roofMat') || 'genteng_beton';
  const pondasi = val('pondasiType') || 'batu_kali';
  const d = gatherRABData();

  const items = [
    { name:'Pekerjaan Pondasi', detail:`${d.footprint.toFixed(1)} m² × Rp${Math.round(pondasiPrices[pondasi]*mult).toLocaleString('id')}`, total: d.footprint*pondasiPrices[pondasi]*mult },
    { name:'Pekerjaan Dinding', detail:`${d.totalWallArea.toFixed(1)} m² × Rp${Math.round(wallPrices[wall]*mult).toLocaleString('id')}`, total: d.totalWallArea*wallPrices[wall]*mult },
    { name:'Pekerjaan Lantai', detail:`${d.totalArea.toFixed(1)} m² × Rp${Math.round(floorPrices[floor]*mult).toLocaleString('id')}`, total: d.totalArea*floorPrices[floor]*mult },
    { name:'Pekerjaan Atap', detail:`${d.topArea.toFixed(1)} m² × Rp${Math.round(roofPrices[roof]*mult).toLocaleString('id')}`, total: d.topArea*roofPrices[roof]*mult },
    { name:'Pekerjaan Plafon', detail:`${d.totalArea.toFixed(1)} m² × Rp${Math.round(55000*mult).toLocaleString('id')}`, total: d.totalArea*55000*mult },
    { name:'Instalasi Listrik', detail:`${d.totalRooms} titik × Rp${Math.round(2500000*mult).toLocaleString('id')}`, total: d.totalRooms*2500000*mult },
    { name:'Instalasi Air & Sanitasi', detail:`${d.totalBath} kamar mandi`, total: d.totalBath*8500000*mult },
    { name:'Pengecatan', detail:`${(d.totalWallArea*2).toFixed(0)} m² (2 lapis)`, total: d.totalWallArea*2*35000*mult },
  ];
  // Site elements
  const siteItems = [];
  ['carport','garden','pool'].forEach(type => {
    const area = siteplan.zones.filter(z=>z.type===type).reduce((s,z)=>s+(z.w/PX_PER_M)*(z.h/PX_PER_M),0);
    if (area > 0) {
      const lbl = ZONE_TOOLS[type].label;
      siteItems.push({ name:`Site — ${lbl}`, detail:`${area.toFixed(1)} m² × Rp${Math.round(ZONE_PRICES[type]*mult).toLocaleString('id')}`, total: area*ZONE_PRICES[type]*mult });
    }
  });
  // MEP (electrical + plumbing) — from placed points
  const mepItems = [];
  if (typeof getMEPForRAB === 'function') {
    const m = getMEPForRAB();
    if (m.elec > 0) mepItems.push({ name:'Instalasi Listrik', detail:'Lampu, stop kontak, saklar, MCB, dll + kabel', total:m.elec });
    if (m.plumb > 0) mepItems.push({ name:'Instalasi Plumbing', detail:'Sanitair + pipa supply & drain', total:m.plumb });
  }
  return { items, siteItems, mepItems, mult, city, d };
}

// active RAB sub-tab
let rabTab = 'ringkas';
function setRabTab(t) {
  if ((t === 'konstruksi' || t === 'struktur' || t === 'takeoff') && typeof requireFeature==='function' && !requireFeature('rab_adv')) return;
  rabTab = t;
  document.querySelectorAll('.rab-subtab').forEach(el => el.classList.toggle('active', el.dataset.rab === t));
  recalcRAB();
}

function recalcRAB() {
  const content = document.getElementById('rabContent');
  if (!content) return;
  if (rabTab === 'konstruksi' && typeof renderKonstruksi === 'function') { renderKonstruksi(content); return; }
  if (rabTab === 'struktur' && typeof renderStruktur === 'function') { renderStruktur(content); return; }
  if (rabTab === 'takeoff' && typeof renderTakeOff === 'function') { renderTakeOff(content); return; }
  const hasRooms = floors.some(f => f.rooms.length > 0);
  if (!hasRooms) {
    content.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div>Tambahkan ruangan untuk melihat estimasi RAB</div>';
    return;
  }
  const { items, siteItems, mepItems, city, d } = buildRABItems();
  const allItems = [...items, ...siteItems, ...mepItems];
  const subtotal = allItems.reduce((s,i)=>s+i.total,0);
  const overhead = subtotal*0.15;
  const ppn = (subtotal+overhead)*0.11;
  const grand = subtotal+overhead+ppn;

  const sub = document.getElementById('rabFvSub');
  if (sub) sub.textContent = `${floors.length} lantai · ${d.totalArea.toFixed(1)} m² total · HSPK ${city.charAt(0).toUpperCase()+city.slice(1)} ${new Date().getFullYear()}`;

  const row = i => `<div class="rab-item"><div class="rab-item-header"><span class="rab-item-name">${i.name}</span><span class="rab-item-total">Rp${Math.round(i.total).toLocaleString('id')}</span></div><div class="rab-item-detail">${i.detail}</div></div>`;
  content.innerHTML = `
    <div class="rab-section-title">Pekerjaan Bangunan</div>
    ${items.map(row).join('')}
    ${mepItems.length ? `<div class="rab-section-title">Pekerjaan MEP</div>${mepItems.map(row).join('')}` : ''}
    ${siteItems.length ? `<div class="rab-section-title">Pekerjaan Site / Lahan</div>${siteItems.map(row).join('')}` : ''}
    <div class="rab-section-title">Biaya Tambahan</div>
    <div class="rab-item"><div class="rab-item-header"><span class="rab-item-name">Overhead & Jasa (15%)</span><span class="rab-item-total" style="color:var(--text2)">Rp${Math.round(overhead).toLocaleString('id')}</span></div></div>
    <div class="rab-item"><div class="rab-item-header"><span class="rab-item-name">PPN 11%</span><span class="rab-item-total" style="color:var(--text2)">Rp${Math.round(ppn).toLocaleString('id')}</span></div></div>
    <div class="rab-total-box">
      <div class="rab-total-label">TOTAL ESTIMASI RAB (RINGKAS)</div>
      <div class="rab-total-value">Rp${Math.round(grand).toLocaleString('id')}</div>
      <div class="rab-total-sub">≈ Rp${Math.round(grand/d.totalArea).toLocaleString('id')}/m² · ${d.totalArea.toFixed(1)} m² · ${floors.length} lantai · estimasi kasar, bukan penawaran final</div>
    </div>`;
}

// ===================== CSV EXPORT =====================
function exportRABExcel() {
  if (!floors.some(f=>f.rooms.length)) { showNotif('⚠️ Tambah ruangan dulu!'); return; }
  const { items, siteItems, mepItems, city } = buildRABItems();
  const all = [...items, ...mepItems, ...siteItems];
  let csv = 'No,Pekerjaan,Total (Rp)\n';
  all.forEach((it,i)=> csv += `${i+1},"${it.name}",${Math.round(it.total)}\n`);
  const subtotal = all.reduce((s,it)=>s+it.total,0);
  csv += `,,\n,Subtotal,${Math.round(subtotal)}\n,Overhead 15%,${Math.round(subtotal*0.15)}\n,PPN 11%,${Math.round(subtotal*1.15*0.11)}\n,TOTAL,${Math.round(subtotal*1.15*1.11)}\n`;
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `RAB_RumahDesign3D_${city}_${Date.now()}.csv`; a.click();
  showNotif('📊 RAB berhasil diekspor!');
}

// expose for PDF
function getRABForPDF() {
  const { items, siteItems, mepItems, city, d } = buildRABItems();
  const all = [...items, ...mepItems, ...siteItems];
  const subtotal = all.reduce((s,i)=>s+i.total,0);
  const overhead = subtotal*0.15, ppn = (subtotal+overhead)*0.11, grand = subtotal+overhead+ppn;
  return { all, subtotal, overhead, ppn, grand, city, d };
}
