// ===================== THREE.JS 3D ENGINE =====================
let threeRenderer = null, threeScene = null, threeCamera = null, threeAnimFrame = null;
let orbitState = { isOrbiting:false, isPanning:false, lastX:0, lastY:0, theta:45, phi:58, radius:22, targetX:0, targetZ:0 };
let furnMeshes = [];                 // furniture meshes for interior pick/drag (tagged userData.fid)
let interiorSelFid = null;           // currently selected furniture in interior mode
let wireframeMode = false, showRoof = true, showAllFloors = true;
let showEnv = true;                 // outdoor environment (grass, trees, road…)
let nav3dMode = 'orbit';            // 'orbit' | 'walk'
let walkState = { yaw:0, pitch:0, targetYaw:0, targetPitch:0, keys:{}, vel:{x:0,z:0}, speed:3.6, eyeY:1.6 };
let walkCollide = [];
const WALK_RADIUS = 0.3;
let threeObjects = [];
const SCALE = 1 / PX_PER_M;

// ===================== PROCEDURAL TEXTURES & PBR MATERIALS =====================
const _texCanvas = {};
function _canvas(key, draw) {
  if (_texCanvas[key]) return _texCanvas[key];
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  draw(c.getContext('2d'), 256);
  _texCanvas[key] = c; return c;
}
function tex(key, rx, ry) {
  const drawFns = {
    plaster(g,S){ g.fillStyle='#efe7d8'; g.fillRect(0,0,S,S); for(let i=0;i<2600;i++){ const v=200+Math.random()*55; g.fillStyle=`rgba(${v|0},${(v-8)|0},${(v-22)|0},0.05)`; g.fillRect(Math.random()*S,Math.random()*S,2,2);} },
    tile(g,S){ const t=S/4; g.fillStyle='#dad7cf'; g.fillRect(0,0,S,S); for(let x=0;x<4;x++)for(let y=0;y<4;y++){ const sh=236+Math.random()*12; g.fillStyle=`rgb(${sh|0},${(sh-3)|0},${(sh-10)|0})`; g.fillRect(x*t+1.5,y*t+1.5,t-3,t-3);} g.strokeStyle='rgba(150,145,135,0.5)'; g.lineWidth=2; for(let i=0;i<=4;i++){ g.beginPath();g.moveTo(i*t,0);g.lineTo(i*t,S);g.stroke(); g.beginPath();g.moveTo(0,i*t);g.lineTo(S,i*t);g.stroke(); } },
    wood(g,S){ g.fillStyle='#b58a55'; g.fillRect(0,0,S,S); for(let p=0;p<6;p++){ g.fillStyle=`rgba(${120+Math.random()*40|0},${80+Math.random()*30|0},${40+Math.random()*20|0},0.5)`; g.fillRect(0,p*S/6,S,S/6-2); } for(let i=0;i<200;i++){ g.strokeStyle=`rgba(90,60,30,0.08)`; g.beginPath(); const y=Math.random()*S; g.moveTo(0,y); g.bezierCurveTo(S/3,y+Math.random()*6-3,2*S/3,y+Math.random()*6-3,S,y); g.stroke(); } },
    roof(g,S){ g.fillStyle='#9c4a2a'; g.fillRect(0,0,S,S); const rh=S/8; for(let r=0;r<8;r++){ const base=150+Math.random()*20; for(let c=0;c<10;c++){ g.fillStyle=`rgb(${(base+Math.random()*25)|0},${(70+Math.random()*15)|0},${(40+Math.random()*10)|0})`; g.beginPath(); g.moveTo(c*S/10, r*rh+rh); g.lineTo(c*S/10+S/10, r*rh+rh); g.lineTo(c*S/10+S/10, r*rh+2); g.lineTo(c*S/10, r*rh+2); g.fill(); } g.strokeStyle='rgba(60,25,12,0.5)'; g.lineWidth=2; g.beginPath(); g.moveTo(0,r*rh); g.lineTo(S,r*rh); g.stroke(); } },
    grass(g,S){ g.fillStyle='#5f8f44'; g.fillRect(0,0,S,S); for(let i=0;i<5000;i++){ const v=Math.random(); g.fillStyle=v>0.5?`rgba(${90+Math.random()*40|0},${130+Math.random()*50|0},${60+Math.random()*30|0},0.5)`:`rgba(60,90,40,0.4)`; g.fillRect(Math.random()*S,Math.random()*S,2,3);} }
  };
  const cv = _canvas(key, drawFns[key]);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx||1, ry||1);
  t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  return t;
}
function matWall(tint) {
  const m = new THREE.MeshStandardMaterial({ color: tint||0xf2ece0, roughness:0.95, metalness:0.0, wireframe:wireframeMode });
  if (!wireframeMode) m.map = tex('plaster', 2, 2);
  return m;
}
function matFloor(wm, dm, tintHex) {
  const m = new THREE.MeshStandardMaterial({ color: tintHex||0xffffff, roughness:0.55, metalness:0.02, wireframe:wireframeMode });
  if (!wireframeMode) m.map = tex('tile', Math.max(1,wm*1.5), Math.max(1,dm*1.5));
  return m;
}
function matRoof(sx, sz) {
  const m = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.85, metalness:0.0, side:THREE.DoubleSide, wireframe:wireframeMode });
  if (!wireframeMode) m.map = tex('roof', Math.max(1,sx*0.6), Math.max(1,sz*0.6));
  return m;
}

function hasGeometry() { return floors.some(f => f.rooms.length > 0 || (f.wallSegs && f.wallSegs.length > 0)); }
function open3DModal() {
  if (!hasGeometry()) { showNotif('⚠️ Tambah ruangan / dinding dulu untuk preview 3D!'); return; }
  if (typeof interiorState !== 'undefined') interiorState.active = false;
  const ip = document.getElementById('interiorPanel'); if (ip) ip.style.display = 'none';
  document.getElementById('modal3d').classList.remove('interior-mode');
  document.getElementById('modal3d').classList.add('show');
  setTimeout(init3DScene, 120);
}
function close3DModal() { if (nav3dMode==='walk') exitWalkMode(); document.getElementById('modal3d').classList.remove('show'); dispose3DScene(); }
function dispose3DScene() {
  if (threeAnimFrame) { cancelAnimationFrame(threeAnimFrame); threeAnimFrame = null; }
  if (threeRenderer) { threeRenderer.dispose(); const c = document.getElementById('three-canvas-container'); if (c) c.innerHTML=''; threeRenderer = null; }
  threeScene = null; threeCamera = null;
}

