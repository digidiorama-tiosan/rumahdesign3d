/* ============================================================
   MODE REALISTIS — render denah tampak-atas seperti contoh:
   lantai bertekstur (kayu/keramik/rumput/paving), furnitur
   tampak nyata (kasur, sofa, meja makan, dapur, KM, mobil,
   tanaman), dinding tebal, bayangan.
   Mengganti drawRooms() & drawFurniture() saat mode aktif.
   ============================================================ */
(function(){
'use strict';
var KEY='rumah3d_realistic';
window.realisticMode = (function(){ try{ var v=localStorage.getItem(KEY); return v===null?true:v==='1'; }catch(e){ return true; } })();

function styleBtn(){
  var b=document.getElementById('btnRealistic'); if(!b)return;
  if(window.realisticMode){
    b.style.background='linear-gradient(135deg,#f5a623,#ff7a3c)';
    b.style.color='#1a1206'; b.style.borderColor='transparent';
    b.textContent='🎨 Realistis';
  }else{
    b.style.background='rgba(19,21,31,.92)';
    b.style.color='#e8eaf2'; b.style.borderColor='#2a2d3e';
    b.textContent='▢ Skema';
  }
}
window.toggleRealistic=function(){
  window.realisticMode=!window.realisticMode;
  try{ localStorage.setItem(KEY, window.realisticMode?'1':'0'); }catch(e){}
  styleBtn();
  if(typeof showNotif==='function') showNotif(window.realisticMode?'🎨 Tampilan realistis aktif':'▢ Tampilan skema');
  if(typeof render==='function') render();
};

/* ---------- util ---------- */
function ctxOf(){ return (typeof ctx!=='undefined')?ctx:null; }
function clipRect(g,r){ g.beginPath(); g.rect(r.x,r.y,r.w,r.h); g.clip(); }
function seedOf(s){ s=String(s||''); var h=2166136261; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return (h>>>0); }
function rng(seed){ var s=seed||1; return function(){ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; }

/* ---------- klasifikasi material lantai ---------- */
function matOf(type){
  var t=(type||'').toLowerCase();
  if(/taman|garden|rumput|halaman|hijau/.test(t)) return 'grass';
  if(/carport|garasi|garage|parkir/.test(t))      return 'paving';
  if(/teras|teres|porch|balkon|beranda/.test(t))  return 'deck';
  if(/kolam|pool/.test(t))                         return 'water';
  if(/mandi|wc|toilet/.test(t)||/\bkm\b/.test(t)||t==='km/wc'||t.indexOf('km/')===0) return 'bath';
  if(/dapur|kitchen|pantry|laundry|cuci/.test(t)) return 'tile';
  if(/gudang|storage|garasi/.test(t))             return 'concrete';
  if(/mushola|masjid|sholat/.test(t))             return 'carpet';
  return 'wood';
}

/* ---------- gambar lantai per material ---------- */
function floor(g,r,mat,id,invZ){
  g.save(); clipRect(g,r);
  var P=PX_PER_M;
  if(mat==='wood'){
    g.fillStyle='#e7d3b0'; g.fillRect(r.x,r.y,r.w,r.h);
    var grd=g.createLinearGradient(r.x,r.y,r.x+r.w,r.y+r.h);
    grd.addColorStop(0,'rgba(255,245,225,0.18)'); grd.addColorStop(1,'rgba(120,85,45,0.10)');
    g.fillStyle=grd; g.fillRect(r.x,r.y,r.w,r.h);
    var pw=0.42*P; g.strokeStyle='rgba(135,100,60,0.30)'; g.lineWidth=1*invZ;
    for(var y=r.y+pw;y<r.y+r.h;y+=pw){ g.beginPath(); g.moveTo(r.x,y); g.lineTo(r.x+r.w,y); g.stroke(); }
    var rnd=rng(seedOf(id)); g.strokeStyle='rgba(135,100,60,0.20)';
    for(var yy=r.y;yy<r.y+r.h;yy+=pw){ var nseg=2+Math.floor(rnd()*2); for(var s=1;s<nseg;s++){ var sx=r.x+r.w*(s/nseg)+(rnd()-0.5)*40; g.beginPath(); g.moveTo(sx,yy); g.lineTo(sx,yy+pw); g.stroke(); } }
  }else if(mat==='tile'||mat==='deck'){
    g.fillStyle = mat==='deck' ? '#ded3c2' : '#eef0f3'; g.fillRect(r.x,r.y,r.w,r.h);
    var ts=0.6*P; g.strokeStyle = mat==='deck' ? 'rgba(150,135,110,0.45)' : 'rgba(150,160,175,0.55)'; g.lineWidth=1*invZ;
    for(var tx=r.x+ts;tx<r.x+r.w;tx+=ts){ g.beginPath(); g.moveTo(tx,r.y); g.lineTo(tx,r.y+r.h); g.stroke(); }
    for(var ty=r.y+ts;ty<r.y+r.h;ty+=ts){ g.beginPath(); g.moveTo(r.x,ty); g.lineTo(r.x+r.w,ty); g.stroke(); }
  }else if(mat==='bath'){
    g.fillStyle='#dbe9f1'; g.fillRect(r.x,r.y,r.w,r.h);
    var bs=0.3*P; g.strokeStyle='rgba(120,165,195,0.5)'; g.lineWidth=1*invZ;
    for(var bx=r.x+bs;bx<r.x+r.w;bx+=bs){ g.beginPath(); g.moveTo(bx,r.y); g.lineTo(bx,r.y+r.h); g.stroke(); }
    for(var by=r.y+bs;by<r.y+r.h;by+=bs){ g.beginPath(); g.moveTo(r.x,by); g.lineTo(r.x+r.w,by); g.stroke(); }
  }else if(mat==='concrete'){
    g.fillStyle='#d6d2c7'; g.fillRect(r.x,r.y,r.w,r.h);
  }else if(mat==='paving'){
    g.fillStyle='#c3c4c6'; g.fillRect(r.x,r.y,r.w,r.h);
    var ps=0.8*P; g.strokeStyle='rgba(120,122,128,0.6)'; g.lineWidth=1.4*invZ;
    for(var px=r.x+ps;px<r.x+r.w;px+=ps){ g.beginPath(); g.moveTo(px,r.y); g.lineTo(px,r.y+r.h); g.stroke(); }
    for(var py=r.y+ps;py<r.y+r.h;py+=ps){ g.beginPath(); g.moveTo(r.x,py); g.lineTo(r.x+r.w,py); g.stroke(); }
  }else if(mat==='carpet'){
    g.fillStyle='#2f6e51'; g.fillRect(r.x,r.y,r.w,r.h);
    var cs=0.5*P; g.strokeStyle='rgba(255,255,255,0.08)'; g.lineWidth=1*invZ;
    for(var cx=r.x+cs;cx<r.x+r.w;cx+=cs){ g.beginPath(); g.moveTo(cx,r.y); g.lineTo(cx,r.y+r.h); g.stroke(); }
  }else if(mat==='water'){
    g.fillStyle='#46b6d6'; g.fillRect(r.x,r.y,r.w,r.h);
    g.strokeStyle='rgba(255,255,255,0.22)'; g.lineWidth=1.4*invZ;
    for(var wy=r.y+0.5*P;wy<r.y+r.h;wy+=0.5*P){ g.beginPath(); for(var wx=r.x;wx<r.x+r.w;wx+=10){ g.lineTo(wx, wy+Math.sin(wx/14)*2.2); } g.stroke(); }
  }else if(mat==='grass'){
    g.fillStyle='#6f9e4d'; g.fillRect(r.x,r.y,r.w,r.h);
    var grd2=g.createLinearGradient(r.x,r.y,r.x,r.y+r.h);
    grd2.addColorStop(0,'rgba(255,255,255,0.06)'); grd2.addColorStop(1,'rgba(0,40,0,0.12)');
    g.fillStyle=grd2; g.fillRect(r.x,r.y,r.w,r.h);
    var rnd2=rng(seedOf(id)); g.strokeStyle='rgba(40,90,35,0.5)'; g.lineWidth=1*invZ;
    var n=Math.max(8,Math.floor((r.w*r.h)/(P*P)*6));
    for(var i=0;i<n;i++){ var x=r.x+rnd2()*r.w, y=r.y+rnd2()*r.h, hh=3+rnd2()*4; g.beginPath(); g.moveTo(x,y); g.lineTo(x-1.5,y-hh); g.moveTo(x,y); g.lineTo(x+1.5,y-hh); g.stroke(); }
    // beberapa tanaman/semak
    var nb=Math.max(2,Math.floor((r.w*r.h)/(P*P)/3));
    for(var b=0;b<nb;b++){ var bx2=r.x+0.4*P+rnd2()*(r.w-0.8*P), by2=r.y+0.4*P+rnd2()*(r.h-0.8*P); shrub(g,bx2,by2,(7+rnd2()*7)); }
  }
  g.restore();
}
function shrub(g,x,y,rad){
  var cols=['#3f7d35','#4f9540','#356b2c'];
  for(var i=0;i<5;i++){ var a=i/5*Math.PI*2; g.fillStyle=cols[i%3]; g.beginPath(); g.arc(x+Math.cos(a)*rad*0.5,y+Math.sin(a)*rad*0.5,rad*0.55,0,7); g.fill(); }
  g.fillStyle='#5aa84a'; g.beginPath(); g.arc(x,y,rad*0.6,0,7); g.fill();
}

/* ---------- drawRooms realistis ---------- */
function drawRoomsReal(invZ){
  var g=ctxOf(); if(!g)return;
  rooms.forEach(function(r){
    var mat=matOf(r.type);
    floor(g,r,mat,r.id,invZ);
    // dinding tebal (gabungan dengan ruang sebelah jadi 1 garis tebal)
    g.save();
    g.strokeStyle='#23262e'; g.lineWidth=Math.max(2.5, 0.1*PX_PER_M)*1; g.lineJoin='miter';
    g.strokeRect(r.x,r.y,r.w,r.h);
    g.restore();
  });
  // label & seleksi (di atas semua lantai supaya jelas)
  rooms.forEach(function(r){
    var sel=selectedRoom===r.id;
    g.save();
    g.textAlign='center'; g.textBaseline='middle';
    var fs=Math.max(9,Math.min(14, r.w/9))*invZ;
    var label=(r.type||'').toUpperCase();
    g.font='800 '+fs+"px 'Plus Jakarta Sans', sans-serif";
    var cx=r.x+r.w/2, cy=r.y+r.h/2;
    g.lineWidth=3*invZ; g.strokeStyle='rgba(255,255,255,0.85)'; g.lineJoin='round';
    g.strokeText(label,cx,cy-6*invZ);
    g.fillStyle='#2a2f38'; g.fillText(label,cx,cy-6*invZ);
    var luas=((r.w/PX_PER_M)*(r.h/PX_PER_M)).toFixed(1)+' m²';
    g.font='600 '+(Math.max(8,Math.min(11,r.w/12))*invZ)+"px 'Space Mono', monospace";
    g.lineWidth=3*invZ; g.strokeText(luas,cx,cy+9*invZ);
    g.fillStyle='rgba(60,68,80,0.9)'; g.fillText(luas,cx,cy+9*invZ);
    if(sel){
      g.strokeStyle='#f5a623'; g.lineWidth=2.5*invZ; g.setLineDash([6*invZ,4*invZ]);
      g.strokeRect(r.x,r.y,r.w,r.h); g.setLineDash([]);
      getHandles(r).forEach(function(h){ g.fillStyle='#f5a623'; g.strokeStyle='#0d0f14'; g.lineWidth=2*invZ; g.beginPath(); g.arc(h[1],h[2],HANDLE_SIZE*invZ,0,7); g.fill(); g.stroke(); });
    }
    g.restore();
  });
}

/* ---------- furnitur tampak-atas ---------- */
function furnKind(id){
  id=id||'';
  if(/kasur|ranjang/.test(id)) return 'bed';
  if(/sofa/.test(id)) return 'sofa';
  if(/toilet/.test(id)) return 'toilet';
  if(/bathtub/.test(id)) return 'tub';
  if(/shower/.test(id)) return 'shower';
  if(/wastafel_dapur|^sink/.test(id)) return 'sink';
  if(/wastafel|bak_cuci|wastafel_cuci|kolam_wudhu/.test(id)) return 'basin';
  if(/kompor|oven/.test(id)) return 'stove';
  if(/kulkas|freezer|kulkas_showcase/.test(id)) return 'fridge';
  if(/mobil/.test(id)) return 'car';
  if(/motor/.test(id)) return 'moto';
  if(/tanaman|pot_besar|tanaman_besar|gazebo/.test(id)) return 'plant';
  if(/^tv$|meja_tv|lemari_tv|papan_tulis|^ac$|cermin/.test(id)) return 'panel';
  if(/karpet|matras|tikar|shaf|sajadah/.test(id)) return 'rug';
  if(/kursi|stool|bangku|manekin/.test(id)) return 'chair';
  if(/tangga/.test(id)) return 'stairs';
  return 'box';
}

function rr(g,x,y,w,h,rad){ g.beginPath(); g.roundRect(x,y,w,h,rad); }

function drawFurnReal(invZ){
  var g=ctxOf(); if(!g)return;
  furnitures.forEach(function(f){
    var cx=f.x+f.w/2, cy=f.y+f.h/2;
    var lw=f.w, lh=f.h;
    var sel=f.fid===selectedFurnId;
    g.save();
    g.translate(cx,cy); g.rotate((f.rotation||0)*Math.PI/180);
    // bayangan halus
    g.shadowColor='rgba(0,0,0,0.28)'; g.shadowBlur=5*invZ; g.shadowOffsetX=1.5*invZ; g.shadowOffsetY=2.5*invZ;
    var kind=furnKind(f.defId);
    var col=f.color||'#9aa0aa';
    try{ FURN[kind](g,lw,lh,col,f); }catch(e){ FURN.box(g,lw,lh,col,f); }
    g.shadowColor='transparent'; g.shadowBlur=0; g.shadowOffsetX=0; g.shadowOffsetY=0;
    if(sel){ g.strokeStyle='#f5a623'; g.lineWidth=2*invZ; g.setLineDash([4*invZ,3*invZ]); g.strokeRect(-lw/2-4*invZ,-lh/2-4*invZ,lw+8*invZ,lh+8*invZ); g.setLineDash([]); }
    g.restore();
  });
}

function shade(hex,amt){
  try{ var c=hex.replace('#',''); if(c.length===3)c=c.split('').map(function(x){return x+x;}).join('');
    var n=parseInt(c,16),R=(n>>16)+amt,G=((n>>8)&255)+amt,B=(n&255)+amt;
    R=Math.max(0,Math.min(255,R));G=Math.max(0,Math.min(255,G));B=Math.max(0,Math.min(255,B));
    return 'rgb('+R+','+G+','+B+')'; }catch(e){ return hex; }
}

var FURN={
  box:function(g,w,h,col){
    g.fillStyle=col; rr(g,-w/2,-h/2,w,h,Math.min(4,w/6)); g.fill();
    var grd=g.createLinearGradient(0,-h/2,0,h/2); grd.addColorStop(0,'rgba(255,255,255,0.22)'); grd.addColorStop(1,'rgba(0,0,0,0.16)');
    g.fillStyle=grd; rr(g,-w/2,-h/2,w,h,Math.min(4,w/6)); g.fill();
    g.strokeStyle=shade(col,-40); g.lineWidth=1; rr(g,-w/2,-h/2,w,h,Math.min(4,w/6)); g.stroke();
  },
  bed:function(g,w,h,col){
    // headboard di atas (sisi pendek)
    g.fillStyle='#8a5a30'; rr(g,-w/2,-h/2,w,h*0.10,3); g.fill();
    // matras
    var my=-h/2+h*0.10;
    g.fillStyle='#f4efe4'; rr(g,-w/2+2,my,w-4,h-h*0.10-2,6); g.fill();
    g.strokeStyle='#cfc6b4'; g.lineWidth=1; rr(g,-w/2+2,my,w-4,h-h*0.10-2,6); g.stroke();
    // selimut (2/3 bawah) pakai warna def
    var by=my+(h-h*0.10)*0.34;
    g.fillStyle=col; rr(g,-w/2+3,by,w-6,(h-h*0.10)*0.62,5); g.fill();
    g.strokeStyle=shade(col,-30); g.lineWidth=1; g.beginPath(); g.moveTo(-w/2+3,by); g.lineTo(w/2-3,by); g.stroke();
    // bantal
    var pw=(w-12)/2, ph=h*0.14;
    g.fillStyle='#ffffff';
    rr(g,-w/2+4,my+3,pw-2,ph,4); g.fill(); g.strokeStyle='#e6e0d2'; g.stroke();
    rr(g,2,my+3,pw-2,ph,4); g.fill(); g.stroke();
  },
  sofa:function(g,w,h,col){
    // sandaran di atas
    g.fillStyle=shade(col,-18); rr(g,-w/2,-h/2,w,h*0.30,6); g.fill();
    // lengan kiri/kanan
    g.fillStyle=shade(col,-8);
    rr(g,-w/2,-h/2,w*0.12,h,6); g.fill();
    rr(g,w/2-w*0.12,-h/2,w*0.12,h,6); g.fill();
    // dudukan
    var sx=-w/2+w*0.12, sw=w*0.76, sy=-h/2+h*0.26, sh=h*0.66;
    g.fillStyle=col; rr(g,sx,sy,sw,sh,5); g.fill();
    var nseat=Math.max(1,Math.round(w/ (1.0*PX_PER_M)));
    g.strokeStyle=shade(col,-30); g.lineWidth=1;
    for(var i=1;i<nseat;i++){ var xx=sx+sw*(i/nseat); g.beginPath(); g.moveTo(xx,sy); g.lineTo(xx,sy+sh); g.stroke(); }
    g.strokeStyle=shade(col,-40); rr(g,-w/2,-h/2,w,h,6); g.stroke();
  },
  chair:function(g,w,h,col){
    g.fillStyle=col; rr(g,-w/2,-h/2+h*0.18,w,h*0.82,4); g.fill();
    g.fillStyle=shade(col,-20); rr(g,-w/2,-h/2,w,h*0.2,3); g.fill();
    g.strokeStyle=shade(col,-40); g.lineWidth=1; rr(g,-w/2,-h/2,w,h,4); g.stroke();
  },
  stove:function(g,w,h){
    g.fillStyle='#2b2f36'; rr(g,-w/2,-h/2,w,h,4); g.fill();
    g.strokeStyle='#4b5563'; g.lineWidth=1; rr(g,-w/2,-h/2,w,h,4); g.stroke();
    g.fillStyle='#0f1115'; var r=Math.min(w,h)*0.2;
    [[-w*0.22,-h*0.18],[w*0.22,-h*0.18],[-w*0.22,h*0.2],[w*0.22,h*0.2]].forEach(function(p){ g.beginPath(); g.arc(p[0],p[1],r,0,7); g.fill(); g.strokeStyle='#3a3f48'; g.stroke(); });
  },
  fridge:function(g,w,h){
    g.fillStyle='#e9ecf0'; rr(g,-w/2,-h/2,w,h,4); g.fill();
    g.strokeStyle='#b9c0c9'; g.lineWidth=1; rr(g,-w/2,-h/2,w,h,4); g.stroke();
    g.beginPath(); g.moveTo(-w/2,h*0.05); g.lineTo(w/2,h*0.05); g.stroke();
    g.fillStyle='#9aa3ad'; rr(g,-w/2+3,-h*0.02,3,h*0.18,2); g.fill();
  },
  sink:function(g,w,h){
    g.fillStyle='#d9dde3'; rr(g,-w/2,-h/2,w,h,4); g.fill(); g.strokeStyle='#aab1bb'; g.lineWidth=1; rr(g,-w/2,-h/2,w,h,4); g.stroke();
    g.fillStyle='#aeb6c0'; rr(g,-w/2+w*0.12,-h/2+h*0.18,w*0.5,h*0.64,4); g.fill(); g.strokeStyle='#878f99'; g.stroke();
    g.fillStyle='#6b7280'; g.beginPath(); g.arc(w*0.28,-h*0.1,2.2,0,7); g.fill();
  },
  basin:function(g,w,h){
    g.fillStyle='#eef1f5'; rr(g,-w/2,-h/2,w,h,4); g.fill(); g.strokeStyle='#c2c9d2'; g.lineWidth=1; rr(g,-w/2,-h/2,w,h,4); g.stroke();
    g.fillStyle='#cdd4dd'; g.beginPath(); g.ellipse(0,h*0.05,w*0.32,h*0.3,0,0,7); g.fill(); g.strokeStyle='#aab1bb'; g.stroke();
  },
  toilet:function(g,w,h){
    g.fillStyle='#f6f8fa'; rr(g,-w/2,-h/2,w,h*0.32,3); g.fill(); g.strokeStyle='#c2c9d2'; g.lineWidth=1; g.stroke();
    g.beginPath(); g.ellipse(0,h*0.16,w*0.36,h*0.30,0,0,7); g.fillStyle='#f6f8fa'; g.fill(); g.stroke();
    g.beginPath(); g.ellipse(0,h*0.16,w*0.2,h*0.17,0,0,7); g.strokeStyle='#aab1bb'; g.stroke();
  },
  tub:function(g,w,h){
    g.fillStyle='#e6f1f8'; rr(g,-w/2,-h/2,w,h,8); g.fill(); g.strokeStyle='#b8cad8'; g.lineWidth=1.2; rr(g,-w/2,-h/2,w,h,8); g.stroke();
    rr(g,-w/2+4,-h/2+6,w-8,h-12,7); g.strokeStyle='#9fb6c6'; g.stroke();
  },
  shower:function(g,w,h){
    g.fillStyle='#cfe4f0'; rr(g,-w/2,-h/2,w,h,3); g.fill();
    g.strokeStyle='rgba(120,160,185,0.6)'; g.lineWidth=1; var s=Math.min(w,h)/4;
    for(var x=-w/2+s;x<w/2;x+=s){ g.beginPath(); g.moveTo(x,-h/2); g.lineTo(x,h/2); g.stroke(); }
    for(var y=-h/2+s;y<h/2;y+=s){ g.beginPath(); g.moveTo(-w/2,y); g.lineTo(w/2,y); g.stroke(); }
    g.fillStyle='#9fb6c6'; g.beginPath(); g.arc(0,0,2.6,0,7); g.fill();
  },
  car:function(g,w,h,col){
    g.fillStyle='#eceff2'; rr(g,-w/2,-h/2,w,h,Math.min(h*0.4,16)); g.fill();
    g.strokeStyle='#aab1bb'; g.lineWidth=1.2; rr(g,-w/2,-h/2,w,h,Math.min(h*0.4,16)); g.stroke();
    // kaca depan & belakang
    g.fillStyle='#b9c6d2';
    rr(g,-w/2+w*0.10,-h/2+3,w*0.10,h-6,4); g.fill();
    rr(g,w/2-w*0.20,-h/2+3,w*0.10,h-6,4); g.fill();
    // kabin
    g.fillStyle='#dde3e9'; rr(g,-w/2+w*0.22,-h/2+4,w*0.5,h-8,5); g.fill(); g.strokeStyle='#c2c9d2'; g.stroke();
    // garis tengah
    g.strokeStyle='#cfd5db'; g.beginPath(); g.moveTo(-w/2+w*0.22,0); g.lineTo(w/2-w*0.22,0); g.stroke();
  },
  moto:function(g,w,h){
    g.fillStyle='#2f3640'; rr(g,-w/2,-h/2,w,h,h*0.45); g.fill();
    g.fillStyle='#11151b'; g.beginPath(); g.arc(-w*0.32,0,h*0.32,0,7); g.fill(); g.beginPath(); g.arc(w*0.32,0,h*0.32,0,7); g.fill();
  },
  plant:function(g,w,h){
    var rad=Math.min(w,h)*0.5;
    g.fillStyle='#6b4a2a'; g.beginPath(); g.arc(0,0,rad*0.7,0,7); g.fill();
    shrub(g,0,0,rad*1.1);
  },
  panel:function(g,w,h){
    g.fillStyle='#1b2026'; rr(g,-w/2,-h/2,w,Math.max(h,4),2); g.fill();
    g.strokeStyle='#3a4350'; g.lineWidth=1; g.stroke();
  },
  rug:function(g,w,h,col){
    g.globalAlpha=0.85; g.fillStyle=col; rr(g,-w/2,-h/2,w,h,4); g.fill(); g.globalAlpha=1;
    g.strokeStyle=shade(col,-30); g.lineWidth=1.4; rr(g,-w/2+3,-h/2+3,w-6,h-6,3); g.stroke();
  },
  stairs:function(g,w,h,col){
    g.fillStyle=col; rr(g,-w/2,-h/2,w,h,2); g.fill(); g.strokeStyle=shade(col,-50); g.lineWidth=1;
    var steps=Math.max(3,Math.round(h/12));
    for(var i=1;i<steps;i++){ var yy=-h/2+(h/steps)*i; g.beginPath(); g.moveTo(-w/2,yy); g.lineTo(w/2,yy); g.stroke(); }
    g.strokeStyle='#ffffffcc'; g.lineWidth=1.6; g.beginPath(); g.moveTo(0,h/2-4); g.lineTo(0,-h/2+6); g.moveTo(0,-h/2+6); g.lineTo(-4,-h/2+12); g.moveTo(0,-h/2+6); g.lineTo(4,-h/2+12); g.stroke();
  }
};

/* ---------- pasang override ---------- */
function install(){
  if(typeof window.drawRooms!=='function'||typeof window.drawFurniture!=='function'){ setTimeout(install,300); return; }
  var origRooms=window.drawRooms, origFurn=window.drawFurniture;
  window.drawRooms=function(invZ){ if(window.realisticMode){ drawRoomsReal(invZ); } else { origRooms(invZ); } };
  window.drawFurniture=function(invZ){ if(window.realisticMode){ drawFurnReal(invZ); } else { origFurn(invZ); } };
  styleBtn();
  if(typeof render==='function') render();
}
// drawRooms/drawFurniture didefinisikan sebagai fungsi global di render.js
setTimeout(install, 400);
document.addEventListener('DOMContentLoaded', function(){ setTimeout(styleBtn,500); });
})();
