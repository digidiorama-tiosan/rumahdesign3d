// ===================== ROOM MANAGEMENT =====================
function addRoom(type, x, y, w, h) {
  const id = Date.now();
  const color = roomColors[rooms.length % roomColors.length];
  rooms.push({ id, type, x: x||80, y: y||80, w: w||160, h: h||120, color });
  selectRoom(id); updateRoomList(); updateStats(); recalcRAB(); render();
  showNotif(`✅ ${type} ditambahkan`);
}
function addRoomFromPanel() {
  const type = document.getElementById('newRoomType').value;
  const sizes = { 'Ruang Tamu':[200,160],'Kamar Tidur':[160,160],'Dapur':[160,120],'Kamar Mandi':[80,80],
                  'Ruang Makan':[160,120],'Garasi':[200,120],'Teras':[200,80],'Gudang':[80,100] };
  const [dw,dh] = sizes[type] || [160,120];
  const offset = rooms.length * 20;
  saveSnapshot();
  addRoom(type, 80+offset, 80+offset, dw, dh);
}
function selectRoom(id) { selectedRoom = id; updateRoomList(); renderSelectedRoomProps(); render(); }
function deleteRoom(id) {
  saveSnapshot();
  const f = activeFloor();
  f.rooms = rooms = rooms.filter(r => r.id !== id);
  f.doors = doors = doors.filter(d => d.roomId !== id);
  f.windows = windows = windows.filter(w => w.roomId !== id);
  if (selectedRoom === id) selectedRoom = null;
  updateRoomList(); updateStats(); recalcRAB(); renderSelectedRoomProps(); render();
}

function updateRoomList() {
  const list = document.getElementById('roomList');
  if (!rooms.length) {
    list.innerHTML = '<div class="empty-state mini"><div class="empty-icon">🏠</div>Belum ada ruangan di lantai ini.</div>';
    return;
  }
  list.innerHTML = rooms.map(r => {
    const luas = ((r.w/PX_PER_M)*(r.h/PX_PER_M)).toFixed(1);
    return `<div class="room-item ${selectedRoom===r.id?'selected':''}" onclick="selectRoom(${r.id})">
      <div class="room-dot" style="background:${r.color}"></div>
      <span class="room-name">${r.type}</span>
      <span class="room-size">${luas}m²</span>
      <span class="room-del" onclick="event.stopPropagation(); deleteRoom(${r.id})">✕</span>
    </div>`;
  }).join('');
}

// ===================== SELECTED ROOM PROPERTIES (editable dims) =====================
function renderSelectedRoomProps() {
  const box = document.getElementById('selectedRoomProps');
  const r = rooms.find(x => x.id === selectedRoom);
  if (!r) { box.innerHTML = '<div class="empty-state mini">Pilih ruangan untuk edit ukuran</div>'; return; }
  box.innerHTML = `
    <div class="srp-row"><label>Nama</label>
      <select class="select-sm" onchange="setRoomType(${r.id}, this.value)">
        ${['Ruang Tamu','Kamar Tidur','Dapur','Kamar Mandi','Ruang Makan','Garasi','Teras','Gudang']
          .map(t => `<option ${t===r.type?'selected':''}>${t}</option>`).join('')}
      </select></div>
    <div class="srp-row"><label>Lebar (m)</label>
      <input class="prop-input" type="number" step="0.5" min="1" value="${(r.w/PX_PER_M).toFixed(1)}" onchange="setRoomDim(${r.id},'w',this.value)"></div>
    <div class="srp-row"><label>Panjang (m)</label>
      <input class="prop-input" type="number" step="0.5" min="1" value="${(r.h/PX_PER_M).toFixed(1)}" onchange="setRoomDim(${r.id},'h',this.value)"></div>
    <div class="srp-row"><label>Luas</label>
      <span class="prop-value accent">${((r.w/PX_PER_M)*(r.h/PX_PER_M)).toFixed(1)} m²</span></div>
    <button class="floor-act danger" style="width:100%; margin-top:6px;" onclick="deleteRoom(${r.id})">🗑 Hapus Ruangan</button>`;
}
function setRoomType(id, type) { const r = rooms.find(x=>x.id===id); if(!r) return; saveSnapshot(); r.type = type; updateRoomList(); recalcRAB(); render(); }
function setRoomDim(id, dim, v) {
  const r = rooms.find(x=>x.id===id); if(!r) return;
  saveSnapshot();
  const px = Math.max(GRID, Math.round(parseFloat(v)*PX_PER_M / GRID)*GRID);
  r[dim] = px;
  updateRoomList(); updateStats(); recalcRAB(); renderSelectedRoomProps(); render();
}