function init3DScene() {
  dispose3DScene();
  document.getElementById('view3d-loading').style.display = 'flex';
  const container = document.getElementById('three-canvas-container');
  const W = container.clientWidth, H = container.clientHeight;

  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(0x0d0f14);
  threeScene.fog = new THREE.Fog(0x0d0f14, 40, 110);

  threeCamera = new THREE.PerspectiveCamera(45, W/H, 0.1, 400);

  threeRenderer = new THREE.WebGLRenderer({ antialias:true, preserveDrawingBuffer:true });
  threeRenderer.setSize(W, H); threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  threeRenderer.shadowMap.enabled = true; threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  threeRenderer.outputEncoding = THREE.sRGBEncoding;
  threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  threeRenderer.toneMappingExposure = 1.05;
  container.appendChild(threeRenderer.domElement);

  const amb = new THREE.AmbientLight(0xffffff, showEnv ? 0.32 : 0.4); threeScene.add(amb);
  // Sun direction driven by North orientation (tropical planning)
  const sunAz = (northAngle + 135) * Math.PI/180;
  const sun = new THREE.DirectionalLight(0xfff4e2, showEnv ? 2.7 : 2.2);
  sun.position.set(Math.sin(sunAz)*22, 28, Math.cos(sunAz)*22);
  sun.castShadow = true; sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.near=0.5; sun.shadow.camera.far=140;
  sun.shadow.camera.left=-40; sun.shadow.camera.right=40; sun.shadow.camera.top=40; sun.shadow.camera.bottom=-40;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  threeScene.add(sun);
  const fill = new THREE.DirectionalLight(0x88a6d8, 0.5); fill.position.set(-14, 12, -10); threeScene.add(fill);
  const hemi = new THREE.HemisphereLight(showEnv?0xbcd8ff:0x556070, showEnv?0x5a7048:0x202430, showEnv?0.95:0.7); threeScene.add(hemi);
  threeScene.userData.lights = { amb, sun, fill, hemi };

  if (showEnv) {
    threeScene.background = makeSkyTexture();
    threeScene.fog = new THREE.Fog(0xcfe3f5, 55, 150);
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(240,240), new THREE.MeshStandardMaterial({ map: tex('grass', 60, 60), roughness:1, metalness:0 }));
    grass.rotation.x = -Math.PI/2; grass.position.y = -0.02; grass.receiveShadow = true; threeScene.add(grass);
  } else {
    threeScene.background = new THREE.Color(0x0d0f14);
    threeScene.fog = new THREE.Fog(0x0d0f14, 40, 110);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120,120), new THREE.MeshLambertMaterial({ color:0x0a0c10 }));
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; threeScene.add(ground);
    const grid = new THREE.GridHelper(100, 50, 0x1a1d2e, 0x1a1d2e); grid.position.y = 0.01; threeScene.add(grid);
  }

  buildNorthArrow();
  build3DScene();
  if (typeof applyInteriorLighting === 'function') applyInteriorLighting();

  threeRenderer.domElement.addEventListener('mousedown', on3DMouseDown);
  threeRenderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('mousemove', on3DMouseMove);
  window.addEventListener('mouseup', on3DMouseUp);
  threeRenderer.domElement.addEventListener('wheel', on3DWheel, { passive:false });
  // --- TOUCH (HP / tablet): 1 jari = orbit/look, 2 jari = cubit zoom + geser ---
  threeRenderer.domElement.addEventListener('touchstart', on3DTouchStart, { passive:false });
  threeRenderer.domElement.addEventListener('touchmove', on3DTouchMove, { passive:false });
  threeRenderer.domElement.addEventListener('touchend', on3DTouchEnd, { passive:false });
  threeRenderer.domElement.addEventListener('touchcancel', on3DTouchEnd, { passive:false });

  document.getElementById('view3d-loading').style.display = 'none';
  let _last = performance.now();
  (function animate(){
    threeAnimFrame = requestAnimationFrame(animate);
    const now = performance.now(); const dt = Math.min(0.05, (now-_last)/1000); _last = now;
    if (nav3dMode === 'walk') updateWalk(dt);
    threeRenderer.render(threeScene, threeCamera);
  })();
}

function makeSkyTexture() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 256;
  const g = c.getContext('2d'); const grd = g.createLinearGradient(0,0,0,256);
  grd.addColorStop(0, '#5fa8e8'); grd.addColorStop(0.55, '#a9d3f2'); grd.addColorStop(1, '#e8f3fb');
  g.fillStyle = grd; g.fillRect(0,0,16,256);
  const t = new THREE.CanvasTexture(c); return t;
}

// scene-center reference
let sceneCenter = { cx:0, cz:0 };
function computeCenter() {
  const list = showAllFloors ? floors : [activeFloor()];
  let xs=[], ys=[];
  list.forEach(f => {
    f.rooms.forEach(r => { xs.push(r.x, r.x+r.w); ys.push(r.y, r.y+r.h); });
    (f.wallSegs||[]).forEach(s => { xs.push(s.a.x, s.b.x); ys.push(s.a.y, s.b.y); });
  });
  if (!xs.length) { sceneCenter = {cx:0,cz:0}; return; }
  sceneCenter.cx = (Math.min(...xs)+Math.max(...xs))/2*SCALE;
  sceneCenter.cz = (Math.min(...ys)+Math.max(...ys))/2*SCALE;
}

function build3DScene() {
  threeObjects.forEach(o => threeScene.remove(o)); threeObjects = [];
  furnMeshes = [];
  const WALL_H = parseFloat(val('wallHeight')||3);
  const WALL_T = 0.15;
  computeCenter();
  orbitState.targetX = sceneCenter.cx; orbitState.targetZ = sceneCenter.cz; updateCameraPosition();

  const floorList = showAllFloors ? floors : [{ ...activeFloor(), _index:currentFloorIndex }];
  const indices = showAllFloors ? floors.map((_,i)=>i) : [currentFloorIndex];

  indices.forEach((fi, k) => {
    const f = floors[fi];
    const baseY = (showAllFloors ? fi : 0) * WALL_H;
    buildFloor3D(f, baseY, WALL_H, WALL_T);
  });

  // Roof on top floor only
  if (showRoof) {
    const topIdx = floors.length - 1;
    const topF = floors[topIdx];
    const topBaseY = (showAllFloors ? topIdx : 0) * WALL_H + WALL_H;
    if (topF.roofType && topF.roofType !== 'none' && (topF.rooms.length || (topF.wallSegs && topF.wallSegs.length))) {
      buildRoof(topF, topBaseY);
    }
  }

  if (showEnv) buildEnvironment(WALL_H);
}

