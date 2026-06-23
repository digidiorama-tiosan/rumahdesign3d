(function(){
'use strict';
var i3d=null,_lastTouchDist=0;

// ── Public API ─────────────────────────────────────────────
window.openInterior3D=function(roomId){
  var room=(typeof rooms!=='undefined'?rooms:[]).find(function(r){return r.id==roomId;});
  if(!room){if(typeof showNotif==='function')showNotif('⚠️ Pilih ruangan dulu');return;}
  if(i3d)destroyInterior3D();
  _buildOverlay(room);
};
window.destroyInterior3D=function(){
  if(!i3d)return;
  _saveFurnToMain();
  if(i3d.tourFrame)cancelAnimationFrame(i3d.tourFrame);
  if(i3d.animFrame)cancelAnimationFrame(i3d.animFrame);
  if(i3d.renderer)i3d.renderer.dispose();
  window.removeEventListener('resize',_onResize);
  var el=document.getElementById('i3dOverlay');if(el)el.remove();
  i3d=null;
};

// ── Overlay HTML ───────────────────────────────────────────
function _buildOverlay(room){
  var ov=document.createElement('div');
  ov.id='i3dOverlay';
  ov.style.cssText='position:fixed;inset:0;z-index:9000;background:#111;display:flex;flex-direction:column;font-family:inherit;';
  ov.innerHTML=
    '<style>'+
    '.i3b{background:#252836;border:1px solid #3a3d4e;color:#e2e8f0;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:12px;white-space:nowrap;}'+
    '.i3b:hover{background:#3a3d4e;}'+
    '.i3b.active{background:#f5a623;color:#000;border-color:#f5a623;}'+
    '.i3ci{padding:8px 10px;cursor:pointer;border-bottom:1px solid #1a1d2e;display:flex;align-items:center;gap:8px;transition:background .1s;}'+
    '.i3ci:hover,.i3ci.sel{background:#2a3a5e;border-left:3px solid #f5a623;}'+
    '</style>'+
    '<div id="i3hdr" style="display:flex;align-items:center;gap:6px;padding:7px 10px;background:#1a1d2e;border-bottom:1px solid #2a2d3e;flex-shrink:0;flex-wrap:wrap;">'+
      '<button class="i3b" style="background:#e8523a;border-color:#e8523a;color:#fff;" onclick="destroyInterior3D()">✕ Tutup</button>'+
      '<span style="color:#fff;font-weight:700;font-size:13px;margin-right:4px;">🛋️ '+room.type+'</span>'+
      '<button class="i3b" id="i3vbtn" onclick="i3dToggleView()">🔭 Isometrik</button>'+
      '<button class="i3b" onclick="i3dSetCamera(\'corner\')">🎯 Sudut</button>'+
      '<button class="i3b" onclick="i3dSetCamera(\'top\')">⬆ Atas</button>'+
      '<button class="i3b" onclick="i3dSetCamera(\'front\')">⬛ Depan</button>'+
      '<button class="i3b" onclick="i3dToggleCeiling()">🏠 Plafon</button>'+
      '<button class="i3b" id="i3tbtn" onclick="i3dStartTour()" style="background:#3ecf8e;border-color:#3ecf8e;color:#000;">🚶 Tur Ruangan</button>'+
      '<button class="i3b" onclick="i3dScreenshot()">📸 Foto</button>'+
    '</div>'+
    '<div style="display:flex;flex:1;overflow:hidden;">'+
      '<div id="i3sidebar" style="width:180px;min-width:140px;background:#1a1d2e;border-right:1px solid #2a2d3e;display:flex;flex-direction:column;flex-shrink:0;">'+
        '<input id="i3srch" placeholder="🔍 Cari furnitur..." oninput="i3dSearch(this.value)" style="margin:8px;background:#0d0f14;border:1px solid #2a2d3e;border-radius:6px;padding:6px 8px;color:#e2e8f0;font-size:12px;outline:none;">'+
        '<div id="i3cat" style="flex:1;overflow-y:auto;"></div>'+
      '</div>'+
      '<div style="flex:1;position:relative;overflow:hidden;">'+
        '<canvas id="i3canvas" style="width:100%;height:100%;display:block;touch-action:none;"></canvas>'+
        '<div id="i3hint" style="position:absolute;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.65);color:#fff;padding:5px 14px;border-radius:20px;font-size:12px;pointer-events:none;max-width:90%;text-align:center;">Klik furnitur di katalog kiri, lalu klik lantai untuk menaruhnya</div>'+
        '<div style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;">'+
          '<button class="i3b active" id="i3m_place" onclick="i3dMode(\'place\')">📍 Taruh</button>'+
          '<button class="i3b" id="i3m_move" onclick="i3dMode(\'move\')">↔ Pindah</button>'+
          '<button class="i3b" id="i3m_rot" onclick="i3dMode(\'rot\')">↻ Putar</button>'+
          '<button class="i3b" id="i3m_del" onclick="i3dMode(\'del\')" style="background:#e8523a;border-color:#e8523a;color:#fff;">🗑</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  document.body.appendChild(ov);
  _initScene(room);
  _buildCatalog('');
}

// ── Three.js Scene ─────────────────────────────────────────
function _initScene(room){
  var cv=document.getElementById('i3canvas');
  var PX=typeof PX_PER_M!=='undefined'?PX_PER_M:20;
  var rw=room.w/PX, rd=room.h/PX, wh=2.8;
  var W=cv.offsetWidth||window.innerWidth-180, H=cv.offsetHeight||window.innerHeight-90;
  cv.width=W*Math.min(window.devicePixelRatio,2);
  cv.height=H*Math.min(window.devicePixelRatio,2);

  var renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(W,H);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;

  var scene=new THREE.Scene();
  scene.background=new THREE.Color(0x1e2030);
  scene.fog=new THREE.FogExp2(0x1e2030,0.04);

  var camera=new THREE.PerspectiveCamera(52,W/H,0.05,80);

  var orb={theta:30,phi:52,r:Math.max(rw,rd)*1.5+2.5,tx:rw/2,ty:wh*0.35,tz:rd/2};

  i3d={renderer,scene,camera,room,rw,rd,wh,orb,
    animFrame:null,viewMode:'orbit',showCeiling:false,
    mode:'place',pendingDef:null,selected:null,
    furnObjs:[],placeMesh:null,
    drag:{on:false,ox:0,oy:0,orb:false},
    tapX:0,tapY:0,tapT:0};

  _buildRoom();
  _buildLights();
  _loadExistingFurn(room,PX);
  _setupEvents(cv);
  _updateCam();
  window.addEventListener('resize',_onResize);
  _animate();
}

function _bx(w,h,d,mat,x,y,z){
  var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;
}
function _wMat(c){return new THREE.MeshLambertMaterial({color:c});}

function _buildRoom(){
  var {scene,rw,rd,wh}=i3d;
  // Floor
  var floorMat=_wMat(0xc49a6c);
  var fl=new THREE.Mesh(new THREE.PlaneGeometry(rw,rd),floorMat);
  fl.rotation.x=-Math.PI/2;fl.position.set(rw/2,0,rd/2);
  fl.receiveShadow=true;fl.userData.isFloor=true;scene.add(fl);
  // Invisible wide raycast plane
  var rp=new THREE.Mesh(new THREE.PlaneGeometry(rw*4,rd*4),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}));
  rp.rotation.x=-Math.PI/2;rp.position.set(rw/2,0.005,rd/2);rp.userData.isFloor=true;scene.add(rp);
  i3d.placeMesh=rp;
  // Grid
  var grid=new THREE.GridHelper(Math.max(rw,rd)*3,Math.ceil(Math.max(rw,rd)*3/0.5),0x334,0x223);
  grid.position.set(rw/2,0.002,rd/2);scene.add(grid);
  // Walls
  var wMat=new THREE.MeshLambertMaterial({color:0xf2ede4,side:THREE.DoubleSide});
  var walls=[
    {x:rw/2,y:wh/2,z:0,  wx:rw, wh,ry:0},
    {x:rw/2,y:wh/2,z:rd, wx:rw, wh,ry:0},
    {x:0,   y:wh/2,z:rd/2,wx:rd,wh,ry:Math.PI/2},
    {x:rw,  y:wh/2,z:rd/2,wx:rd,wh,ry:Math.PI/2}
  ];
  walls.forEach(function(w){
    var m=new THREE.Mesh(new THREE.PlaneGeometry(w.wx,w.wh),wMat.clone());
    m.position.set(w.x,w.y,w.z);m.rotation.y=w.ry;m.receiveShadow=true;scene.add(m);
  });
  // Skirting
  var sk=_wMat(0xe0d8cc);
  [[rw/2,0,true],[rw/2,rd,true],[0,rd/2,false],[rw,rd/2,false]].forEach(function(v){
    var g=v[2]?new THREE.BoxGeometry(rw,0.1,0.025):new THREE.BoxGeometry(0.025,0.1,rd);
    var m=new THREE.Mesh(g,sk);m.position.set(v[0],0.05,v[1]);scene.add(m);
  });
}