// ===================== STATS / AUTO DIMENSION =====================
function updateStats() {
  const det = (typeof floorDetectedArea==='function') ? floorDetectedArea(activeFloor()) : 0;
  const floorArea = rooms.reduce((s,r) => s+(r.w/PX_PER_M)*(r.h/PX_PER_M), 0) + det;
  const buildingArea = floors.reduce((sum,f) => sum + f.rooms.reduce((s,r)=>s+(r.w/PX_PER_M)*(r.h/PX_PER_M),0) + (f.detectedRooms||[]).reduce((s,r)=>s+r.area,0), 0);
  document.getElementById('floorArea').textContent = floorArea.toFixed(1) + ' m²';
  document.getElementById('buildingArea').textContent = buildingArea.toFixed(1) + ' m²';
  document.getElementById('floorCount').textContent = floors.length;
  // building footprint dims = max bounding across floors
  let dims = '— × —';
  const b = floorBounds(rooms.length ? rooms : (floors.find(f=>f.rooms.length)?.rooms || []));
  if (b) dims = `${((b.maxX-b.minX)/PX_PER_M).toFixed(1)} × ${((b.maxY-b.minY)/PX_PER_M).toFixed(1)} m`;
  document.getElementById('buildingDims').textContent = dims;
  renderActiveFloorCard();
}

function renderActiveFloorCard() {
  const f = activeFloor();
  const det = (f.detectedRooms||[]).reduce((s,r)=>s+r.area,0);
  const area = f.rooms.reduce((s,r)=>s+(r.w/PX_PER_M)*(r.h/PX_PER_M),0) + det;
  const roomCount = f.rooms.length + (f.detectedRooms||[]).length;
  document.getElementById('activeFloorCard').innerHTML = `
    <div><div class="afc-name">${f.name}</div>
      <div class="afc-meta">${roomCount} ruangan · ${f.doors.length}🚪 ${f.windows.length}🪟</div></div>
    <div class="afc-meta" style="text-align:right; font-size:14px; font-weight:800; color:var(--accent)">${area.toFixed(1)} m²</div>`;
}

// ===================== MULTI-FLOOR SYSTEM =====================
function defaultFloorName(i) {
  return i === 0 ? 'Lantai 1' : i === 1 ? 'Lantai 2' : i === 2 ? 'Lantai 3' : `Lantai ${i+1}`;
}
function switchFloor(i) {
  if (i < 0 || i >= floors.length || i === currentFloorIndex) return;
  currentFloorIndex = i; syncActive();
  selectedRoom = null; selectedFurnId = null;
  document.getElementById('furnInfobar').classList.remove('show');
  renderFloorTabs(); updateRoomList(); updateStats(); recalcRAB();
  renderSelectedRoomProps(); renderRoofGrid(); if(typeof detectRooms==='function')detectRooms(); if(typeof renderWallPanel==='function')renderWallPanel(); render();
}
function addFloor() {
  if (typeof requireFeature==='function' && !requireFeature('multifloor')) return;
  saveSnapshot();
  const i = floors.length;
  const isRoof = i >= 3;
  floors.push(makeFloor(isRoof ? 'Rooftop' : defaultFloorName(i), isRoof ? 'rooftop' : 'floor'));
  currentFloorIndex = floors.length - 1; syncActive();
  selectedRoom = null;
  renderFloorTabs(); updateRoomList(); updateStats(); recalcRAB(); renderSelectedRoomProps(); renderRoofGrid(); if(typeof detectRooms==='function')detectRooms(); if(typeof renderWallPanel==='function')renderWallPanel(); render();
  showNotif('🏢 ' + activeFloor().name + ' ditambahkan');
}
function duplicateFloor() {
  if (typeof requireFeature==='function' && !requireFeature('multifloor')) return;
  saveSnapshot();
  const src = activeFloor();
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = 'f' + Date.now() + Math.floor(Math.random()*1000);
  copy.name = src.name + ' (copy)';
  // new ids to avoid collisions
  copy.rooms.forEach((r,k)=> r.id = Date.now()+k);
  floors.splice(currentFloorIndex+1, 0, copy);
  currentFloorIndex++; syncActive();
  renderFloorTabs(); updateRoomList(); updateStats(); recalcRAB(); renderRoofGrid(); if(typeof detectRooms==='function')detectRooms(); if(typeof renderWallPanel==='function')renderWallPanel(); render();
  showNotif('⧉ Lantai diduplikat (dengan isi)');
}
function copyFloorLayout() {
  if (typeof requireFeature==='function' && !requireFeature('multifloor')) return;
  // Create a new EMPTY floor that keeps only the room outlines (walls) of the active one as a tracing base
  saveSnapshot();
  const src = activeFloor();
  const nf = makeFloor(defaultFloorName(floors.length), 'floor');
  nf.rooms = src.rooms.map((r,k) => ({ id: Date.now()+k, type: r.type, x:r.x, y:r.y, w:r.w, h:r.h, color:r.color }));
  floors.splice(currentFloorIndex+1, 0, nf);
  currentFloorIndex++; syncActive();
  renderFloorTabs(); updateRoomList(); updateStats(); recalcRAB(); renderRoofGrid(); if(typeof detectRooms==='function')detectRooms(); if(typeof renderWallPanel==='function')renderWallPanel(); render();
  showNotif('⎘ Denah disalin ke lantai baru (tanpa pintu/jendela/furnitur)');
}
function deleteFloor() {
  if (floors.length === 1) { showNotif('⚠️ Minimal harus ada 1 lantai'); return; }
  if (!confirm('Hapus ' + activeFloor().name + '?')) return;
  saveSnapshot();
  floors.splice(currentFloorIndex, 1);
  currentFloorIndex = Math.max(0, currentFloorIndex - 1); syncActive();
  selectedRoom = null;
  renderFloorTabs(); updateRoomList(); updateStats(); recalcRAB(); renderRoofGrid(); if(typeof detectRooms==='function')detectRooms(); if(typeof renderWallPanel==='function')renderWallPanel(); render();
  showNotif('🗑 Lantai dihapus');
}
function renameFloor(i) {
  const name = prompt('Nama lantai:', floors[i].name);
  if (name && name.trim()) { saveSnapshot(); floors[i].name = name.trim(); renderFloorTabs(); renderActiveFloorCard(); renderRoofGrid(); }
}