// ===================== OUTDOOR ENVIRONMENT =====================
function buildEnvironment(WALL_H) {
  const S = SCALE;
  // ---- land plot (from site plan) ----
  let lx, lz, lw, ld;
  if (siteplan.enabled) {
    lx = siteplan.originX*S - sceneCenter.cx; lz = siteplan.originY*S - sceneCenter.cz;
    lw = siteplan.landW; ld = siteplan.landH;
  } else {
    const b = sceneBoundsWorld();
    lx = b.minX - 3; lz = b.minZ - 3; lw = (b.maxX-b.minX)+6; ld = (b.maxZ-b.minZ)+6;
  }
  // plot pad (lighter grass / paving)
  const plot = new THREE.Mesh(new THREE.PlaneGeometry(lw, ld), new THREE.MeshStandardMaterial({ map: tex('grass', Math.max(2,lw/2), Math.max(2,ld/2)), color:0xd8f0c0, roughness:1 }));
  plot.rotation.x = -Math.PI/2; plot.position.set(lx+lw/2, 0.005, lz+ld/2); plot.receiveShadow = true; add(plot);

  // ---- road + sidewalk in front (south / +z edge) ----
  const roadZ = lz + ld + 2.2;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(lw+24, 5), new THREE.MeshLambertMaterial({ color:0x3b3f47 }));
  road.rotation.x = -Math.PI/2; road.position.set(lx+lw/2, 0.004, roadZ+2.5); add(road);
  const walkw = new THREE.Mesh(new THREE.PlaneGeometry(lw+24, 1.6), new THREE.MeshLambertMaterial({ color:0x8b9099 }));
  walkw.rotation.x = -Math.PI/2; walkw.position.set(lx+lw/2, 0.006, lz+ld+0.8); add(walkw);
  // road center dashes
  for (let i=-Math.floor((lw+20)/2); i<(lw+20)/2; i+=2.2) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.1,0.18), new THREE.MeshBasicMaterial({ color:0xd9c14a }));
    dash.rotation.x = -Math.PI/2; dash.position.set(lx+lw/2 + i, 0.008, roadZ+2.5); add(dash);
  }

  // ---- fence around the plot (skip the front-center gate) ----
  buildFence(lx, lz, lw, ld);

  // ---- trees & bushes around the perimeter ----
  const treeSpots = [
    [lx+0.8, lz+0.8],[lx+lw-0.8, lz+0.8],[lx+0.8, lz+ld-0.8],[lx+lw-0.8, lz+ld-0.8],
    [lx+lw*0.5, lz+0.7],[lx+0.8, lz+ld*0.5],[lx+lw-0.8, lz+ld*0.5]
  ];
  treeSpots.forEach((p,i)=> { if (i%2===0) buildTree(p[0],p[1], 1+(i%3)*0.25); else buildBush(p[0],p[1]); });
  // street trees
  buildTree(lx-1.5, roadZ+0.5, 1.3); buildTree(lx+lw+1.5, roadZ+0.5, 1.3);

  // ---- site zones in 3D: carport car, garden, pool ----
  (siteplan.zones||[]).forEach(z => {
    const zx = z.x*S - sceneCenter.cx, zz = z.y*S - sceneCenter.cz, zw = z.w*S, zd = z.h*S;
    if (z.type === 'pool') {
      const water = new THREE.Mesh(new THREE.BoxGeometry(zw, 0.3, zd), new THREE.MeshPhongMaterial({ color:0x1c93c4, shininess:90, transparent:true, opacity:0.85 }));
      water.position.set(zx+zw/2, 0.16, zz+zd/2); add(water);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(zw+0.4,0.12,zd+0.4), new THREE.MeshLambertMaterial({ color:0xd8d2c4 }));
      lip.position.set(zx+zw/2,0.06,zz+zd/2); add(lip);
    } else if (z.type === 'garden') {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(zw,zd), new THREE.MeshLambertMaterial({ color:0x4e8a3a }));
      g.rotation.x=-Math.PI/2; g.position.set(zx+zw/2,0.01,zz+zd/2); add(g);
      buildBush(zx+zw*0.3, zz+zd*0.4); buildBush(zx+zw*0.7, zz+zd*0.6); buildTree(zx+zw*0.5, zz+zd*0.5, 0.8);
    } else if (z.type === 'carport') {
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(zw,zd), new THREE.MeshLambertMaterial({ color:0x9a9a9a }));
      pad.rotation.x=-Math.PI/2; pad.position.set(zx+zw/2,0.012,zz+zd/2); add(pad);
      buildCar(zx+zw/2, zz+zd/2, Math.min(zw,zd));
    }
  });
}

function sceneBoundsWorld() {
  const list = showAllFloors ? floors : [activeFloor()];
  let xs=[], zs=[];
  list.forEach(f => {
    f.rooms.forEach(r => { xs.push(r.x*SCALE-sceneCenter.cx, (r.x+r.w)*SCALE-sceneCenter.cx); zs.push(r.y*SCALE-sceneCenter.cz, (r.y+r.h)*SCALE-sceneCenter.cz); });
    (f.wallSegs||[]).forEach(s => { xs.push(s.a.x*SCALE-sceneCenter.cx, s.b.x*SCALE-sceneCenter.cx); zs.push(s.a.y*SCALE-sceneCenter.cz, s.b.y*SCALE-sceneCenter.cz); });
  });
  if (!xs.length) return { minX:-5, maxX:5, minZ:-5, maxZ:5 };
  return { minX:Math.min(...xs), maxX:Math.max(...xs), minZ:Math.min(...zs), maxZ:Math.max(...zs) };
}

function buildTree(x, z, scale) {
  scale = scale || 1;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12*scale,0.16*scale,1.1*scale,6), new THREE.MeshLambertMaterial({ color:0x6b4a2b }));
  trunk.position.set(x, 0.55*scale, z); trunk.castShadow=true; add(trunk);
  const greens = [0x3f7a35, 0x4d9140, 0x356b2d];
  for (let i=0;i<3;i++){
    const f = new THREE.Mesh(new THREE.SphereGeometry((0.8-i*0.15)*scale, 7,6), new THREE.MeshLambertMaterial({ color:greens[i%3] }));
    f.position.set(x + (i-1)*0.18*scale, (1.2+i*0.45)*scale, z + (i%2?0.15:-0.1)*scale); f.castShadow=true; add(f);
  }
}
function buildBush(x, z) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 7,6), new THREE.MeshLambertMaterial({ color:0x4a8838 }));
  b.position.set(x, 0.35, z); b.scale.y = 0.8; b.castShadow=true; add(b);
}
function buildFence(lx, lz, lw, ld) {
  const mat = new THREE.MeshLambertMaterial({ color:0xcfc9bb });
  const postH = 1.1, postGeo = new THREE.BoxGeometry(0.12, postH, 0.12);
  const railGeo = h => new THREE.BoxGeometry(0.06, 0.06, 1);
  function side(x0,z0,x1,z1, gateGap) {
    const len = Math.hypot(x1-x0, z1-z0); const n = Math.max(2, Math.round(len));
    for (let i=0;i<=n;i++){
      const t=i/n; const x=x0+(x1-x0)*t, z=z0+(z1-z0)*t;
      if (gateGap && t>0.4 && t<0.6) continue;
      const p = new THREE.Mesh(postGeo, mat); p.position.set(x, postH/2, z); add(p);
    }
  }
  side(lx,lz, lx+lw,lz, false);            // back
  side(lx,lz+ld, lx+lw,lz+ld, true);       // front (gate gap)
  side(lx,lz, lx,lz+ld, false);            // left
  side(lx+lw,lz, lx+lw,lz+ld, false);      // right
}
function buildCar(x, z, room) {
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7,0.55,3.8), new THREE.MeshPhongMaterial({ color:0xb23b3b, shininess:60 }));
  body.position.set(x,0.55,z); body.castShadow=true; add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5,0.5,1.9), new THREE.MeshPhongMaterial({ color:0x2a2f3a, shininess:80 }));
  cabin.position.set(x,1.0,z-0.1); add(cabin);
  [[-0.85,1.2],[0.85,1.2],[-0.85,-1.2],[0.85,-1.2]].forEach(([dx,dz])=>{
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,0.2,12), new THREE.MeshLambertMaterial({ color:0x111316 }));
    w.rotation.z = Math.PI/2; w.position.set(x+dx, 0.32, z+dz); add(w);
  });
}

