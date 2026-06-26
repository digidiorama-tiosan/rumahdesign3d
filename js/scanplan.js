/* ============================================================
   SCAN FOTO → AI → DENAH DIGITAL  (Saran #4)
   - Mode "Sertifikat": baca ukuran tanah dari foto sertifikat/surat ukur
   - Mode "Denah": baca denah kertas → ukuran bangunan + daftar ruangan
   Backend: Cloud.scanPlan({imageBase64, mode}) → edge function "scan-plan"
   ============================================================ */
(function(){
'use strict';

var S = { mode:'denah', imgData:null, busy:false, result:null };

function injectCSS(){
  if(document.getElementById('scan-css'))return;
  var s=document.createElement('style');s.id='scan-css';
  s.textContent=`
  #scanOverlay{position:fixed;inset:0;z-index:9500;display:flex;align-items:center;justify-content:center;padding:16px;
    background:rgba(8,10,16,.72);backdrop-filter:blur(6px);font-family:inherit;}
  .scan-card{width:100%;max-width:540px;background:#13151f;border:1px solid #262a3a;border-radius:20px;overflow:hidden;
    box-shadow:0 24px 70px rgba(0,0,0,.6);display:flex;flex-direction:column;max-height:94vh;}
  .scan-head{padding:20px 24px 16px;background:linear-gradient(135deg,#3ecf8e,#22a3ff);color:#04130c;position:relative;}
  .scan-head h2{margin:0;font-size:19px;font-weight:800;}
  .scan-head p{margin:4px 0 0;font-size:12.5px;opacity:.9;font-weight:600;}
  .scan-x{position:absolute;top:14px;right:16px;width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;
    background:rgba(0,0,0,.18);color:#04130c;font-size:16px;font-weight:700;}
  .scan-body{padding:22px 24px;overflow-y:auto;}
  .scan-modes{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;}
  .scan-mode{padding:14px;border-radius:13px;border:1.5px solid #2c3144;background:#1a1d2a;cursor:pointer;text-align:center;transition:.12s;}
  .scan-mode:hover{border-color:#454c66;}
  .scan-mode.on{border-color:#3ecf8e;background:rgba(62,207,142,.12);}
  .scan-mode .ic{font-size:28px;}
  .scan-mode .nm{font-size:13.5px;font-weight:800;color:#e8eaf2;margin-top:4px;}
  .scan-mode .ds{font-size:11px;color:#8a90a6;margin-top:2px;line-height:1.35;}
  .scan-drop{border:2px dashed #2c3144;border-radius:15px;padding:26px 18px;text-align:center;cursor:pointer;transition:.12s;background:#0d0f16;}
  .scan-drop:hover{border-color:#3ecf8e;}
  .scan-drop .di{font-size:40px;margin-bottom:8px;}
  .scan-drop .dt{font-size:14px;font-weight:700;color:#e8eaf2;}
  .scan-drop .dh{font-size:12px;color:#8a90a6;margin-top:4px;}
  .scan-prev{position:relative;border-radius:14px;overflow:hidden;border:1px solid #2c3144;}
  .scan-prev img{width:100%;display:block;max-height:300px;object-fit:contain;background:#000;}
  .scan-prev .chg{position:absolute;top:10px;right:10px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;}
  .scan-foot{display:flex;gap:10px;padding:16px 24px 22px;border-top:1px solid #20242f;}
  .scan-btn{flex:1;padding:14px;border-radius:12px;border:none;font-size:15px;font-weight:800;cursor:pointer;transition:.12s;}
  .scan-btn.ghost{background:#1a1d2a;color:#c7ccdb;border:1.5px solid #2c3144;flex:0 0 auto;padding:14px 18px;}
  .scan-btn.primary{background:linear-gradient(135deg,#3ecf8e,#22a3ff);color:#04130c;}
  .scan-btn:disabled{opacity:.5;cursor:not-allowed;}
  .scan-quota{font-size:12px;color:#8a90a6;margin-top:12px;text-align:center;}
  .scan-spin{width:44px;height:44px;border:4px solid #2c3144;border-top-color:#3ecf8e;border-radius:50%;animation:scspin .8s linear infinite;margin:22px auto;}
  @keyframes scspin{to{transform:rotate(360deg);}}
  .scan-res{background:#0d0f16;border:1px solid #20242f;border-radius:13px;padding:16px;margin-top:4px;}
  .scan-res .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a1d2a;font-size:13px;}
  .scan-res .row:last-child{border-bottom:none;}
  .scan-res .row .k{color:#8a90a6;}
  .scan-res .row .v{color:#e8eaf2;font-weight:700;}
  .scan-roomlist{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
  .scan-roomtag{background:#1a1d2a;border:1px solid #2c3144;border-radius:8px;padding:4px 9px;font-size:11.5px;color:#c7ccdb;}
  .scan-note{font-size:11.5px;color:#8a90a6;margin-top:10px;line-height:1.5;font-style:italic;}
  .scan-warn{font-size:12px;color:#f5a623;background:rgba(245,166,35,.1);border:1px solid rgba(245,166,35,.3);border-radius:10px;padding:10px 12px;margin-top:12px;line-height:1.5;}
  `;
  document.head.appendChild(s);
}

function cloudOn(){ return typeof Cloud!=='undefined' && Cloud.enabled && Cloud.isLoggedIn && Cloud.isLoggedIn(); }

window.openScanPlan=function(){
  injectCSS();
  if(!cloudOn()){
    alert('Fitur Scan butuh login. Silakan masuk dulu di menu Akun, lalu coba lagi.');
    return;
  }
  S={mode:'denah',imgData:null,busy:false,result:null};
  var ov=document.getElementById('scanOverlay'); if(ov)ov.remove();
  ov=document.createElement('div'); ov.id='scanOverlay';
  ov.innerHTML='<div class="scan-card">'
    +'<div class="scan-head"><button class="scan-x" onclick="closeScanPlan()">✕</button>'
    +'<h2>📷 Scan Foto → Denah Otomatis</h2><p>Foto sertifikat tanah atau denah kertas — AI ubah jadi desain digital</p></div>'
    +'<div class="scan-body" id="scanBody"></div>'
    +'<div class="scan-foot" id="scanFoot"></div></div>';
  document.body.appendChild(ov);
  ov.addEventListener('mousedown',function(e){if(e.target===ov)closeScanPlan();});
  renderPick();
  loadQuota();
};
window.closeScanPlan=function(){var o=document.getElementById('scanOverlay');if(o)o.remove();};

function renderPick(){
  var body=document.getElementById('scanBody'), foot=document.getElementById('scanFoot');
  body.innerHTML=''
    +'<div class="scan-modes">'
      +'<div class="scan-mode'+(S.mode==='denah'?' on':'')+'" onclick="scanSetMode(\'denah\')">'
        +'<div class="ic">📐</div><div class="nm">Denah Kertas</div><div class="ds">Foto denah → ruangan + ukuran</div></div>'
      +'<div class="scan-mode'+(S.mode==='sertifikat'?' on':'')+'" onclick="scanSetMode(\'sertifikat\')">'
        +'<div class="ic">📜</div><div class="nm">Sertifikat Tanah</div><div class="ds">Foto sertifikat → ukuran tanah</div></div>'
    +'</div>'
    +(S.imgData
      ? '<div class="scan-prev"><img src="'+S.imgData+'"><button class="chg" onclick="scanPickFile()">Ganti Foto</button></div>'
      : '<div class="scan-drop" onclick="scanPickFile()"><div class="di">📸</div><div class="dt">Ketuk untuk ambil / pilih foto</div><div class="dh">Pastikan foto terang, lurus, & teks terbaca jelas</div></div>')
    +'<div class="scan-quota" id="scanQuota">Memeriksa kuota…</div>'
    +'<input type="file" id="scanFileInput" accept="image/*" capture="environment" style="display:none" onchange="scanOnFile(event)">';
  foot.innerHTML='<button class="scan-btn ghost" onclick="closeScanPlan()">Batal</button>'
    +'<button class="scan-btn primary" id="scanGoBtn" '+(S.imgData?'':'disabled')+' onclick="scanRun()">🔍 Baca dengan AI</button>';
}

window.scanSetMode=function(m){S.mode=m;renderPick();loadQuota();};
window.scanPickFile=function(){var i=document.getElementById('scanFileInput');if(i)i.click();};
window.scanOnFile=function(ev){
  var f=ev.target.files&&ev.target.files[0]; if(!f)return;
  compressImage(f,1280,0.82,function(dataUrl){ S.imgData=dataUrl; renderPick(); loadQuota(); });
};

function compressImage(file,maxDim,quality,cb){
  var img=new Image(), url=URL.createObjectURL(file);
  img.onload=function(){
    var w=img.width,h=img.height,sc=Math.min(1,maxDim/Math.max(w,h));
    var cw=Math.round(w*sc),ch=Math.round(h*sc);
    var cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
    cv.getContext('2d').drawImage(img,0,0,cw,ch);
    URL.revokeObjectURL(url);
    cb(cv.toDataURL('image/jpeg',quality));
  };
  img.onerror=function(){URL.revokeObjectURL(url);alert('Gagal membaca gambar.');};
  img.src=url;
}

function loadQuota(){
  var el=document.getElementById('scanQuota'); if(!el)return;
  Cloud.scanPlan({action:'status'}).then(function(r){
    el.innerHTML='Sisa kuota Scan bulan ini: <b style="color:#3ecf8e;">'+(r.remaining)+'×</b> (paket '+r.plan+')';
  }).catch(function(e){
    el.innerHTML='<span style="color:#f5a623;">'+(/not found|Failed|Edge/i.test(e.message)?'Edge function belum di-deploy / SQL belum dijalankan.':e.message)+'</span>';
  });
}

window.scanRun=function(){
  if(!S.imgData||S.busy)return;
  S.busy=true;
  var body=document.getElementById('scanBody'), foot=document.getElementById('scanFoot');
  body.innerHTML='<div class="scan-spin"></div><div style="text-align:center;color:#8a90a6;font-size:13px;">AI sedang membaca '+(S.mode==='denah'?'denah':'sertifikat')+'…<br>biasanya 5–15 detik</div>';
  foot.innerHTML='';
  Cloud.scanPlan({imageBase64:S.imgData,mode:S.mode}).then(function(r){
    S.busy=false; S.result=r.result; renderResult(r);
  }).catch(function(e){
    S.busy=false;
    var msg=e.message||'Gagal';
    if(/QUOTA_EMPTY/i.test(msg))msg='Kuota Scan bulan ini sudah habis. Upgrade paket untuk kuota lebih banyak.';
    else if(/API key/i.test(msg))msg='Admin belum mengatur API key OpenAI di Panel Admin.';
    body.innerHTML='<div class="scan-warn">❌ '+msg+'</div>';
    foot.innerHTML='<button class="scan-btn ghost" onclick="scanRun()">Coba lagi</button><button class="scan-btn primary" onclick="openScanPlan()">Ulang dari awal</button>';
  });
};

function renderResult(r){
  var d=r.result||{}, body=document.getElementById('scanBody'), foot=document.getElementById('scanFoot');
  var rows='';
  if(d.landW||d.landH) rows+='<div class="row"><span class="k">Ukuran tanah/bangunan</span><span class="v">'+(d.landW||'?')+' × '+(d.landH||'?')+' m</span></div>';
  if(d.luas) rows+='<div class="row"><span class="k">Luas</span><span class="v">'+d.luas+' m²</span></div>';
  if(d.alamat) rows+='<div class="row"><span class="k">Alamat</span><span class="v" style="max-width:60%;text-align:right;">'+d.alamat+'</span></div>';
  var roomTags='';
  if(d.rooms&&d.rooms.length){
    rows+='<div class="row"><span class="k">Jumlah ruangan</span><span class="v">'+d.rooms.length+'</span></div>';
    roomTags='<div class="scan-roomlist">'+d.rooms.map(function(rm){return '<span class="scan-roomtag">'+rm.type+' '+(rm.w||'?')+'×'+(rm.h||'?')+'m</span>';}).join('')+'</div>';
  }
  body.innerHTML='<div style="font-size:15px;font-weight:800;color:#3ecf8e;margin-bottom:10px;">✅ Berhasil dibaca!</div>'
    +'<div class="scan-res">'+(rows||'<div class="row"><span class="k">Hasil</span><span class="v">data terbatas</span></div>')+roomTags+'</div>'
    +(d.catatan?'<div class="scan-note">📝 '+d.catatan+'</div>':'')
    +'<div class="scan-warn">⚠️ Ini hasil perkiraan AI. Periksa & sesuaikan ukuran setelah diterapkan. Sisa kuota: '+(r.remaining!=null?r.remaining+'×':'-')+'</div>';
  foot.innerHTML='<button class="scan-btn ghost" onclick="openScanPlan()">Ulang</button>'
    +'<button class="scan-btn primary" onclick="scanApply()">✅ Terapkan ke Kanvas</button>';
}

window.scanApply=function(){
  var d=S.result; if(!d){return;}
  try{ if(typeof saveSnapshot==='function')saveSnapshot(); }catch(e){}
  // 1) Ukuran tanah
  if(typeof siteplan!=='undefined'){
    if(d.landW>0)siteplan.landW=+d.landW;
    if(d.landH>0)siteplan.landH=+d.landH;
    siteplan.enabled=true;
  }
  // 2) Ruangan (mode denah)
  if(d.rooms&&d.rooms.length&&typeof addRoom==='function'){
    var PX=(typeof PX_PER_M!=='undefined')?PX_PER_M:20;
    var ox=(typeof siteplan!=='undefined'&&siteplan.originX)||80;
    var oy=(typeof siteplan!=='undefined'&&siteplan.originY)||80;
    d.rooms.slice(0,12).forEach(function(rm){
      var w=(rm.w>0?rm.w:3)*PX, h=(rm.h>0?rm.h:3)*PX;
      var x=ox+(rm.x>=0?rm.x*PX:40), y=oy+(rm.y>=0?rm.y*PX:40);
      addRoom(rm.type||'Ruangan', x, y, w, h);
    });
  }
  // 3) Refresh
  if(typeof syncSiteInputs==='function')syncSiteInputs();
  if(typeof updateRoomList==='function')updateRoomList();
  if(typeof updateStats==='function')updateStats();
  if(typeof recalcRAB==='function')recalcRAB();
  if(typeof detectRooms==='function')try{detectRooms();}catch(e){}
  if(typeof render==='function')render();
  if(typeof refreshStartHero==='function')refreshStartHero();
  closeScanPlan();
  if(typeof showNotif==='function')showNotif('✅ Hasil scan diterapkan — periksa & sesuaikan ukuran bila perlu');
};
})();
