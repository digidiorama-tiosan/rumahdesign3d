// ===================== FURNITURE LIBRARY =====================
const FURN_LIB = [
  { id:'sofa3', name:'Sofa 3-dudukan', cat:'Ruang Tamu', icon:'🛋️', w:3, h:1, color:'#6b7280' },
  { id:'sofa2', name:'Sofa 2-dudukan', cat:'Ruang Tamu', icon:'🪑', w:2, h:1, color:'#6b7280' },
  { id:'meja_tv', name:'Meja TV', cat:'Ruang Tamu', icon:'📺', w:2, h:0.5, color:'#92400e' },
  { id:'meja_kopi', name:'Meja Kopi', cat:'Ruang Tamu', icon:'☕', w:1, h:0.6, color:'#92400e' },
  { id:'kursi', name:'Kursi Single', cat:'Ruang Tamu', icon:'🪑', w:1, h:1, color:'#4b5563' },
  { id:'lemari_tv', name:'Lemari TV', cat:'Ruang Tamu', icon:'🗄️', w:1.8, h:0.4, color:'#78350f' },
  { id:'kasur_king', name:'Kasur King', cat:'Kamar Tidur', icon:'🛏️', w:2, h:2, color:'#1d4ed8' },
  { id:'kasur_single', name:'Kasur Single', cat:'Kamar Tidur', icon:'🛏️', w:1, h:2, color:'#2563eb' },
  { id:'lemari_pakaian', name:'Lemari Pakaian', cat:'Kamar Tidur', icon:'🚪', w:1.8, h:0.6, color:'#92400e' },
  { id:'meja_rias', name:'Meja Rias', cat:'Kamar Tidur', icon:'🪞', w:1, h:0.5, color:'#a16207' },
  { id:'nakas', name:'Nakas', cat:'Kamar Tidur', icon:'🗃️', w:0.5, h:0.5, color:'#78350f' },
  { id:'meja_belajar', name:'Meja Belajar', cat:'Kamar Tidur', icon:'📚', w:1.2, h:0.6, color:'#92400e' },
  { id:'kulkas', name:'Kulkas', cat:'Dapur', icon:'🧊', w:0.7, h:0.7, color:'#e5e7eb' },
  { id:'kompor', name:'Kompor', cat:'Dapur', icon:'🍳', w:0.8, h:0.6, color:'#374151' },
  { id:'wastafel_dapur', name:'Wastafel Dapur', cat:'Dapur', icon:'🚿', w:0.6, h:0.5, color:'#bfdbfe' },
  { id:'meja_makan', name:'Meja Makan 4', cat:'Dapur', icon:'🍽️', w:1.5, h:1, color:'#92400e' },
  { id:'island', name:'Kitchen Island', cat:'Dapur', icon:'🍽️', w:1.8, h:0.8, color:'#f3f4f6' },
  { id:'toilet', name:'Toilet', cat:'Kamar Mandi', icon:'🚽', w:0.5, h:0.7, color:'#f9fafb' },
  { id:'shower', name:'Shower Area', cat:'Kamar Mandi', icon:'🚿', w:0.9, h:0.9, color:'#bfdbfe' },
  { id:'bathtub', name:'Bathtub', cat:'Kamar Mandi', icon:'🛁', w:0.8, h:1.7, color:'#e0f2fe' },
  { id:'wastafel', name:'Wastafel', cat:'Kamar Mandi', icon:'🪥', w:0.5, h:0.4, color:'#f9fafb' },
  { id:'meja_kerja', name:'Meja Kerja', cat:'Kantor', icon:'💻', w:1.5, h:0.7, color:'#1e3a5f' },
  { id:'rak_buku', name:'Rak Buku', cat:'Kantor', icon:'📚', w:1.2, h:0.3, color:'#92400e' },
  { id:'filing', name:'Filing Cabinet', cat:'Kantor', icon:'🗄️', w:0.5, h:0.6, color:'#374151' },
  { id:'meeting', name:'Meja Meeting', cat:'Kantor', icon:'🪑', w:2.5, h:1.2, color:'#1e3a5f' },
  { id:'tanaman', name:'Tanaman Hias', cat:'Lainnya', icon:'🪴', w:0.5, h:0.5, color:'#15803d' },
  { id:'ac', name:'AC Split', cat:'Lainnya', icon:'❄️', w:1, h:0.2, color:'#bfdbfe' },
  { id:'tv', name:'TV LED', cat:'Lainnya', icon:'📺', w:1.2, h:0.1, color:'#111827' },
  { id:'lampu', name:'Lampu Lantai', cat:'Lainnya', icon:'💡', w:0.4, h:0.4, color:'#fbbf24' },
];
const FURN_CATS = ['Semua','Ruang Tamu','Kamar Tidur','Dapur','Kamar Mandi','Kantor','Lainnya'];
let activeFurnCat = 'Semua';

