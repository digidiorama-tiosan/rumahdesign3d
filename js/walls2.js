// ===================== SMART WALL SYSTEM =====================
const WALL_GRID = 10;        // 0.5 m fine grid for walls
const SNAP_NODE = 13;        // px radius to auto-join existing nodes
let wallThickCm = 15;

function currentWallThick() { return parseFloat(val('wallThick') || 15) || 15; }

// ---- node collection ----
function getWallNodes() {
  const map = new Map();
  wallSegs.forEach(s => {
    [s.a, s.b].forEach(p => { const k = Math.round(p.x)+','+Math.round(p.y); if (!map.has(k)) map.set(k, {x:p.x, y:p.y}); });
  });
  return [...map.values()];
}

// ---- snapping (auto-join + grid + ortho) ----
// snap priority: endpoint > midpoint > intersection > on-segment > grid+ortho
let snapHint = null;   // {x,y,type:'endpoint'|'midpoint'|'intersect'|'segment'|'grid'}
const SNAP_MID = 12, SNAP_INT = 12, SNAP_SEG = 9;

function segIntersections() {
  const segs = wallSegs, out = [];
  for (let i=0;i<segs.length;i++) for (let j=i+1;j<segs.length;j++) {
    const p = lineIntersect(segs[i], segs[j]);
    if (p) out.push(p);
  }
  return out;
}
function lineIntersect(s1, s2) {
  const x1=s1.a.x,y1=s1.a.y,x2=s1.b.x,y2=s1.b.y, x3=s2.a.x,y3=s2.a.y,x4=s2.b.x,y4=s2.b.y;
  const den=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4); if (Math.abs(den)<1e-6) return null;
  const t=((x1-x3)*(y3-y4)-(y1-y3)*(x3-x4))/den, u=((x1-x3)*(y1-y2)-(y1-y3)*(x1-x2))/den;
  if (t<-0.02||t>1.02||u<-0.02||u>1.02) return null;
  return { x:x1+t*(x2-x1), y:y1+t*(y2-y1) };
}
function nearestOnSeg(p, s) {
  const dx=s.b.x-s.a.x, dy=s.b.y-s.a.y, L2=dx*dx+dy*dy; if (!L2) return null;
  let t=((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/L2; t=Math.max(0,Math.min(1,t));
  return { x:s.a.x+t*dx, y:s.a.y+t*dy };
}

function snapWallPoint(p, fromPt) {
  snapHint = null;
  // skala ambang snap agar konstan di layar (mudah di HP: cubit-zoom untuk presisi)
  const Z = (typeof zoomLevel==='number' && zoomLevel>0) ? zoomLevel : 1;
  const nodeR=SNAP_NODE/Z, midR=SNAP_MID/Z, intR=SNAP_INT/Z, segR=SNAP_SEG/Z;
  // 1. endpoint (existing node) — highest priority, enables auto-join
  let best=null, bd=nodeR;
  getWallNodes().forEach(n => { const d=Math.hypot(p.x-n.x,p.y-n.y); if (d<bd){bd=d;best=n;} });
  if (best) { snapHint={x:best.x,y:best.y,type:'endpoint'}; return {x:best.x,y:best.y,joined:true}; }
  // 2. midpoint of a segment
  best=null; bd=midR;
  wallSegs.forEach(s => { const mx=(s.a.x+s.b.x)/2, my=(s.a.y+s.b.y)/2; const d=Math.hypot(p.x-mx,p.y-my); if (d<bd){bd=d;best={x:mx,y:my};} });
  if (best) { snapHint={...best,type:'midpoint'}; return {x:best.x,y:best.y,joined:false}; }
  // 3. intersection of two segments
  best=null; bd=intR;
  segIntersections().forEach(ip => { const d=Math.hypot(p.x-ip.x,p.y-ip.y); if (d<bd){bd=d;best=ip;} });
  if (best) { snapHint={...best,type:'intersect'}; return {x:best.x,y:best.y,joined:false}; }
  // 4. on a segment line
  best=null; bd=segR;
  wallSegs.forEach(s => { const np=nearestOnSeg(p,s); if(!np) return; const d=Math.hypot(p.x-np.x,p.y-np.y); if (d<bd){bd=d;best=np;} });
  if (best) { snapHint={...best,type:'segment'}; return {x:best.x,y:best.y,joined:false}; }
  // 5. grid + ortho
  let x=Math.round(p.x/WALL_GRID)*WALL_GRID, y=Math.round(p.y/WALL_GRID)*WALL_GRID;
  if (fromPt) { if (Math.abs(x-fromPt.x)<=WALL_GRID) x=fromPt.x; if (Math.abs(y-fromPt.y)<=WALL_GRID) y=fromPt.y; }
  snapHint={x,y,type:'grid'};
  return { x, y, joined:false };
}

// ---- drawing polyline ----
function swAddPoint(rawPos) {
  const from = swDraft && swDraft.pts.length ? swDraft.pts[swDraft.pts.length-1] : null;
  const sp = snapWallPoint(rawPos, from);
  if (!swDraft) { swDraft = { pts: [{x:sp.x, y:sp.y}], cursor: {x:sp.x, y:sp.y} }; render(); return; }
  // close-loop: clicking near the start finishes & closes
  const start = swDraft.pts[0];
  if (swDraft.pts.length >= 2 && Math.hypot(sp.x-start.x, sp.y-start.y) < SNAP_NODE) {
    commitSeg(swDraft.pts[swDraft.pts.length-1], start);
    finishDraft();
    return;
  }
  const last = swDraft.pts[swDraft.pts.length-1];
  if (sp.x === last.x && sp.y === last.y) return;   // ignore zero-length
  commitSeg(last, {x:sp.x, y:sp.y});
  swDraft.pts.push({x:sp.x, y:sp.y});
  render();
}
function swMove(rawPos) {
  if (!swDraft) return;
  const from = swDraft.pts[swDraft.pts.length-1];
  const sp = snapWallPoint(rawPos, from);
  swDraft.cursor = {x:sp.x, y:sp.y};
  render();
}
function commitSeg(a, b) {
  if (!swDraft._snapshotted) { saveSnapshot(); swDraft._snapshotted = true; }
  wallSegs.push({ id: Date.now()+Math.floor(Math.random()*1000), a:{x:a.x,y:a.y}, b:{x:b.x,y:b.y}, t: currentWallThick() });
}
function finishDraft() {
  swDraft = null;
  detectRooms();
  renderWallPanel(); updateStats(); recalcRAB(); render();
  showNotif('🧱 Dinding selesai — ruang otomatis terdeteksi');
}
function swCancel() {
  if (swDraft) { swDraft = null; snapHint = null; render(); }
}

// ---- selection / delete ----
function getSegAt(p) {
  let best = null, bd = 10;
  wallSegs.forEach(s => { const d = pointToSegmentDist(p, {x1:s.a.x,y1:s.a.y,x2:s.b.x,y2:s.b.y}); if (d < bd) { bd = d; best = s; } });
  return best;
}
function selectSeg(id) { selectedSegId = id; selectedRoom = null; selectedFurnId = null; selectedMepId = null; render(); }
function deleteSeg(id) {
  saveSnapshot();
  wallSegs = activeFloor().wallSegs = wallSegs.filter(s => s.id !== id);
  // drop seg-based openings on this wall
  activeFloor().doors = doors = doors.filter(d => d.segId !== id);
  activeFloor().windows = windows = windows.filter(w => w.segId !== id);
  if (selectedSegId === id) selectedSegId = null;
  detectRooms(); renderWallPanel(); updateStats(); recalcRAB(); render();
}

// ---- thickness ----
function setWallThickFromInput() {
  const t = currentWallThick();
  if (selectedSegId) { const s = wallSegs.find(x=>x.id===selectedSegId); if (s) { saveSnapshot(); s.t = t; render(); showNotif('Tebal dinding terpilih: '+t+' cm'); } }
}

// ---- render ----
function segThickPx(s) { return Math.max(3, (s.t || 15)/100 * PX_PER_M); }
function renderWalls(invZ) {
  // segments
  wallSegs.forEach(s => {
    const sel = s.id === selectedSegId;
    const w = segThickPx(s);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = sel ? '#f5a623' : '#cfd6e6';
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); ctx.stroke();
    // thin centerline
    ctx.strokeStyle = sel ? '#f5a623' : '#6b7186';
    ctx.lineWidth = invZ;
    ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); ctx.stroke();
    ctx.restore();
  });
  // nodes
  ctx.save();
  getWallNodes().forEach(n => {
    ctx.fillStyle = '#0d0f14'; ctx.strokeStyle = '#8b8fa8'; ctx.lineWidth = 1.4*invZ;
    ctx.beginPath(); ctx.arc(n.x, n.y, 3*invZ, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  });
  ctx.restore();
  // segment length labels
  ctx.save();
  ctx.fillStyle = '#8b8fa8'; ctx.font = `${9*invZ}px 'Space Mono', monospace`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  wallSegs.forEach(s => {
    const len = Math.hypot(s.b.x-s.a.x, s.b.y-s.a.y)/PX_PER_M;
    if (len < 0.4) return;
    const mx=(s.a.x+s.b.x)/2, my=(s.a.y+s.b.y)/2;
    const ang = Math.atan2(s.b.y-s.a.y, s.b.x-s.a.x);
    ctx.save(); ctx.translate(mx, my); ctx.rotate(Math.abs(ang)>Math.PI/2?ang+Math.PI:ang);
    ctx.fillText(len.toFixed(2)+'m', 0, -segThickPx(s)/2 - 6*invZ);
    ctx.restore();
  });
  ctx.restore();
  // draft preview
  if (swDraft) {
    ctx.save();
    ctx.strokeStyle = 'rgba(245,166,35,0.9)'; ctx.lineWidth = 2*invZ; ctx.setLineDash([6*invZ,4*invZ]);
    ctx.beginPath();
    const pts = swDraft.pts;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (swDraft.cursor) ctx.lineTo(swDraft.cursor.x, swDraft.cursor.y);
    ctx.stroke(); ctx.setLineDash([]);
    pts.forEach(p => { ctx.fillStyle='#f5a623'; ctx.beginPath(); ctx.arc(p.x,p.y,3.5*invZ,0,Math.PI*2); ctx.fill(); });
    if (swDraft.cursor && pts.length) {
      const last = pts[pts.length-1];
      const len = Math.hypot(swDraft.cursor.x-last.x, swDraft.cursor.y-last.y)/PX_PER_M;
      ctx.fillStyle='#f5a623'; ctx.font=`bold ${11*invZ}px 'Space Mono', monospace`; ctx.textAlign='center';
      ctx.fillText(len.toFixed(2)+'m', (last.x+swDraft.cursor.x)/2, (last.y+swDraft.cursor.y)/2 - 8*invZ);
    }
    ctx.restore();
    drawSnapIndicator(invZ);
  }
}

// ---- snap indicator (endpoint/midpoint/intersection/segment/grid) ----
const SNAP_STYLE = {
  endpoint:  { c:'#3ecf8e', label:'ENDPOINT' },
  midpoint:  { c:'#4a9eff', label:'MIDPOINT' },
  intersect: { c:'#e8523a', label:'INTERSECTION' },
  segment:   { c:'#a78bfa', label:'ON WALL' },
  grid:      { c:'#8b8fa8', label:'GRID' },
};
function drawSnapIndicator(invZ) {
  if (!snapHint || !swDraft) return;
  const st = SNAP_STYLE[snapHint.type]; if (!st) return;
  const x=snapHint.x, y=snapHint.y, r=7*invZ;
  ctx.save();
  ctx.strokeStyle=st.c; ctx.fillStyle=st.c; ctx.lineWidth=1.8*invZ;
  if (snapHint.type==='endpoint') { ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(x,y,2*invZ,0,Math.PI*2); ctx.fill(); }
  else if (snapHint.type==='midpoint') { ctx.beginPath(); ctx.moveTo(x,y-r); ctx.lineTo(x+r,y+r*0.7); ctx.lineTo(x-r,y+r*0.7); ctx.closePath(); ctx.stroke(); }
  else if (snapHint.type==='intersect') { ctx.beginPath(); ctx.moveTo(x-r,y-r); ctx.lineTo(x+r,y+r); ctx.moveTo(x+r,y-r); ctx.lineTo(x-r,y+r); ctx.stroke(); }
  else if (snapHint.type==='segment') { ctx.strokeRect(x-r*0.7,y-r*0.7,r*1.4,r*1.4); }
  else { ctx.beginPath(); ctx.moveTo(x-r,y); ctx.lineTo(x+r,y); ctx.moveTo(x,y-r); ctx.lineTo(x,y+r); ctx.stroke(); }
  // label badge
  ctx.font=`bold ${8*invZ}px 'Space Mono', monospace`; ctx.textAlign='left'; ctx.textBaseline='middle';
  const tw=ctx.measureText(st.label).width;
  ctx.fillStyle='rgba(13,15,20,0.85)'; ctx.fillRect(x+r+3*invZ, y-6*invZ, tw+8*invZ, 12*invZ);
  ctx.fillStyle=st.c; ctx.fillText(st.label, x+r+7*invZ, y);
  ctx.restore();
}

// ---- panel ----
function renderWallPanel() {
  const el = document.getElementById('wallPanel'); if (!el) return;
  const totLen = wallSegs.reduce((s,w)=>s+Math.hypot(w.b.x-w.a.x,w.b.y-w.a.y)/PX_PER_M, 0);
  el.innerHTML = `
    <div class="panel-title">Smart Wall</div>
    <button class="btn-primary" style="width:100%; padding:9px; margin-bottom:8px;" onclick="setTool('swall')">✏️ Gambar Dinding</button>
    <button class="floor-act" style="width:100%; padding:9px; margin-bottom:8px; border-color:var(--accent); color:var(--accent);" onclick="wallsFromRooms()">🧱 Buat Dinding dari Ruangan</button>
    <button class="floor-act" style="width:100%; padding:9px; margin-bottom:8px; border-color:#3ecf8e; color:#3ecf8e;" onclick="doorsFromWalls()">🚪 Pintu Otomatis</button>
    <div class="wall-stat-row">
      <div class="wall-stat"><span class="ws-k">Segmen</span><span class="ws-v">${wallSegs.length}</span></div>
      <div class="wall-stat"><span class="ws-k">Total Panjang</span><span class="ws-v">${totLen.toFixed(1)} m</span></div>
      <div class="wall-stat"><span class="ws-k">Ruang Terdeteksi</span><span class="ws-v accent">${detectedRooms.length}</span></div>
    </div>
    <div class="prop-row" style="margin-top:8px;">
      <span class="prop-label">Tebal dinding aktif</span>
      <span class="prop-value">${currentWallThick()} cm</span>
    </div>
    <div class="wall-hint">Klik untuk menaruh titik dinding berurutan. Klik titik awal lagi untuk menutup. Dobel-klik / Esc untuk berhenti. Endpoint dekat akan otomatis menyambung (snap).</div>
    ${selectedSegId ? `<button class="floor-act danger" style="width:100%; margin-top:8px;" onclick="deleteSeg(${selectedSegId})">🗑 Hapus Segmen Terpilih</button>` : ''}
    ${wallSegs.length ? `<button class="floor-act" style="width:100%; margin-top:6px;" onclick="clearWalls()">Hapus Semua Dinding</button>` : ''}
    ${typeof detectedRoomsListHTML==='function' ? detectedRoomsListHTML() : ''}`;
}

// ---- Buat dinding otomatis mengikuti ruangan yang sudah ditempatkan ----
function wallsFromRooms() {
  const rms = activeFloor().rooms;
  if (!rms.length) { showNotif('⚠️ Belum ada ruangan untuk dibuatkan dinding'); return; }
  saveSnapshot();
  const t = currentWallThick();
  const rd = v => Math.round(v);
  const key = (a,b) => { const k1=rd(a.x)+','+rd(a.y), k2=rd(b.x)+','+rd(b.y); return k1<k2 ? k1+'|'+k2 : k2+'|'+k1; };
  const seen = new Set();
  // hindari duplikat terhadap dinding yang sudah ada
  wallSegs.forEach(s => seen.add(key(s.a, s.b)));
  const added = [];
  rms.forEach(rm => {
    const c = [{x:rm.x,y:rm.y},{x:rm.x+rm.w,y:rm.y},{x:rm.x+rm.w,y:rm.y+rm.h},{x:rm.x,y:rm.y+rm.h}];
    for (let i=0;i<4;i++) {
      const a=c[i], b=c[(i+1)%4];
      const k=key(a,b);
      if (seen.has(k)) continue;     // dinding bersama hanya dibuat sekali
      seen.add(k);
      added.push({ id: Date.now()+Math.floor(Math.random()*100000)+i, a:{x:a.x,y:a.y}, b:{x:b.x,y:b.y}, t });
    }
  });
  if (!added.length) { showNotif('✓ Dinding sudah sesuai ruangan'); return; }
  activeFloor().wallSegs = wallSegs = wallSegs.concat(added);
  // ruangan persegi tetap jadi sumber utama → jangan buat ruang-deteksi yang menumpuk
  activeFloor().detectedRooms = detectedRooms = [];
  renderWallPanel(); updateStats(); recalcRAB(); render();
  showNotif('🧱 ' + added.length + ' dinding dibuat mengikuti ruangan');
}

// ---- Pintu otomatis: taruh 1 pintu per ruangan pada dinding yang cocok ----
function doorsFromWalls() {
  const f = activeFloor();
  if (!f.wallSegs || !f.wallSegs.length) { showNotif('⚠️ Pasang/buat dinding dulu sebelum pintu otomatis'); return; }
  if (!f.rooms.length) { showNotif('⚠️ Belum ada ruangan'); return; }
  saveSnapshot();
  const rd = v => Math.round(v);
  const segKey = (a,b) => { const k1=rd(a.x)+','+rd(a.y), k2=rd(b.x)+','+rd(b.y); return k1<k2 ? k1+'|'+k2 : k2+'|'+k1; };
  const segByKey = {}; f.wallSegs.forEach(s => { segByKey[segKey(s.a,s.b)] = s; });
  const usedSeg = new Set();
  f.doors.forEach(d => { if (d.segId != null) usedSeg.add(d.segId); });
  let added = 0;
  f.rooms.forEach(rm => {
    const c = [{x:rm.x,y:rm.y},{x:rm.x+rm.w,y:rm.y},{x:rm.x+rm.w,y:rm.y+rm.h},{x:rm.x,y:rm.y+rm.h}];
    // prioritas tepi: selatan (depan) → utara → timur → barat
    const edges = [
      {a:c[3], b:c[2], len:rm.w}, {a:c[0], b:c[1], len:rm.w},
      {a:c[1], b:c[2], len:rm.h}, {a:c[3], b:c[0], len:rm.h},
    ];
    // jika ruangan ini sudah punya pintu di salah satu dindingnya → lewati (hindari dobel saat dijalankan ulang)
    const alreadyHasDoor = edges.some(e => { const s = segByKey[segKey(e.a, e.b)]; return s && usedSeg.has(s.id); });
    if (alreadyHasDoor) return;
    const width = rm.type==='Garasi' ? 2.4 : (rm.type==='Kamar Mandi' ? 0.7 : 0.9);
    for (const e of edges) {
      const s = segByKey[segKey(e.a, e.b)];
      if (s && !usedSeg.has(s.id) && (e.len/PX_PER_M) >= width + 0.3) {
        f.doors.push({ id: Date.now()+Math.random(), segId: s.id, pos: 0.5, width });
        usedSeg.add(s.id); added++; break;
      }
    }
  });
  if (!added) { showNotif('✓ Pintu sudah terpasang / tidak ada dinding yang cocok'); return; }
  doors = f.doors; updateStats(); recalcRAB(); render();
  showNotif('🚪 ' + added + ' pintu otomatis ditambahkan');
}

function clearWalls() {
  if (!confirm('Hapus semua dinding & ruang terdeteksi di lantai ini?')) return;
  saveSnapshot();
  activeFloor().wallSegs = wallSegs = [];
  activeFloor().detectedRooms = detectedRooms = [];
  activeFloor().doors = doors = doors.filter(d => !d.segId);
  activeFloor().windows = windows = windows.filter(w => !w.segId);
  selectedSegId = null;
  renderWallPanel(); updateStats(); recalcRAB(); render();
}
