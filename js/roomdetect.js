// ===================== ROOM AUTO-DETECTION (planar face tracing) =====================
function shoelace(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i+1)%pts.length];
    a += p.x*q.y - q.x*p.y;
  }
  return a/2;
}
function polyCentroid(pts) {
  let cx=0, cy=0, a=0;
  for (let i=0;i<pts.length;i++){ const p=pts[i],q=pts[(i+1)%pts.length]; const cr=p.x*q.y-q.x*p.y; cx+=(p.x+q.x)*cr; cy+=(p.y+q.y)*cr; a+=cr; }
  if (Math.abs(a)<1e-6) { const n=pts.length; return { x:pts.reduce((s,p)=>s+p.x,0)/n, y:pts.reduce((s,p)=>s+p.y,0)/n }; }
  a*=0.5; return { x:cx/(6*a), y:cy/(6*a) };
}
function classifyRoom(m2) {
  if (m2 < 5)  return 'Kamar Mandi';
  if (m2 < 8)  return 'Dapur';
  if (m2 < 14) return 'Kamar Tidur';
  if (m2 < 26) return 'Ruang Tamu';
  return 'Ruang Keluarga';
}
const detectColors = ['#4a9eff','#3ecf8e','#a78bfa','#f472b6','#34d399','#fb923c','#f5a623','#22d3ee'];

function detectRooms() {
  // keep the same array reference that syncActive handed out
  const f = activeFloor();
  f.detectedRooms.length = 0; detectedRooms = f.detectedRooms;
  if (!wallSegs || wallSegs.length < 3) { return; }

  const key = p => Math.round(p.x)+','+Math.round(p.y);
  const nodes = new Map();
  const node = p => { const k=key(p); if(!nodes.has(k)) nodes.set(k,{x:p.x,y:p.y,k,out:[]}); return nodes.get(k); };
  const halfEdges = [];
  wallSegs.forEach(s => {
    const u = node(s.a), v = node(s.b);
    if (u.k === v.k) return;
    const e1 = { from:u, to:v }, e2 = { from:v, to:u };
    e1.twin = e2; e2.twin = e1;
    e1.ang = Math.atan2(v.y-u.y, v.x-u.x);
    e2.ang = Math.atan2(u.y-v.y, u.x-v.x);
    u.out.push(e1); v.out.push(e2);
    halfEdges.push(e1, e2);
  });
  nodes.forEach(n => n.out.sort((a,b)=>a.ang-b.ang));

  const visited = new Set();
  const faces = [];
  halfEdges.forEach(start => {
    if (visited.has(start)) return;
    const loop = []; let e = start, guard = 0;
    do {
      visited.add(e); loop.push(e);
      const arr = e.to.out;
      const idx = arr.indexOf(e.twin);
      e = arr[(idx - 1 + arr.length) % arr.length];   // clockwise-next
    } while (e !== start && ++guard < 5000);
    if (loop.length >= 3) faces.push(loop);
  });

  let idx = 0;
  faces.forEach(loop => {
    const pts = loop.map(e => ({ x:e.from.x, y:e.from.y }));
    const s = shoelace(pts);
    if (s <= 0) return;                       // interior faces only (CW on screen)
    const m2 = s / (PX_PER_M*PX_PER_M);
    if (m2 < 0.8) return;
    detectedRooms.push({ id:'dr'+(idx), name:null, pts, area:m2, type:classifyRoom(m2), centroid:polyCentroid(pts), color:detectColors[idx % detectColors.length] });
    idx++;
  });
}

function floorDetectedArea(f) { return (f.detectedRooms||[]).reduce((s,r)=>s+r.area, 0); }
function floorWallLen(f) { return (f.wallSegs||[]).reduce((s,w)=>s+Math.hypot(w.b.x-w.a.x,w.b.y-w.a.y)/PX_PER_M, 0); }

// ---- render ----
function drawDetectedRooms(invZ) {
  detectedRooms.forEach(r => {
    ctx.save();
    ctx.beginPath();
    r.pts.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();
    ctx.fillStyle = r.color + '18'; ctx.fill();
    // label
    ctx.fillStyle = r.color; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font = `bold ${12*invZ}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillText(r.name || r.type, r.centroid.x, r.centroid.y - 7*invZ);
    ctx.font = `500 ${10*invZ}px 'Space Mono', monospace`;
    ctx.fillStyle = r.color + 'cc';
    ctx.fillText(r.area.toFixed(1)+' m²', r.centroid.x, r.centroid.y + 8*invZ);
    ctx.restore();
  });
}

// ---- panel list (called from wall panel area) ----
function detectedRoomsListHTML() {
  if (!detectedRooms.length) return '';
  return `<div class="panel-title" style="margin-top:12px;">Ruang Terdeteksi</div>` +
    detectedRooms.map((r,i) => `<div class="room-item" onclick="renameDetected(${i})">
      <div class="room-dot" style="background:${r.color}"></div>
      <span class="room-name">${r.name||r.type}</span>
      <span class="room-size">${r.area.toFixed(1)}m²</span></div>`).join('');
}
function renameDetected(i) {
  const r = detectedRooms[i]; if (!r) return;
  const name = prompt('Nama ruang:', r.name || r.type);
  if (name && name.trim()) { r.name = name.trim(); render(); renderWallPanel(); }
}