function add(mesh) { threeScene.add(mesh); threeObjects.push(mesh); }

function buildFloor3D(f, baseY, WALL_H, WALL_T) {
  f.rooms.forEach(r => {
    const x = r.x*SCALE - sceneCenter.cx, z = r.y*SCALE - sceneCenter.cz;
    const w = r.w*SCALE, d = r.h*SCALE;
    // Floor slab (tiled, faint room tint) — interior override via r.iFloor
    const floorHex = r.iFloor ? new THREE.Color(r.iFloor).getHex()
      : new THREE.Color(r.color).lerp(new THREE.Color(0xffffff), 0.75).getHex();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w-WALL_T*2, 0.08, d-WALL_T*2),
      matFloor(w, d, floorHex));
    slab.position.set(x+w/2, baseY+0.04, z+d/2); slab.receiveShadow = true; add(slab);

    // Painted-plaster walls (neutral for realism); interior override via r.iWall
    const wallHex = r.iWall ? new THREE.Color(r.iWall).getHex() : 0xf2ece0;
    const wallHexDark = r.iWall ? new THREE.Color(r.iWall).multiplyScalar(0.93).getHex() : 0xe7e0d2;
    const wallMat = matWall(wallHex);
    const wallMatDark = matWall(wallHexDark);
    ['n','s'].forEach(e => buildWall(f, r, e, x, z, w, d, baseY, WALL_H, WALL_T, wallMat));
    ['w','e'].forEach(e => buildWall(f, r, e, x, z, w, d, baseY, WALL_H, WALL_T, wallMatDark));
    addLabel(r.type, x+w/2, baseY+WALL_H+0.35, z+d/2, r.color);
    // Interior ceiling (only inside walk-tour so it doesn't block orbit-from-above)
    if (typeof interiorState !== 'undefined' && interiorState.active && nav3dMode==='walk') {
      const ceilHex = r.iCeil ? new THREE.Color(r.iCeil).getHex() : 0xf6f3ec;
      const ceil = new THREE.Mesh(new THREE.BoxGeometry(w-WALL_T*2, 0.06, d-WALL_T*2),
        new THREE.MeshStandardMaterial({ color: ceilHex, roughness:0.95 }));
      ceil.position.set(x+w/2, baseY+WALL_H-0.03, z+d/2); add(ceil);
    }
    // Interior ceiling lamp (point light) when interior active
    if (typeof interiorState !== 'undefined' && interiorState.active && r.iLamp) {
      const lamp = new THREE.PointLight(0xffe7bd, 0.9, Math.max(w,d)*1.6, 2);
      lamp.position.set(x+w/2, baseY+WALL_H-0.4, z+d/2); add(lamp);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09,8,8), new THREE.MeshBasicMaterial({ color:0xfff1cf }));
      bulb.position.copy(lamp.position); add(bulb);
    }
  });
  // Furniture
  f.furnitures.forEach(ft => {
    const fx = ft.x*SCALE - sceneCenter.cx, fz = ft.y*SCALE - sceneCenter.cz;
    const fw = ft.w*SCALE, fh = ft.h*SCALE;
    const def = FURN_LIB.find(fl => fl.id === ft.defId);
    // ---- TANGGA: bangun anak tangga naik setinggi 1 lantai ----
    if (ft.defId === 'tangga') {
      const grp = new THREE.Group();
      const runLen = fh;                 // panjang tangga (arah naik) di denah
      const widthX = fw;                 // lebar tangga
      const N = Math.max(8, Math.round(WALL_H / 0.18));
      const rise = WALL_H / N, depth = runLen / N;
      const stepMat = new THREE.MeshStandardMaterial({ color:new THREE.Color(ft.color||'#9aa0aa'), roughness:0.9 });
      for (let i=0;i<N;i++){
        const h=(i+1)*rise;
        const step=new THREE.Mesh(new THREE.BoxGeometry(widthX, h, depth), stepMat);
        step.position.set(0, baseY + h/2, -runLen/2 + depth*(i+0.5));
        step.castShadow=true; step.receiveShadow=true; grp.add(step);
      }
      grp.position.set(fx+fw/2, 0, fz+fh/2);
      grp.rotation.y = -ft.rotation*Math.PI/180;
      add(grp);
      return;
    }
    const hM = Math.max(0.05, def && def.hz ? def.hz : (def ? def.h * 0.6 : 0.6));
    const sel = (interiorSelFid===ft.fid);
    const m = new THREE.Mesh(new THREE.BoxGeometry(ft.rotation%180===0?fw:fh, hM, ft.rotation%180===0?fh:fw),
      new THREE.MeshStandardMaterial({ color:new THREE.Color(ft.color||'#8a7a66'), roughness:0.7, metalness:0.05, wireframe:wireframeMode, emissive: sel?0x3a2c0a:0x000000 }));
    m.position.set(fx+fw/2, baseY+hM/2+0.08, fz+fh/2); m.castShadow = true; m.receiveShadow = true;
    m.userData.fid = ft.fid; furnMeshes.push(m); add(m);
  });
  // Smart walls (wall-based geometry: L / U / T / polygon)
  buildSmartWalls3D(f, baseY, WALL_H);
}