// ===================== AUTO ALIGNMENT =====================
function alignRooms(mode) {
  if (rooms.length < 2) { showNotif('⚠️ Butuh minimal 2 ruangan'); return; }
  saveSnapshot();
  const b = floorBounds(rooms);
  if (mode === 'left')   rooms.forEach(r => r.x = b.minX);
  if (mode === 'right')  rooms.forEach(r => r.x = b.maxX - r.w);
  if (mode === 'top')    rooms.forEach(r => r.y = b.minY);
  if (mode === 'bottom') rooms.forEach(r => r.y = b.maxY - r.h);
  if (mode === 'cx')     { const c=(b.minX+b.maxX)/2; rooms.forEach(r => r.x = Math.round((c - r.w/2)/GRID)*GRID); }
  if (mode === 'cy')     { const c=(b.minY+b.maxY)/2; rooms.forEach(r => r.y = Math.round((c - r.h/2)/GRID)*GRID); }
  if (mode === 'distH' && rooms.length >= 3) {
    const sorted = [...rooms].sort((a,b2)=>a.x-b2.x);
    const totalW = sorted.reduce((s,r)=>s+r.w,0);
    const gap = (b.maxX - b.minX - totalW) / (sorted.length - 1);
    let x = b.minX;
    sorted.forEach(r => { r.x = Math.round(x/GRID)*GRID; x += r.w + gap; });
  }
  if (mode === 'distV' && rooms.length >= 3) {
    const sorted = [...rooms].sort((a,b2)=>a.y-b2.y);
    const totalH = sorted.reduce((s,r)=>s+r.h,0);
    const gap = (b.maxY - b.minY - totalH) / (sorted.length - 1);
    let y = b.minY;
    sorted.forEach(r => { r.y = Math.round(y/GRID)*GRID; y += r.h + gap; });
  }
  rooms.forEach(r => { r.x = Math.round(r.x/GRID)*GRID; r.y = Math.round(r.y/GRID)*GRID; });
  updateRoomList(); updateStats(); recalcRAB(); render();
  showNotif('📐 Ruangan dirapikan');
}
function renderFloorTabs() {
  const el = document.getElementById('floorTabs');
  el.innerHTML = floors.map((f,i) => {
    const area = f.rooms.reduce((s,r)=>s+(r.w/PX_PER_M)*(r.h/PX_PER_M),0) + (f.detectedRooms||[]).reduce((s,r)=>s+r.area,0);
    const cnt = f.rooms.length + (f.detectedRooms||[]).length;
    return `<div class="floor-tab ${i===currentFloorIndex?'active':''}" onclick="switchFloor(${i})" ondblclick="renameFloor(${i})" title="Klik untuk pilih · dobel-klik untuk ganti nama">
      <span class="ft-name">${f.kind==='rooftop'?'⌂ ':''}${f.name}</span>
      <span class="ft-area">${area.toFixed(0)} m² · ${cnt} rg</span>
    </div>`;
  }).join('');
}