function initFurnPanel() {
  document.getElementById('furnCats').innerHTML = FURN_CATS.map(c =>
    `<button class="furn-cat${c===activeFurnCat?' active':''}" onclick="setFurnCat('${c}')">${c}</button>`).join('');
  renderFurnGrid();
}
function setFurnCat(cat) { activeFurnCat = cat; document.querySelectorAll('.furn-cat').forEach(b => b.classList.toggle('active', b.textContent === cat)); renderFurnGrid(); }
function renderFurnGrid() {
  const q = document.getElementById('furnSearch')?.value?.toLowerCase() || '';
  const items = FURN_LIB.filter(f => (activeFurnCat==='Semua'||f.cat===activeFurnCat) && (!q || f.name.toLowerCase().includes(q)));
  document.getElementById('furnGrid').innerHTML = items.length ? items.map(f => `
    <div class="furn-card" draggable="true" ondragstart="furnDragStart(event,'${f.id}')" ondragend="furnDragEnd(event)" onclick="furnQuickPlace('${f.id}')">
      <span class="furn-icon">${f.icon}</span>
      <div class="furn-name">${f.name}</div>
      <div class="furn-size">${f.w}×${f.h}m</div>
    </div>`).join('') : `<div style="grid-column:1/-1; text-align:center; color:var(--text3); font-size:12px; padding:20px 0;">Tidak ditemukan</div>`;
}

// ===================== DRAG FROM LIBRARY =====================
const ghost = document.getElementById('furnGhost');
function furnDragStart(e, id) {
  furnDragSource = id;
  const f = FURN_LIB.find(x => x.id === id);
  ghost.textContent = f.icon; ghost.style.display = 'block';
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setDragImage(new Image(), 0, 0);
}
function furnDragEnd() { ghost.style.display = 'none'; furnDragSource = null; }
document.addEventListener('dragover', e => { if (!furnDragSource) return; ghost.style.left = e.clientX+'px'; ghost.style.top = e.clientY+'px'; e.preventDefault(); });
canvas.addEventListener('dragover', e => { if (furnDragSource) e.preventDefault(); });
canvas.addEventListener('drop', e => {
  if (!furnDragSource) return;
  e.preventDefault();
  saveSnapshot();
  const pos = snapToGrid(getPos(e));
  placeFurniture(furnDragSource, pos.x, pos.y);
  ghost.style.display = 'none'; furnDragSource = null;
});
function furnQuickPlace(id) {
  saveSnapshot();
  const ref = rooms[0];
  placeFurniture(id, ref ? ref.x + 40 : 200, ref ? ref.y + 40 : 200);
  showNotif('✅ Furnitur ditambahkan — klik untuk pilih, drag untuk pindah');
}
function placeFurniture(id, x, y) {
  const def = FURN_LIB.find(f => f.id === id); if (!def) return;
  const fid = Date.now() + Math.random();
  furnitures.push({ fid, defId:id, name:def.name, icon:def.icon, x, y, w:def.w*PX_PER_M, h:def.h*PX_PER_M, color:def.color, rotation:0 });
  selectFurn(fid); render();
}

// ===================== SELECT / ROTATE / DELETE =====================
function selectFurn(fid) {
  selectedFurnId = fid; selectedRoom = null; updateRoomList(); renderSelectedRoomProps();
  const f = furnitures.find(x => x.fid === fid);
  const bar = document.getElementById('furnInfobar');
  if (f) { bar.classList.add('show'); document.getElementById('furnInfoName').textContent = f.icon + ' ' + f.name; }
  else bar.classList.remove('show');
  render();
}
function deselectFurn() { selectedFurnId = null; document.getElementById('furnInfobar').classList.remove('show'); }
function rotateFurn() {
  const f = furnitures.find(x => x.fid === selectedFurnId); if (!f) return;
  saveSnapshot(); f.rotation = (f.rotation + 90) % 360; render();
  showNotif('↻ Diputar ' + f.rotation + '°');
}
function deleteFurn() {
  saveSnapshot();
  const fl = activeFloor();
  fl.furnitures = furnitures = furnitures.filter(x => x.fid !== selectedFurnId);
  selectedFurnId = null;
  document.getElementById('furnInfobar').classList.remove('show'); render();
  showNotif('🗑 Furnitur dihapus');
}