// Build extruded smart-wall segments with door/window openings cut out
function buildSmartWalls3D(f, baseY, WALL_H) {
  const segs = f.wallSegs || [];
  if (!segs.length) return;
  // detected-room floor slabs
  (f.detectedRooms||[]).forEach(r => {
    const shape = new THREE.Shape();
    r.pts.forEach((p,i) => { const px=p.x*SCALE-sceneCenter.cx, pz=p.y*SCALE-sceneCenter.cz; i?shape.lineTo(px,pz):shape.moveTo(px,pz); });
    const g = new THREE.ShapeGeometry(shape);
    const fm = matFloor(Math.sqrt(r.area), Math.sqrt(r.area), new THREE.Color(r.color).lerp(new THREE.Color(0xffffff),0.75).getHex());
    fm.side = THREE.DoubleSide;
    const m = new THREE.Mesh(g, fm);
    m.rotation.x = Math.PI/2; m.position.y = baseY+0.04; m.receiveShadow = true; add(m);
  });
  const mat = matWall(0xf2ece0);
  const matNeutral = matWall(0xeae3d5);
  segs.forEach(s => {
    const ax=s.a.x*SCALE-sceneCenter.cx, az=s.a.y*SCALE-sceneCenter.cz;
    const bx=s.b.x*SCALE-sceneCenter.cx, bz=s.b.y*SCALE-sceneCenter.cz;
    const dx=bx-ax, dz=bz-az, L=Math.hypot(dx,dz); if (L<0.01) return;
    const t=(s.t||15)/100;
    // collect openings on this seg, sorted
    const ops = [];
    f.doors.filter(o=>o.segId===s.id).forEach(o=>ops.push({t:o.pos, w:o.width, type:'door'}));
    f.windows.filter(o=>o.segId===s.id).forEach(o=>ops.push({t:o.pos, w:o.width, type:'window'}));
    ops.sort((p,q)=>p.t-q.t);
    const ang = Math.atan2(dz, dx);
    const DOOR_H=Math.min(WALL_H*0.78,2.1), WIN_SILL=0.9, WIN_H=1.2;
    const piece = (s0,s1,y0,y1) => {
      const segLen=(s1-s0)*L; if (segLen<0.02) return; const h=y1-y0; if (h<0.02) return;
      const g=new THREE.BoxGeometry(segLen, h, t);
      const m=new THREE.Mesh(g, matNeutral.clone());
      if (m.material.map) { m.material.map = tex('plaster', Math.max(1,segLen*0.5), Math.max(1,h*0.5)); }
      const midT=(s0+s1)/2;
      const cx=ax+dx*midT, cz=az+dz*midT;
      m.position.set(cx, baseY+y0+h/2, cz); m.rotation.y=-ang; m.castShadow=true; m.receiveShadow=true; add(m);
    };
    if (!ops.length) { piece(0,1,0,WALL_H); return; }
    let cur=0;
    ops.forEach(op=>{
      const half=(op.w)/(L)/2;   // op width in fraction of segment
      const a0=op.t-half, a1=op.t+half;
      if (a0>cur+0.001) piece(cur,a0,0,WALL_H);
      if (op.type==='door') piece(a0,a1,DOOR_H,WALL_H);
      else { piece(a0,a1,0,WIN_SILL); piece(a0,a1,WIN_SILL+WIN_H,WALL_H); }
      cur=a1;
    });
    if (cur<0.999) piece(cur,1,0,WALL_H);
  });
}

function buildWall(f, r, edge, x, z, w, d, baseY, WALL_H, WALL_T, mat) {
  let len, wx, wz, isNS;
  if (edge==='n') { len=w; wx=x; wz=z; isNS=true; }
  else if (edge==='s') { len=w; wx=x; wz=z+d; isNS=true; }
  else if (edge==='w') { len=d; wx=x; wz=z; isNS=false; }
  else { len=d; wx=x+w; wz=z; isNS=false; }

  const od = f.doors.filter(o=>o.roomId===r.id && o.edge===edge).map(o=>({t:o.pos, w:o.width*SCALE*PX_PER_M, type:'door'}));
  const ow = f.windows.filter(o=>o.roomId===r.id && o.edge===edge).map(o=>({t:o.pos, w:o.width*SCALE*PX_PER_M, type:'window'}));
  const openings = [...od, ...ow].sort((a,b)=>a.t-b.t);

  function seg(s,e,yOff,yTop) {
    const segLen=e-s; if (segLen<0.01) return;
    const segH = yTop-yOff;
    const g = new THREE.BoxGeometry(isNS?segLen:WALL_T, segH, isNS?WALL_T:segLen);
    const m = new THREE.Mesh(g, mat);
    const mid = s+segLen/2;
    m.position.set(isNS?wx+mid:wx, baseY+yOff+segH/2, isNS?wz:wz+mid);
    m.castShadow=true; m.receiveShadow=true; add(m);
  }
  if (!openings.length) { seg(0,len,0,WALL_H); return; }
  const DOOR_H=Math.min(WALL_H*0.78,2.1), WIN_SILL=0.9, WIN_H=1.2;
  let cur=0;
  openings.forEach(op=>{
    const a=op.t*len-op.w/2, b=op.t*len+op.w/2;
    if (a>cur+0.01) seg(cur,a,0,WALL_H);
    if (op.type==='door') seg(a,b,DOOR_H,WALL_H);
    else { seg(a,b,0,WIN_SILL); seg(a,b,WIN_SILL+WIN_H,WALL_H); }
    cur=b;
  });
  if (cur<len-0.01) seg(cur,len,0,WALL_H);
}

function addLabel(text, x, y, z, color) {
  const c = document.createElement('canvas'); c.width=256; c.height=64;
  const cx = c.getContext('2d'); cx.fillStyle=color; cx.font='bold 22px Plus Jakarta Sans, sans-serif';
  cx.textAlign='center'; cx.textBaseline='middle'; cx.shadowColor='rgba(0,0,0,0.8)'; cx.shadowBlur=6;
  cx.fillText(text,128,32);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c), transparent:true, depthTest:false }));
  sp.position.set(x,y,z); sp.scale.set(2.2,0.55,1); add(sp);
}

// ===================== ROOF GENERATOR (4 types) =====================
function topFootprint(f) {
  const xs=[], ys=[];
  f.rooms.forEach(r => { xs.push(r.x, r.x+r.w); ys.push(r.y, r.y+r.h); });
  (f.wallSegs||[]).forEach(s => { xs.push(s.a.x, s.b.x); ys.push(s.a.y, s.b.y); });
  return { minX:Math.min(...xs), minY:Math.min(...ys), maxX:Math.max(...xs), maxY:Math.max(...ys) };
}
function buildRoof(f, baseY) {
  const fp = topFootprint(f);
  const over = parseFloat(val('roofOverhang')||0.6);
  const pitch = (parseFloat(val('roofPitch')||30)) * Math.PI/180;
  const bx = fp.minX*SCALE - sceneCenter.cx - over;
  const bz = fp.minY*SCALE - sceneCenter.cz - over;
  const bw = (fp.maxX-fp.minX)*SCALE + over*2;
  const bd = (fp.maxY-fp.minY)*SCALE + over*2;
  const col = new THREE.Color('#b3531f').lerp(new THREE.Color(0x221100), 0.15);
  const mat = matRoof(bw, bd);
  const type = f.roofType;

  if (type === 'dak') {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(bw,0.18,bd), mat);
    slab.position.set(bx+bw/2, baseY+0.09, bz+bd/2); slab.castShadow=true; add(slab);
    // parapet
    const pmat = new THREE.MeshLambertMaterial({ color:col.clone().multiplyScalar(0.9), wireframe:wireframeMode });
    const ph=0.5, pt=0.12;
    [[bx,bz,bw,pt],[bx,bz+bd-pt,bw,pt],[bx,bz,pt,bd],[bx+bw-pt,bz,pt,bd]].forEach(([px,pz,pw,pd])=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(pw,ph,pd),pmat); m.position.set(px+pw/2,baseY+0.18+ph/2,pz+pd/2); m.castShadow=true; add(m);
    });
    return;
  }

  const pos = [];
  const tri = (a,b,c)=> pos.push(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]);
  const quad = (a,b,c,d)=> { tri(a,b,c); tri(a,c,d); };
  const ridgeAlongX = bw >= bd;
  const span = Math.min(bw, bd);
  const rh = (span/2) * Math.tan(pitch);

  if (type === 'miring') {
    // single slope: low at one side, high at other (slope across the shorter span)
    if (ridgeAlongX) {
      const yLow=baseY, yHigh=baseY+ (bd)*Math.tan(pitch);
      const A=[bx,yLow,bz], B=[bx+bw,yLow,bz], C=[bx+bw,yHigh,bz+bd], D=[bx,yHigh,bz+bd];
      quad(A,B,C,D);
      tri(A,D,[bx,yLow,bz+bd]); tri(B,[bx+bw,yLow,bz+bd],C);
    } else {
      const yLow=baseY, yHigh=baseY+ (bw)*Math.tan(pitch);
      const A=[bx,yLow,bz], B=[bx,yLow,bz+bd], C=[bx+bw,yHigh,bz+bd], D=[bx+bw,yHigh,bz];
      quad(A,B,C,D);
      tri(A,D,[bx+bw,yLow,bz]); tri(B,[bx+bw,yLow,bz+bd],C);
    }
  } else {
    // pelana (gable) or limas (hip)
    const inset = type === 'limas' ? span/2 : 0;
    if (ridgeAlongX) {
      const midZ=bz+bd/2;
      const A=[bx,baseY,bz], B=[bx+bw,baseY,bz], C=[bx+bw,baseY,bz+bd], D=[bx,baseY,bz+bd];
      const R1=[bx+inset, baseY+rh, midZ], R2=[bx+bw-inset, baseY+rh, midZ];
      quad(A,B,R2,R1);   // back slope (z-)
      quad(D,C,R2,R1);   // front slope (z+)  (note winding handled by DoubleSide)
      tri(A,D,R1); tri(B,C,R2);   // ends (triangles for gable; sloped hips for limas)
    } else {
      const midX=bx+bw/2;
      const A=[bx,baseY,bz], B=[bx,baseY,bz+bd], C=[bx+bw,baseY,bz+bd], D=[bx+bw,baseY,bz];
      const R1=[midX, baseY+rh, bz+inset], R2=[midX, baseY+rh, bz+bd-inset];
      quad(A,B,R2,R1); quad(D,C,R2,R1); tri(A,D,R1); tri(B,C,R2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos),3));
  g.computeVertexNormals();
  const roof = new THREE.Mesh(g, mat); roof.castShadow = true; add(roof);
}