function _buildLights(){
  var {scene,rw,rd,wh}=i3d;
  scene.add(new THREE.AmbientLight(0xfff0e0,0.55));
  var sun=new THREE.DirectionalLight(0xfff5e0,1.1);
  sun.position.set(rw*0.2,wh*2.5,-rd*0.3);sun.castShadow=true;
  sun.shadow.mapSize.width=1024;sun.shadow.mapSize.height=1024;
  sun.shadow.camera.near=0.5;sun.shadow.camera.far=25;
  sun.shadow.camera.left=-8;sun.shadow.camera.right=8;
  sun.shadow.camera.top=8;sun.shadow.camera.bottom=-8;
  scene.add(sun);
  var fill=new THREE.DirectionalLight(0xc0d8ff,0.35);
  fill.position.set(-rw,wh,rd*1.5);scene.add(fill);
  var ceil=new THREE.PointLight(0xfffaf0,0.9,Math.max(rw,rd)*2.5);
  ceil.position.set(rw/2,wh-0.15,rd/2);scene.add(ceil);
}

// ── Furniture Models ───────────────────────────────────────
function _furnModel(def){
  var g=new THREE.Group();
  var w=def.w,d=def.h,h=def.hz||0.8;
  var col=new THREE.Color(def.color||'#8b7355');
  var id=def.id||'';
  if(id.includes('kasur')||id.includes('bed')) _modelBed(g,w,d,col);
  else if(id.includes('sofa')) _modelSofa(g,w,d,h,col);
  else if(id.includes('meja')||id.includes('table')||id.includes('bar_table')) _modelTable(g,w,d,h,col);
  else if(id.includes('kursi')||id.includes('stool')) _modelChair(g,w,d,h,col);
  else if(id.includes('lemari')||id.includes('wardrobe')||id.includes('cabinet')||id.includes('buffet')) _modelCabinet(g,w,d,h,col);
  else if(id.includes('rak')) _modelShelf(g,w,d,h,col);
  else if(id.includes('bathtub')||id.includes('bak')) _modelTub(g,w,d,col);
  else if(id.includes('toilet')||id.includes('kloset')) _modelToilet(g,w,d,col);
  else if(id.includes('wastafel')||id.includes('sink')) _modelSink(g,w,d,col);
  else if(id.includes('mihrab')) _modelMihrab(g,w,d,col);
  else if(id.includes('mimbar')) _modelMimbar(g,w,d,col);
  else if(id.includes('shaf')) _modelShaf(g,w,d,col);
  else _modelBox(g,w,d,h,col);
  g.traverse(function(c){if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
  g.userData.defId=def.id;g.userData.defName=def.name;g.userData.defIcon=def.icon;
  return g;
}
var _lm=function(c){return new THREE.MeshLambertMaterial({color:c});};
var _wood=_lm(0x8b5e3c),_fabric=function(c){return _lm(c);},_metal=_lm(0xa0a0a0),_white=_lm(0xf5f5f0);
function _modelBed(g,w,d,col){
  g.add(_bx(w,0.22,d,_lm(0x7a4e2d),0,0.11,0));
  g.add(_bx(w-0.08,0.26,d-0.15,_lm(0xddd0c0),0,0.35,0.07));
  g.add(_bx(w,0.6,0.1,_lm(0x6b3e22),0,0.51,-d/2+0.07));
  g.add(_bx(w*0.38,0.1,0.32,_white,-w*0.22,0.5,-d/2+0.3));
  g.add(_bx(w*0.38,0.1,0.32,_white, w*0.22,0.5,-d/2+0.3));
}
function _modelSofa(g,w,d,h,col){
  var mat=_fabric(col);
  var leg=_lm(0x3a2a1a);
  g.add(_bx(w,0.32,d*0.6,mat,0,0.32,d*0.08));
  g.add(_bx(w,0.58,0.14,mat,0,0.6,-d/2+0.09));
  g.add(_bx(0.14,0.44,d*0.68,mat,-w/2+0.08,0.42,d*0.04));
  g.add(_bx(0.14,0.44,d*0.68,mat, w/2-0.08,0.42,d*0.04));
  [[-w/2+0.1,-d/2+0.08],[w/2-0.1,-d/2+0.08],[-w/2+0.1,d/2-0.08],[w/2-0.1,d/2-0.08]].forEach(function(p){g.add(_bx(0.06,0.1,0.06,leg,p[0],0.05,p[1]));});
}
function _modelTable(g,w,d,h,col){
  var top=_lm(col),leg=_lm(col.clone?col.clone().multiplyScalar(0.72):0x6b4226);
  g.add(_bx(w,0.06,d,top,0,h,0));
  [[-w/2+0.06,-d/2+0.06],[w/2-0.06,-d/2+0.06],[-w/2+0.06,d/2-0.06],[w/2-0.06,d/2-0.06]].forEach(function(p){g.add(_bx(0.06,h,0.06,leg,p[0],h/2,p[1]));});
}
function _modelChair(g,w,d,h,col){
  var mat=_fabric(col),leg=_lm(0x3a2a1a);
  g.add(_bx(w,0.08,d,mat,0,0.44,0));
  g.add(_bx(w,0.5,0.06,mat,0,0.68,-d/2+0.04));
  [[-w/2+0.05,-d/2+0.05],[w/2-0.05,-d/2+0.05],[-w/2+0.05,d/2-0.05],[w/2-0.05,d/2-0.05]].forEach(function(p){g.add(_bx(0.05,0.44,0.05,leg,p[0],0.22,p[1]));});
}
function _modelCabinet(g,w,d,h,col){
  var mat=_lm(col);
  g.add(_bx(w,h,d,mat,0,h/2,0));
  g.add(_bx(0.04,0.04,0.14,_metal,-w*0.26,h*0.5,-d/2-0.01));
  if(w>0.8)g.add(_bx(0.04,0.04,0.14,_metal,w*0.26,h*0.5,-d/2-0.01));
}
function _modelShelf(g,w,d,h,col){
  var mat=_lm(col),t=0.04;
  g.add(_bx(t,h,d,mat,-w/2,h/2,0));g.add(_bx(t,h,d,mat,w/2,h/2,0));
  [0,h*0.33,h*0.66,h].forEach(function(y){g.add(_bx(w,t,d,mat,0,y,0));});
}
function _modelTub(g,w,d,col){
  g.add(_bx(w,0.55,d,_lm(0xeef0f2),0,0.28,0));
  g.add(_bx(w-0.14,0.38,d-0.14,_lm(0xc8e8f8),0,0.42,0));
}
function _modelToilet(g,w,d,col){
  g.add(_bx(0.42,0.42,0.58,_white,0,0.21,0));
  g.add(_bx(0.38,0.06,0.42,_lm(0xe8e8e0),0,0.44,0));
  g.add(_bx(0.38,0.3,0.14,_white,0,0.57,-d/2+0.1));
}
function _modelSink(g,w,d,col){
  g.add(_bx(w,0.18,d,_white,0,0.82,0));
  g.add(_bx(w*0.7,0.04,d*0.7,_lm(0xd0e8f0),0,0.92,0));
  g.add(_bx(0.04,0.55,0.04,_metal,0,0.54,0));
}
function _modelMihrab(g,w,d,col){
  var mat=_lm(0x14532d);
  g.add(_bx(w,2.5,d,mat,0,1.25,0));
  g.add(_bx(w-0.2,2.2,0.1,_lm(0x1a6b3a),0,1.3,-d/2-0.05));
}
function _modelMimbar(g,w,d,col){
  var mat=_lm(0x7c4a1e);
  g.add(_bx(w,0.06,d,mat,0,1.1,0));
  g.add(_bx(w,1.0,0.06,mat,0,0.6,-d/2));
  g.add(_bx(0.06,1.1,d,mat,-w/2,0.55,0));
  g.add(_bx(0.06,1.1,d,mat,w/2,0.55,0));
  g.add(_bx(w,0.5,d/2,mat,0,0.25,d/4));
}
function _modelShaf(g,w,d,col){
  var mat=_lm(0x166534);
  for(var i=0;i<Math.floor(w/0.5);i++){
    g.add(_bx(0.46,0.02,d,mat,-w/2+0.24+i*0.5,0.01,0));
  }
}
function _modelBox(g,w,d,h,col){g.add(_bx(w,h,d,_lm(col),0,h/2,0));}

// ── Camera ─────────────────────────────────────────────────
function _updateCam(){
  var {camera,orb,viewMode}=i3d;
  if(viewMode==='fps')return;
  var phi=orb.phi*Math.PI/180,theta=orb.theta*Math.PI/180;
  camera.position.set(
    orb.tx+orb.r*Math.sin(phi)*Math.sin(theta),
    orb.ty+orb.r*Math.cos(phi),
    orb.tz+orb.r*Math.sin(phi)*Math.cos(theta));
  camera.lookAt(orb.tx,orb.ty*0.4,orb.tz);
}
window.i3dToggleView=function(){
  i3d.viewMode=i3d.viewMode==='orbit'?'fps':'orbit';
  var btn=document.getElementById('i3vbtn');
  if(btn)btn.textContent=i3d.viewMode==='fps'?'🚶 Walk-In':'🔭 Isometrik';
  if(i3d.viewMode==='fps'){i3d.camera.position.set(i3d.rw/2,1.65,i3d.rd*0.85);i3d.camera.lookAt(i3d.rw/2,1.2,0);}
  else _updateCam();
};
window.i3dSetCamera=function(p){
  var o=i3d.orb;
  if(p==='top'){o.phi=6;o.theta=0;}
  else if(p==='front'){o.phi=78;o.theta=0;}
  else if(p==='corner'){o.phi=48;o.theta=38;}
  i3d.viewMode='orbit';_updateCam();
};
window.i3dToggleCeiling=function(){
  i3d.showCeiling=!i3d.showCeiling;
  var old=i3d.scene.getObjectByName('i3ceil');if(old)i3d.scene.remove(old);
  if(i3d.showCeiling){
    var cm=new THREE.Mesh(new THREE.PlaneGeometry(i3d.rw,i3d.rd),_lm(0xf8f4ee));
    cm.name='i3ceil';cm.rotation.x=Math.PI/2;cm.position.set(i3d.rw/2,i3d.wh,i3d.rd/2);
    i3d.scene.add(cm);
  }
};
// ── Tour ────────────────────────────────────────────────
window.i3dStartTour=function(){
  if(!i3d)return;
  if(i3d.touring){_stopTour();return;}
  i3d.touring=true;
  i3d.viewMode='fps';
  var btn=document.getElementById('i3tbtn');
  if(btn){btn.textContent='⏹ Stop Tur';btn.style.background='#e8523a';btn.style.borderColor='#e8523a';}
  _hint('🚶 Tur berjalan — klik Stop Tur untuk berhenti');
  // Build waypoints along room perimeter at eye level
  var {rw,rd,wh}=i3d;
  var margin=0.7, eyeH=1.6;
  var pts=[
    {x:margin,       y:eyeH,z:margin,       lx:rw/2,ly:eyeH*0.7,lz:rd/2},
    {x:rw-margin,    y:eyeH,z:margin,       lx:rw/2,ly:eyeH*0.7,lz:rd/2},
    {x:rw-margin,    y:eyeH,z:rd/2,         lx:rw/2,ly:eyeH*0.7,lz:rd/2},
    {x:rw-margin,    y:eyeH,z:rd-margin,    lx:rw/2,ly:eyeH*0.7,lz:rd/2},
    {x:rw/2,         y:eyeH,z:rd-margin,    lx:rw/2,ly:eyeH*0.7,lz:rd/4},
    {x:margin,       y:eyeH,z:rd-margin,    lx:rw/2,ly:eyeH*0.7,lz:rd/2},
    {x:margin,       y:eyeH,z:rd/2,         lx:rw/2,ly:eyeH*0.7,lz:rd/2},
    {x:margin,       y:eyeH,z:margin,       lx:rw/2,ly:eyeH*0.7,lz:rd/2},
  ];
  i3d.tourPts=pts;i3d.tourSeg=0;i3d.tourT=0;
  i3d.camera.position.set(pts[0].x,pts[0].y,pts[0].z);
  i3d.camera.lookAt(pts[0].lx,pts[0].ly,pts[0].lz);
  _tourStep();
};
function _stopTour(){
  if(i3d.tourFrame)cancelAnimationFrame(i3d.tourFrame);
  i3d.touring=false;
  var btn=document.getElementById('i3tbtn');
  if(btn){btn.textContent='🚶 Tur Ruangan';btn.style.background='#3ecf8e';btn.style.borderColor='#3ecf8e';btn.style.color='#000';}
  _hint('Tur selesai. Klik furnitur di katalog untuk melanjutkan.');
}
function _tourStep(){
  if(!i3d||!i3d.touring)return;
  var pts=i3d.tourPts,seg=i3d.tourSeg;
  if(seg>=pts.length-1){_stopTour();return;}
  var a=pts[seg],b=pts[seg+1];
  var dur=120; // frames per segment
  i3d.tourT=(i3d.tourT||0)+1;
  var t=Math.min(i3d.tourT/dur,1);
  var ease=t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  i3d.camera.position.set(
    a.x+(b.x-a.x)*ease,
    a.y+(b.y-a.y)*ease,
    a.z+(b.z-a.z)*ease);
  var lx=a.lx+(b.lx-a.lx)*ease,ly=a.ly+(b.ly-a.ly)*ease,lz=a.lz+(b.lz-a.lz)*ease;
  i3d.camera.lookAt(lx,ly,lz);
  if(t>=1){i3d.tourSeg++;i3d.tourT=0;}
  i3d.tourFrame=requestAnimationFrame(_tourStep);
}

// ── Save to main furnitures[] ──────────────────────────────
function _saveFurnToMain(){
  if(!i3d||typeof furnitures==='undefined'||typeof FURN_LIB==='undefined')return;
  var room=i3d.room;
  var PX=typeof PX_PER_M!=='undefined'?PX_PER_M:20;
  // Remove existing furnitures that were inside this room
  var inside=furnitures.filter(function(f){
    var cx=f.x+f.w/2,cy=f.y+f.h/2;
    return cx>=room.x&&cx<=room.x+room.w&&cy>=room.y&&cy<=room.y+room.h;
  });
  inside.forEach(function(f){var idx=furnitures.indexOf(f);if(idx>-1)furnitures.splice(idx,1);});
  // Add current 3D objects back to main furnitures
  i3d.furnObjs.forEach(function(obj){
    var def=FURN_LIB.find(function(d){return d.id===obj.userData.defId;});
    if(!def)return;
    var wx=room.x+obj.position.x*PX;
    var wy=room.y+obj.position.z*PX;
    furnitures.push({fid:Date.now()+Math.random(),defId:def.id,name:def.name,icon:def.icon,
      x:wx,y:wy,w:def.w*PX,h:def.h*PX,color:def.color,rotation:Math.round(obj.rotation.y*180/Math.PI)});
  });
  if(typeof activeFloor==='function')activeFloor().furnitures=furnitures;
  if(typeof render==='function')render();
  if(typeof showNotif==='function'&&i3d.furnObjs.length)showNotif('💾 '+i3d.furnObjs.length+' furnitur disimpan ke denah');
}

window.i3dScreenshot=function(){
  i3d.renderer.render(i3d.scene,i3d.camera);
  var a=document.createElement('a');a.href=i3d.canvas.toDataURL('image/png');a.download='interior3d.png';a.click();
  if(typeof showNotif==='function')showNotif('📸 Foto interior tersimpan');
};

// ── Interaction ────────────────────────────────────────────
function _setupEvents(cv){
  i3d.canvas=cv;
  cv.addEventListener('mousedown',_mdown);
  cv.addEventListener('mousemove',_mmove);
  cv.addEventListener('mouseup',function(){i3d.drag.on=false;});
  cv.addEventListener('contextmenu',function(e){e.preventDefault();});
  cv.addEventListener('wheel',function(e){i3d.orb.r=Math.max(1.2,Math.min(18,i3d.orb.r+e.deltaY*0.012));_updateCam();},{passive:true});
  cv.addEventListener('touchstart',_tstart,{passive:false});
  cv.addEventListener('touchmove',_tmove,{passive:false});
  cv.addEventListener('touchend',_tend,{passive:false});
}
function _mdown(e){
  if(e.button===2){i3d.drag={on:true,orb:true,ox:e.clientX,oy:e.clientY};return;}
  i3d.drag={on:true,orb:false,ox:e.clientX,oy:e.clientY};
  _handleTap(e.clientX,e.clientY);
}
function _mmove(e){
  var dr=i3d.drag;if(!dr.on)return;
  var dx=e.clientX-dr.ox,dy=e.clientY-dr.oy;dr.ox=e.clientX;dr.oy=e.clientY;
  if(dr.orb){i3d.orb.theta-=dx*0.4;i3d.orb.phi=Math.max(4,Math.min(89,i3d.orb.phi-dy*0.3));_updateCam();}
  else if(i3d.mode==='move'&&i3d.selected){
    var pt=_floorPt(e.clientX,e.clientY);
    if(pt){var o=i3d.selected;o.position.x=Math.max(0,Math.min(i3d.rw,pt.x));o.position.z=Math.max(0,Math.min(i3d.rd,pt.z));}
  }
}
function _tstart(e){
  e.preventDefault();
  if(e.touches.length===2){_lastTouchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);return;}
  var t=e.touches[0];
  i3d.drag={on:true,orb:true,ox:t.clientX,oy:t.clientY};
  i3d.tapX=t.clientX;i3d.tapY=t.clientY;i3d.tapT=Date.now();
}
function _tmove(e){
  e.preventDefault();
  if(e.touches.length===2){
    var dist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    i3d.orb.r=Math.max(1.2,Math.min(18,i3d.orb.r*(_lastTouchDist/dist)));
    _lastTouchDist=dist;_updateCam();return;
  }
  var t=e.touches[0],dr=i3d.drag;if(!dr.on)return;
  var dx=t.clientX-dr.ox,dy=t.clientY-dr.oy;dr.ox=t.clientX;dr.oy=t.clientY;
  i3d.orb.theta-=dx*0.4;i3d.orb.phi=Math.max(4,Math.min(89,i3d.orb.phi-dy*0.3));_updateCam();
}
function _tend(e){
  i3d.drag.on=false;
  if(Date.now()-i3d.tapT<200&&Math.hypot(e.changedTouches[0].clientX-i3d.tapX,e.changedTouches[0].clientY-i3d.tapY)<12){
    _handleTap(i3d.tapX,i3d.tapY);
  }
}

function _handleTap(cx,cy){
  var m=i3d.mode;
  if(m==='place'&&i3d.pendingDef){
    var pt=_floorPt(cx,cy);
    if(pt)_placeFurn(i3d.pendingDef,pt.x,pt.z);
  } else if(m==='move'){
    var obj=_pickFurn(cx,cy);if(obj)_select(obj);
  } else if(m==='rot'){
    var obj=_pickFurn(cx,cy);if(obj){obj.rotation.y+=Math.PI/2;if(typeof showNotif==='function')showNotif('↻ Furnitur diputar 90°');}
  } else if(m==='del'){
    var obj=_pickFurn(cx,cy);if(obj)_removeFurn(obj);
  }
}

function _floorPt(cx,cy){
  var rect=i3d.canvas.getBoundingClientRect();
  var x=((cx-rect.left)/rect.width)*2-1,y=-((cy-rect.top)/rect.height)*2+1;
  var rc=new THREE.Raycaster();
  rc.setFromCamera(new THREE.Vector2(x,y),i3d.camera);
  var hits=rc.intersectObject(i3d.placeMesh);
  return hits.length?hits[0].point:null;
}
function _pickFurn(cx,cy){
  var rect=i3d.canvas.getBoundingClientRect();
  var x=((cx-rect.left)/rect.width)*2-1,y=-((cy-rect.top)/rect.height)*2+1;
  var rc=new THREE.Raycaster();
  rc.setFromCamera(new THREE.Vector2(x,y),i3d.camera);
  var best=null,bd=99;
  i3d.furnObjs.forEach(function(o){
    var h=rc.intersectObject(o,true);if(h.length&&h[0].distance<bd){bd=h[0].distance;best=o;}
  });
  return best;
}

function _placeFurn(def,x,z){
  var model=_furnModel(def);
  model.position.set(Math.max(def.w/2,Math.min(i3d.rw-def.w/2,x)),0,Math.max(def.h/2,Math.min(i3d.rd-def.h/2,z)));
  i3d.scene.add(model);i3d.furnObjs.push(model);
  _hint(def.icon+' '+def.name+' ditaruh! Klik lagi untuk tambah.');
  if(typeof showNotif==='function')showNotif('✅ '+def.name+' ditaruh');
}
function _select(obj){
  if(i3d.selected)_dehi(i3d.selected);
  i3d.selected=obj;_hi(obj);
}
function _hi(obj){obj.traverse(function(c){if(c.isMesh&&c.material){c.userData._oe=c.material.emissive?c.material.emissive.clone():new THREE.Color(0);c.material.emissive=new THREE.Color(0x113366);}});}
function _dehi(obj){obj.traverse(function(c){if(c.isMesh&&c.material&&c.userData._oe)c.material.emissive.copy(c.userData._oe);});}
function _removeFurn(obj){
  if(i3d.selected===obj){_dehi(obj);i3d.selected=null;}
  i3d.scene.remove(obj);i3d.furnObjs=i3d.furnObjs.filter(function(o){return o!==obj;});
  if(typeof showNotif==='function')showNotif('🗑 Furnitur dihapus');
}

function _loadExistingFurn(room,PX){
  if(typeof furnitures==='undefined'||typeof FURN_LIB==='undefined')return;
  furnitures.filter(function(f){
    var cx=f.x+f.w/2,cy=f.y+f.h/2;
    return cx>=room.x&&cx<=room.x+room.w&&cy>=room.y&&cy<=room.y+room.h;
  }).forEach(function(f){
    var def=FURN_LIB.find(function(d){return d.id===f.defId;});if(!def)return;
    var model=_furnModel(def);
    model.position.set((f.x-room.x)/PX+def.w/2,0,(f.y-room.y)/PX+def.h/2);
    model.rotation.y=(f.rotation||0)*Math.PI/180;
    i3d.scene.add(model);i3d.furnObjs.push(model);
  });
}

// ── Mode & Catalog ─────────────────────────────────────────
window.i3dMode=function(m){
  i3d.mode=m;
  if(m!=='place')i3d.pendingDef=null;
  if(m==='move')_hint('Klik furnitur untuk pilih, drag untuk pindah');
  else if(m==='rot')_hint('Klik furnitur untuk putar 90°');
  else if(m==='del')_hint('Klik furnitur untuk hapus');
  else _hint('Klik furnitur di katalog, lalu klik lantai untuk menaruhnya');
  ['place','move','rot','del'].forEach(function(id){var b=document.getElementById('i3m_'+id);if(b)b.classList.toggle('active',id===m);});
};
window.i3dSearch=function(q){_buildCatalog(q);};
function _buildCatalog(q){
  var c=document.getElementById('i3cat');if(!c||typeof FURN_LIB==='undefined')return;
  var list=FURN_LIB.filter(function(f){return!q||f.name.toLowerCase().includes(q.toLowerCase())||f.cat.toLowerCase().includes(q.toLowerCase());});
  var cats=[...new Set(list.map(function(f){return f.cat;}))];
  c.innerHTML=cats.map(function(cat){
    return '<div style="padding:4px 8px;color:#f5a623;font-size:10px;font-weight:700;letter-spacing:.5px;border-top:1px solid #2a2d3e;">'+cat.toUpperCase()+'</div>'+
      list.filter(function(f){return f.cat===cat;}).map(function(f){
        return '<div class="i3ci" id="i3c_'+f.id+'" onclick="i3dPickFurn(\''+f.id+'\')">'+
          '<span style="font-size:20px;">'+f.icon+'</span>'+
          '<div><div style="font-size:11px;color:#e2e8f0;line-height:1.3;">'+f.name+'</div>'+
          '<div style="font-size:10px;color:#8892a4;">'+f.w+'×'+f.h+'m</div></div>'+
        '</div>';
      }).join('');
  }).join('');
}
window.i3dPickFurn=function(id){
  var def=typeof FURN_LIB!=='undefined'?FURN_LIB.find(function(f){return f.id===id;}):null;
  if(!def)return;
  i3d.pendingDef=def;i3d.mode='place';
  document.querySelectorAll('.i3ci').forEach(function(el){el.classList.remove('sel');});
  var el=document.getElementById('i3c_'+id);if(el)el.classList.add('sel');
  ['place','move','rot','del'].forEach(function(m){var b=document.getElementById('i3m_'+m);if(b)b.classList.toggle('active',m==='place');});
  _hint(def.icon+' '+def.name+' — klik lantai di scene 3D untuk menaruhnya');
};
function _hint(t){var el=document.getElementById('i3hint');if(el)el.textContent=t;}

// ── Render loop ────────────────────────────────────────────
function _animate(){
  if(!i3d)return;
  i3d.animFrame=requestAnimationFrame(_animate);
  i3d.renderer.render(i3d.scene,i3d.camera);
}
function _onResize(){
  if(!i3d)return;
  var cv=i3d.canvas,W=cv.offsetWidth,H=cv.offsetHeight;if(!W||!H)return;
  i3d.renderer.setSize(W,H);
  i3d.camera.aspect=W/H;i3d.camera.updateProjectionMatrix();
}
})();