function buildNorthArrow() {
  // a small N marker on the ground, rotated by northAngle
  const c = document.createElement('canvas'); c.width=128; c.height=128;
  const cx = c.getContext('2d');
  cx.translate(64,64); cx.rotate(-northAngle*Math.PI/180);
  cx.fillStyle='#e8523a'; cx.beginPath(); cx.moveTo(0,-40); cx.lineTo(14,10); cx.lineTo(0,0); cx.lineTo(-14,10); cx.closePath(); cx.fill();
  cx.fillStyle='#8b8fa8'; cx.beginPath(); cx.moveTo(0,40); cx.lineTo(14,-10); cx.lineTo(0,0); cx.lineTo(-14,-10); cx.closePath(); cx.fill();
  cx.fillStyle='#e8eaf0'; cx.font='bold 26px sans-serif'; cx.textAlign='center'; cx.textBaseline='middle';
  cx.rotate(northAngle*Math.PI/180); cx.fillText('N',0,-48);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c), transparent:true }));
  // place near scene origin corner
  sp.position.set(orbitState.targetX - 7, 0.2, orbitState.targetZ - 7); sp.scale.set(2,2,1);
  add(sp);
}

// ===================== CAMERA / CONTROLS =====================
function updateCameraPosition() {
  if (!threeCamera) return;
  const t=orbitState.theta*Math.PI/180, p=orbitState.phi*Math.PI/180, r=orbitState.radius;
  threeCamera.position.set(orbitState.targetX + r*Math.sin(p)*Math.sin(t), r*Math.cos(p), orbitState.targetZ + r*Math.sin(p)*Math.cos(t));
  threeCamera.lookAt(orbitState.targetX, 0, orbitState.targetZ);
}
function reset3DCamera() {
  const WALL_H = parseFloat(val('wallHeight')||3);
  orbitState.theta=45; orbitState.phi=58; orbitState.radius= 16 + floors.length*WALL_H*1.2;
  computeCenter(); orbitState.targetX=sceneCenter.cx; orbitState.targetZ=sceneCenter.cz; updateCameraPosition();
}
function on3DMouseDown(e){ if(nav3dMode!=='orbit') return; if(e.button===0) orbitState.isOrbiting=true; if(e.button===2) orbitState.isPanning=true; orbitState.lastX=e.clientX; orbitState.lastY=e.clientY; }
function on3DMouseUp(){ orbitState.isOrbiting=false; orbitState.isPanning=false; }
function on3DMouseMove(e){
  if(!threeRenderer || nav3dMode!=='orbit') return;
  const dx=e.clientX-orbitState.lastX, dy=e.clientY-orbitState.lastY;
  orbitState.lastX=e.clientX; orbitState.lastY=e.clientY;
  if(orbitState.isOrbiting){ orbitState.theta-=dx*0.4; orbitState.phi=Math.max(6,Math.min(88,orbitState.phi+dy*0.4)); updateCameraPosition(); }
  if(orbitState.isPanning){ const sp=orbitState.radius*0.003, t=orbitState.theta*Math.PI/180;
    orbitState.targetX-=(Math.cos(t)*dx-Math.sin(t)*dy)*sp; orbitState.targetZ+=(Math.sin(t)*dx+Math.cos(t)*dy)*sp; updateCameraPosition(); }
}
function on3DWheel(e){ if(nav3dMode!=='orbit') return; e.preventDefault(); orbitState.radius=Math.max(3,Math.min(90,orbitState.radius+e.deltaY*0.02)); updateCameraPosition(); }

// ===================== TOUCH CONTROLS (HP / tablet) =====================
let touch3D = { mode:null, lastX:0, lastY:0, lastDist:0, lastMidX:0, lastMidY:0 };
function _t3dDist(t){ const dx=t[0].clientX-t[1].clientX, dy=t[0].clientY-t[1].clientY; return Math.hypot(dx,dy); }
function on3DTouchStart(e){
  if(!threeRenderer) return;
  e.preventDefault();
  const t=e.touches;
  if(t.length===1){
    touch3D.mode='one'; touch3D.lastX=t[0].clientX; touch3D.lastY=t[0].clientY;
  } else if(t.length>=2){
    touch3D.mode='two';
    touch3D.lastDist=_t3dDist(t);
    touch3D.lastMidX=(t[0].clientX+t[1].clientX)/2;
    touch3D.lastMidY=(t[0].clientY+t[1].clientY)/2;
  }
}
function on3DTouchMove(e){
  if(!threeRenderer) return;
  e.preventDefault();
  const t=e.touches;
  if(touch3D.mode==='one' && t.length===1){
    const dx=t[0].clientX-touch3D.lastX, dy=t[0].clientY-touch3D.lastY;
    touch3D.lastX=t[0].clientX; touch3D.lastY=t[0].clientY;
    if(nav3dMode==='walk'){
      // 1 jari = melihat-lihat (look)
      walkState.targetYaw   -= dx*0.005;
      walkState.targetPitch  = Math.max(-1.2, Math.min(1.2, walkState.targetPitch - dy*0.005));
    } else {
      orbitState.theta -= dx*0.4;
      orbitState.phi    = Math.max(6, Math.min(88, orbitState.phi + dy*0.4));
      updateCameraPosition();
    }
  } else if(touch3D.mode==='two' && t.length>=2){
    if(nav3dMode!=='orbit') return;
    // cubit = zoom
    const dist=_t3dDist(t);
    if(touch3D.lastDist>0){
      const scale=touch3D.lastDist/dist;
      orbitState.radius=Math.max(3, Math.min(90, orbitState.radius*scale));
    }
    touch3D.lastDist=dist;
    // geser 2 jari = pan target
    const midX=(t[0].clientX+t[1].clientX)/2, midY=(t[0].clientY+t[1].clientY)/2;
    const pdx=midX-touch3D.lastMidX, pdy=midY-touch3D.lastMidY;
    touch3D.lastMidX=midX; touch3D.lastMidY=midY;
    const sp=orbitState.radius*0.003, th=orbitState.theta*Math.PI/180;
    orbitState.targetX-=(Math.cos(th)*pdx-Math.sin(th)*pdy)*sp;
    orbitState.targetZ+=(Math.sin(th)*pdx+Math.cos(th)*pdy)*sp;
    updateCameraPosition();
  }
}
function on3DTouchEnd(e){
  const t=e.touches;
  if(t.length===0){ touch3D.mode=null; }
  else if(t.length===1){ touch3D.mode='one'; touch3D.lastX=t[0].clientX; touch3D.lastY=t[0].clientY; }
}

function toggle3DWireframe(){ wireframeMode=!wireframeMode; flagBtn('btn3dWireframe', wireframeMode); build3DScene(); }
function toggle3DRoof(){ showRoof=!showRoof; flagBtn('btn3dRoof', showRoof); build3DScene(); }
function toggle3DAllFloors(){ showAllFloors=!showAllFloors; flagBtn('btn3dFloors', showAllFloors); reset3DCamera(); build3DScene(); }
function toggle3DEnv(){ showEnv=!showEnv; flagBtn('btn3dEnv', showEnv); init3DScene(); setTimeout(()=>flagBtn('btn3dEnv',showEnv),200); }
function flagBtn(id,on){ const b=document.getElementById(id); if(!b) return; b.style.color = on?'var(--accent)':''; b.style.borderColor = on?'var(--accent)':''; }

// ===================== 3D PHOTO RENDER (25) =====================
// Honest substitute for diffusion render: high-res capture of the realistic PBR scene.
function renderPhoto() {
  if (!threeRenderer || !threeScene || !threeCamera) { showNotif('⚠️ Buka Preview 3D dulu'); return; }
  const container = document.getElementById('three-canvas-container');
  const W = container.clientWidth, H = container.clientHeight;
  const prevPR = threeRenderer.getPixelRatio();
  try {
    threeRenderer.setPixelRatio(Math.min(3, (window.devicePixelRatio||1)*2));  // supersample for crisp output
    threeRenderer.render(threeScene, threeCamera);
    const url = threeRenderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = `Render_RumahDesign3D_${Date.now()}.png`; a.click();
    showNotif('📸 Render foto disimpan');
  } catch(e) { showNotif('⚠️ Gagal render: ' + e.message); }
  finally { threeRenderer.setPixelRatio(prevPR); threeRenderer.setSize(W, H); threeRenderer.render(threeScene, threeCamera); }
}

// ===================== WALK-THROUGH TOUR (first person) =====================
function enterWalkMode(){
  if (!threeRenderer) return;
  nav3dMode = 'walk';
  // start at front entrance, eye height of active floor
  const b = sceneBoundsWorld();
  const WALL_H = parseFloat(val('wallHeight')||3);
  const baseY = (showAllFloors ? currentFloorIndex : 0) * WALL_H;
  threeCamera.position.set((b.minX+b.maxX)/2, baseY + walkState.eyeY, b.maxZ + 2.5);
  walkState.yaw = Math.PI; walkState.targetYaw = Math.PI;   // look toward -z (into the house)
  walkState.pitch = 0; walkState.targetPitch = 0; walkState.keys = {}; walkState.vel = {x:0,z:0}; walkState.joy = {f:0,s:0};
  buildWalkCollision();
  applyWalkLook();
  setupWalkJoystick();
  flagBtn('btn3dWalk', true);
  document.getElementById('walkOverlay')?.classList.add('show');
  document.getElementById('view3d-hint').style.display = 'none';
  const cv = threeRenderer.domElement;
  try { const pl = cv.requestPointerLock && cv.requestPointerLock(); if (pl && pl.catch) pl.catch(()=>{}); } catch(e) {}
  cv.style.cursor = 'grab';
  document.addEventListener('pointerlockchange', onPLChange);
  document.addEventListener('mousemove', onWalkMouse);
  document.addEventListener('keydown', onWalkKey);
  document.addEventListener('keyup', onWalkKeyUp);
}
function exitWalkMode(){
  nav3dMode = 'orbit';
  walkState.keys = {}; walkState.joy = {f:0,s:0};
  flagBtn('btn3dWalk', false);
  document.getElementById('walkOverlay')?.classList.remove('show');
  if (document.getElementById('view3d-hint')) document.getElementById('view3d-hint').style.display = '';
  document.removeEventListener('mousemove', onWalkMouse);
  document.removeEventListener('keydown', onWalkKey);
  document.removeEventListener('keyup', onWalkKeyUp);
  document.removeEventListener('pointerlockchange', onPLChange);
  if (document.pointerLockElement) document.exitPointerLock && document.exitPointerLock();
  reset3DCamera();
}
function toggle3DWalk(){ if (nav3dMode==='walk') exitWalkMode(); else enterWalkMode(); }
// ---- joystick gerak (HP/tablet) ----
let _walkJoyInit = false;
function setupWalkJoystick(){
  if (_walkJoyInit) return;
  const j = document.getElementById('walkJoystick'), kn = document.getElementById('walkJoyKnob');
  if (!j || !kn) return;
  _walkJoyInit = true;
  let active=false, cx=0, cy=0, R=60;
  function start(e){ active=true; const r=j.getBoundingClientRect(); cx=r.left+r.width/2; cy=r.top+r.height/2; R=r.width/2; move(e); if(e.cancelable)e.preventDefault(); e.stopPropagation(); }
  function move(e){ if(!active) return; const t=e.touches?e.touches[0]:e; let dx=t.clientX-cx, dy=t.clientY-cy; const d=Math.hypot(dx,dy); if(d>R){ dx*=R/d; dy*=R/d; } kn.style.transform='translate('+dx+'px,'+dy+'px)'; walkState.joy={ f:-dy/R, s:dx/R }; if(e.cancelable)e.preventDefault(); e.stopPropagation(); }
  function end(){ active=false; kn.style.transform='translate(0,0)'; walkState.joy={f:0,s:0}; }
  j.addEventListener('touchstart', start, {passive:false});
  j.addEventListener('touchmove', move, {passive:false});
  j.addEventListener('touchend', end); j.addEventListener('touchcancel', end);
  j.addEventListener('mousedown', start); window.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
}
function onPLChange(){ if (!document.pointerLockElement && nav3dMode==='walk') exitWalkMode(); }
function onWalkMouse(e){
  if (nav3dMode!=='walk') return;
  // When pointer-lock is unavailable (e.g. sandboxed iframe), fall back to drag-to-look.
  if (!document.pointerLockElement && !e.buttons) return;
  walkState.targetYaw   -= (e.movementX||0) * 0.0019;
  walkState.targetPitch -= (e.movementY||0) * 0.0019;
  walkState.targetPitch = Math.max(-1.2, Math.min(1.2, walkState.targetPitch));
}
function onWalkKey(e){ const k=e.key.toLowerCase(); if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift',' '].includes(k)){ walkState.keys[k]=true; e.preventDefault(); } if(k==='escape') exitWalkMode(); }
function onWalkKeyUp(e){ walkState.keys[e.key.toLowerCase()]=false; }
function applyWalkLook(){
  const cp=Math.cos(walkState.pitch), fx=Math.sin(walkState.yaw)*cp, fy=Math.sin(walkState.pitch), fz=-Math.cos(walkState.yaw)*cp;
  threeCamera.lookAt(threeCamera.position.x+fx, threeCamera.position.y+fy, threeCamera.position.z+fz);
}

// ---- walk collision: solid wall segments (doors are gaps) ----
function buildWalkCollision(){
  walkCollide = [];
  const f = floors[currentFloorIndex]; if (!f) return;
  const Wx = x => x*SCALE - sceneCenter.cx, Wz = y => y*SCALE - sceneCenter.cz;
  function edgeSolids(p0, p1, openings){
    const lenM = Math.hypot(p1.x-p0.x, p1.y-p0.y)/PX_PER_M; if (lenM < 0.05) return;
    const gaps = openings.map(o=>{ const hw=(o.w/lenM)/2; return [Math.max(0,o.c-hw), Math.min(1,o.c+hw)]; }).sort((a,b)=>a[0]-b[0]);
    let cur = 0; const segs = [];
    gaps.forEach(g=>{ if (g[0] > cur+0.001) segs.push([cur, g[0]]); cur = Math.max(cur, g[1]); });
    if (cur < 0.999) segs.push([cur, 1]);
    segs.forEach(([s,e])=>{
      const ax=p0.x+(p1.x-p0.x)*s, ay=p0.y+(p1.y-p0.y)*s, bx=p0.x+(p1.x-p0.x)*e, by=p0.y+(p1.y-p0.y)*e;
      walkCollide.push({ x1:Wx(ax), z1:Wz(ay), x2:Wx(bx), z2:Wz(by) });
    });
  }
  f.rooms.forEach(r=>{
    ['n','s','e','w'].forEach(edge=>{
      const dE = f.doors.filter(d=>d.roomId===r.id && d.edge===edge).map(d=>({c:d.pos, w:d.width}));
      let p0,p1;
      if (edge==='n'){p0={x:r.x,y:r.y};p1={x:r.x+r.w,y:r.y};}
      else if (edge==='s'){p0={x:r.x,y:r.y+r.h};p1={x:r.x+r.w,y:r.y+r.h};}
      else if (edge==='w'){p0={x:r.x,y:r.y};p1={x:r.x,y:r.y+r.h};}
      else {p0={x:r.x+r.w,y:r.y};p1={x:r.x+r.w,y:r.y+r.h};}
      edgeSolids(p0, p1, dE);
    });
  });
  (f.wallSegs||[]).forEach(s=>{
    const dE = f.doors.filter(d=>d.segId===s.id).map(d=>({c:d.pos, w:d.width}));
    edgeSolids({x:s.a.x,y:s.a.y}, {x:s.b.x,y:s.b.y}, dE);
  });
}
function walkClear(x, z){
  for (let i=0;i<walkCollide.length;i++){
    const s = walkCollide[i];
    const dx=s.x2-s.x1, dz=s.z2-s.z1, L2=dx*dx+dz*dz;
    let t = L2 ? ((x-s.x1)*dx + (z-s.z1)*dz)/L2 : 0; t = Math.max(0, Math.min(1, t));
    const px=s.x1+dx*t, pz=s.z1+dz*t;
    if (Math.hypot(x-px, z-pz) < WALK_RADIUS) return false;
  }
  return true;
}
function updateWalk(dt){
  // smooth look (lerp toward mouse target)
  const ls = 1 - Math.exp(-20*dt);
  walkState.yaw   += (walkState.targetYaw   - walkState.yaw)   * ls;
  walkState.pitch += (walkState.targetPitch - walkState.pitch) * ls;
  const k = walkState.keys;
  const fast = k['shift'] ? 1.9 : 1;
  const fHx = Math.sin(walkState.yaw), fHz = -Math.cos(walkState.yaw);   // horizontal forward
  const rx = Math.cos(walkState.yaw), rz = Math.sin(walkState.yaw);      // right
  let mx=0, mz=0;
  if (k['w']||k['arrowup'])   { mx+=fHx; mz+=fHz; }
  if (k['s']||k['arrowdown']) { mx-=fHx; mz-=fHz; }
  if (k['d']||k['arrowright']){ mx+=rx;  mz+=rz; }
  if (k['a']||k['arrowleft']) { mx-=rx;  mz-=rz; }
  // joystick analog (HP/tablet): joy.f = maju(+)/mundur(-), joy.s = kanan(+)/kiri(-)
  if (walkState.joy && (walkState.joy.f || walkState.joy.s)) {
    mx += fHx*walkState.joy.f + rx*walkState.joy.s;
    mz += fHz*walkState.joy.f + rz*walkState.joy.s;
  }
  const len = Math.hypot(mx,mz);
  const target = walkState.speed * fast;
  const tvx = len>0 ? (mx/len)*target : 0;
  const tvz = len>0 ? (mz/len)*target : 0;
  // accelerate / decelerate smoothly (momentum)
  const acc = 1 - Math.exp(-10*dt);
  walkState.vel.x += (tvx - walkState.vel.x) * acc;
  walkState.vel.z += (tvz - walkState.vel.z) * acc;
  // collision-aware move (slide along walls; doors are gaps)
  const nx = threeCamera.position.x + walkState.vel.x * dt;
  const nz = threeCamera.position.z + walkState.vel.z * dt;
  if (walkClear(nx, threeCamera.position.z)) threeCamera.position.x = nx; else walkState.vel.x *= 0.25;
  if (walkClear(threeCamera.position.x, nz)) threeCamera.position.z = nz; else walkState.vel.z *= 0.25;
  // keep eye height locked to active floor level (gentle bob while moving)
  const WALL_H = parseFloat(val('wallHeight')||3);
  const baseY = (showAllFloors ? currentFloorIndex : 0) * WALL_H;
  const speedNow = Math.hypot(walkState.vel.x, walkState.vel.z);
  const bob = speedNow > 0.3 ? Math.sin(performance.now()*0.011) * 0.025 : 0;
  threeCamera.position.y = baseY + walkState.eyeY + bob;
  applyWalkLook();
}
