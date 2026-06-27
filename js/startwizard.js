/* ============================================================
   START WIZARD — "🚀 Mulai Desain Rumah" (untuk pengguna awam)
   Mengumpulkan: Ukuran tanah → Budget → Jumlah kamar → Gaya
   lalu memanggil generateHouse(spec) + tampilkan kelayakan budget.
   ============================================================ */
(function(){
'use strict';

var W = {
  step: 0,
  data: { landW:8, landH:15, budget:500000000, beds:3, floors:1, style:'minimalis' }
};

var STYLE_LIST = [
  ['minimalis','Minimalis Modern','🏠'],
  ['scandinavian','Scandinavian','🪟'],
  ['japandi','Japandi','🎋'],
  ['tropical','Tropical','🌴'],
  ['industrial','Industrial','🧱'],
  ['modern_luxury','Modern Luxury','💎'],
  ['klasik','Klasik','🏛️']
];
var LAND_PRESETS = [[6,12],[6,15],[8,15],[10,15],[10,20],[12,20]];
var BUDGET_PRESETS = [
  [200000000,'200 jt'],[350000000,'350 jt'],[500000000,'500 jt'],
  [750000000,'750 jt'],[1000000000,'1 M'],[1500000000,'1,5 M']
];

// ---- Inject styles once ----
function injectCSS(){
  if(document.getElementById('sw-style'))return;
  var s=document.createElement('style');s.id='sw-style';
  s.textContent=`
  #swOverlay{position:fixed;inset:0;z-index:9500;display:flex;align-items:center;justify-content:center;padding:16px;
    background:rgba(8,10,16,.72);backdrop-filter:blur(6px);font-family:inherit;}
  .sw-card{width:100%;max-width:560px;background:#13151f;border:1px solid #262a3a;border-radius:20px;overflow:hidden;
    box-shadow:0 24px 70px rgba(0,0,0,.6);display:flex;flex-direction:column;max-height:94vh;}
  .sw-head{padding:20px 24px 14px;background:linear-gradient(135deg,#f5a623,#ff7a3c);color:#1a1206;position:relative;}
  .sw-head h2{margin:0;font-size:20px;font-weight:800;letter-spacing:-.3px;}
  .sw-head p{margin:4px 0 0;font-size:13px;opacity:.85;font-weight:600;}
  .sw-x{position:absolute;top:14px;right:16px;width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;
    background:rgba(0,0,0,.18);color:#1a1206;font-size:16px;font-weight:700;}
  .sw-dots{display:flex;gap:6px;margin-top:14px;}
  .sw-dot{height:5px;flex:1;border-radius:3px;background:rgba(0,0,0,.18);transition:.3s;}
  .sw-dot.on{background:#1a1206;}
  .sw-body{padding:24px;overflow-y:auto;}
  .sw-q{font-size:17px;font-weight:800;color:#e8eaf2;margin:0 0 4px;}
  .sw-hint{font-size:12.5px;color:#8a90a6;margin:0 0 18px;line-height:1.5;}
  .sw-chips{display:flex;flex-wrap:wrap;gap:9px;}
  .sw-chip{padding:11px 15px;border-radius:11px;border:1.5px solid #2c3144;background:#1a1d2a;color:#c7ccdb;
    font-size:13.5px;font-weight:700;cursor:pointer;transition:.12s;user-select:none;}
  .sw-chip:hover{border-color:#454c66;}
  .sw-chip.on{border-color:#f5a623;background:rgba(245,166,35,.14);color:#f5a623;}
  .sw-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
  .sw-field label{display:block;font-size:12px;font-weight:700;color:#9aa0b8;margin-bottom:6px;}
  .sw-input{width:100%;box-sizing:border-box;background:#0d0f16;border:1.5px solid #2c3144;border-radius:11px;
    padding:13px 14px;color:#e8eaf2;font-size:16px;font-weight:700;outline:none;}
  .sw-input:focus{border-color:#f5a623;}
  .sw-styles{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .sw-style{display:flex;align-items:center;gap:11px;padding:13px;border-radius:13px;border:1.5px solid #2c3144;
    background:#1a1d2a;cursor:pointer;transition:.12s;}
  .sw-style:hover{border-color:#454c66;}
  .sw-style.on{border-color:#f5a623;background:rgba(245,166,35,.12);}
  .sw-style .ic{font-size:24px;}
  .sw-style .nm{font-size:13.5px;font-weight:700;color:#e8eaf2;}
  .sw-step{display:flex;align-items:center;justify-content:space-between;gap:14px;
    background:#0d0f16;border:1.5px solid #2c3144;border-radius:13px;padding:12px 16px;}
  .sw-step .lbl{font-size:14px;font-weight:700;color:#e8eaf2;}
  .sw-stepper{display:flex;align-items:center;gap:14px;}
  .sw-stepper button{width:36px;height:36px;border-radius:9px;border:1.5px solid #2c3144;background:#1a1d2a;
    color:#f5a623;font-size:20px;font-weight:800;cursor:pointer;line-height:1;}
  .sw-stepper button:active{transform:scale(.94);}
  .sw-stepper .v{font-size:19px;font-weight:800;color:#e8eaf2;min-width:24px;text-align:center;}
  .sw-foot{display:flex;gap:10px;padding:16px 24px 22px;border-top:1px solid #20242f;}
  .sw-btn{flex:1;padding:14px;border-radius:12px;border:none;font-size:15px;font-weight:800;cursor:pointer;transition:.12s;}
  .sw-btn.ghost{background:#1a1d2a;color:#c7ccdb;border:1.5px solid #2c3144;flex:0 0 auto;padding:14px 20px;}
  .sw-btn.primary{background:linear-gradient(135deg,#f5a623,#ff7a3c);color:#1a1206;}
  .sw-btn:active{transform:translateY(1px);}
  .sw-budget-area{font-size:12.5px;color:#8a90a6;margin-top:12px;line-height:1.6;}
  .sw-budget-area b{color:#3ecf8e;}
  /* hasil */
  .sw-result{text-align:center;}
  .sw-badge{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:30px;font-size:15px;font-weight:800;margin:6px 0 14px;}
  .sw-spin{width:46px;height:46px;border:4px solid #2c3144;border-top-color:#f5a623;border-radius:50%;
    animation:swspin .8s linear infinite;margin:24px auto;}
  @keyframes swspin{to{transform:rotate(360deg);}}
  .sw-meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:8px 0 6px;}
  .sw-meta .b{background:#0d0f16;border:1px solid #20242f;border-radius:11px;padding:12px 8px;}
  .sw-meta .n{font-size:20px;font-weight:800;color:#f5a623;}
  .sw-meta .l{font-size:11px;color:#8a90a6;margin-top:2px;}
  /* hero overlay on empty canvas */
  #swHero{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(120% 90% at 50% 0%,#171a26 0%,#0f1118 55%,#0b0d13 100%);overflow:hidden;}
  #swHero::before{content:'';position:absolute;inset:0;opacity:.5;
    background-image:radial-gradient(rgba(255,255,255,.045) 1px,transparent 1px);background-size:26px 26px;
    -webkit-mask-image:radial-gradient(70% 60% at 50% 45%,#000 0%,transparent 80%);mask-image:radial-gradient(70% 60% at 50% 45%,#000 0%,transparent 80%);}
  #swHero .glow{position:absolute;width:520px;height:520px;border-radius:50%;filter:blur(90px);opacity:.22;pointer-events:none;}
  #swHero .glow.g1{background:#f5a623;top:-160px;right:-120px;}
  #swHero .glow.g2{background:#22a3ff;bottom:-180px;left:-120px;opacity:.16;}
  #swHero .hbox{position:relative;z-index:2;text-align:center;width:100%;max-width:400px;margin:0 16px;padding:38px 30px 32px;
    background:linear-gradient(180deg,rgba(24,27,38,.92),rgba(17,19,27,.92));border:1px solid rgba(255,255,255,.08);
    border-radius:26px;box-shadow:0 30px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.05);
    backdrop-filter:blur(10px);opacity:1;animation:swHeroIn .5s cubic-bezier(.2,.8,.2,1);}
  @keyframes swHeroIn{from{transform:translateY(14px) scale(.98);}to{transform:none;}}
  #swHero .badge{width:74px;height:74px;margin:0 auto 18px;border-radius:20px;display:flex;align-items:center;justify-content:center;
    font-size:38px;background:linear-gradient(135deg,#f5a623,#ff7a3c);box-shadow:0 12px 30px rgba(245,166,35,.4);
    animation:swFloat 3.4s ease-in-out infinite;}
  @keyframes swFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
  #swHero h3{margin:0 0 8px;font-size:22px;font-weight:800;letter-spacing:-.4px;color:#f4f6fb;}
  #swHero p{margin:0 auto 18px;font-size:13.5px;color:#9aa0b8;line-height:1.6;max-width:300px;}
  #swHero .pills{display:flex;gap:7px;justify-content:center;margin-bottom:22px;flex-wrap:wrap;}
  #swHero .pill{font-size:11.5px;font-weight:700;color:#c7ccdb;background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:5px 12px;}
  #swHero .hbtn{display:inline-flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;justify-content:center;
    padding:15px 22px;border-radius:14px;border:none;cursor:pointer;
    background:linear-gradient(135deg,#f5a623,#ff7a3c);color:#1a1206;font-size:16px;font-weight:800;
    box-shadow:0 10px 26px rgba(245,166,35,.4);transition:transform .12s,box-shadow .12s;}
  #swHero .hbtn:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgba(245,166,35,.5);}
  #swHero .hbtn:active{transform:translateY(0);}
  #swHero .scanlink{display:inline-flex;align-items:center;gap:6px;margin-top:16px;color:#3ecf8e;
    font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;transition:opacity .12s;}
  #swHero .scanlink:hover{opacity:.8;}
  #swHero .hsmall{display:block;margin-top:14px;font-size:11px;color:#5d6478;}
  #startWizBtn{background:linear-gradient(135deg,#f5a623,#ff7a3c)!important;color:#1a1206!important;font-weight:800!important;border:none!important;}
  @media(max-width:560px){.sw-styles{grid-template-columns:1fr;}.sw-meta{grid-template-columns:1fr 1fr 1fr;}}
  `;
  document.head.appendChild(s);
}

function fmtRp(n){return 'Rp '+Math.round(n).toLocaleString('id-ID');}
function parseBudget(s){
  if(typeof s==='number')return s;
  s=(''+s).toLowerCase();
  var mult=1;
  if(/jt|juta/.test(s))mult=1e6; else if(/milyar|miliar|m/.test(s))mult=1e9;
  s=s.replace(/[a-z\s]/g,'');            // buang huruf & spasi (rp, jt, juta, m…)
  s=s.replace(/\./g,'').replace(',','.'); // ID: titik=ribuan, koma=desimal
  var num=parseFloat(s)||0;
  return Math.round(num*mult);
}

// ---- Public entry ----
window.openStartWizard=function(){
  injectCSS();
  W.step=0;
  var ov=document.getElementById('swOverlay');
  if(ov)ov.remove();
  ov=document.createElement('div');
  ov.id='swOverlay';
  ov.innerHTML='<div class="sw-card"><div class="sw-head">'
    +'<button class="sw-x" onclick="closeStartWizard()">✕</button>'
    +'<h2 id="swTitle">🚀 Mulai Desain Rumah</h2><p id="swSub">Jawab 4 pertanyaan singkat, AI buatkan denah + 3D + RAB</p>'
    +'<div class="sw-dots">'+[0,1,2,3].map(function(i){return '<div class="sw-dot" id="swdot'+i+'"></div>';}).join('')+'</div>'
    +'</div><div class="sw-body" id="swBody"></div>'
    +'<div class="sw-foot" id="swFoot"></div></div>';
  document.body.appendChild(ov);
  ov.addEventListener('mousedown',function(e){if(e.target===ov)closeStartWizard();});
  renderStep();
};
window.closeStartWizard=function(){var o=document.getElementById('swOverlay');if(o)o.remove();};

function setDots(){for(var i=0;i<4;i++){var d=document.getElementById('swdot'+i);if(d)d.classList.toggle('on',i<=W.step);}}

function renderStep(){
  setDots();
  var body=document.getElementById('swBody'), foot=document.getElementById('swFoot');
  var d=W.data;
  if(W.step===0){
    body.innerHTML='<div class="sw-q">Berapa ukuran tanah Anda?</div>'
      +'<div class="sw-hint">Masukkan lebar (menghadap jalan) dan panjang tanah. Belum tahu? Pilih salah satu ukuran umum di bawah.</div>'
      +'<div class="sw-grid2">'
      +'<div class="sw-field"><label>Lebar (m)</label><input class="sw-input" id="swLandW" type="number" inputmode="decimal" value="'+d.landW+'"></div>'
      +'<div class="sw-field"><label>Panjang (m)</label><input class="sw-input" id="swLandH" type="number" inputmode="decimal" value="'+d.landH+'"></div>'
      +'</div>'
      +'<div class="sw-chips">'+LAND_PRESETS.map(function(p){
          var on=(p[0]==d.landW&&p[1]==d.landH);
          return '<div class="sw-chip'+(on?' on':'')+'" onclick="swLand('+p[0]+','+p[1]+')">'+p[0]+' × '+p[1]+' m</div>';
        }).join('')+'</div>';
    foot.innerHTML='<button class="sw-btn primary" onclick="swNext()">Lanjut →</button>';
  } else if(W.step===1){
    body.innerHTML='<div class="sw-q">Berapa budget Anda?</div>'
      +'<div class="sw-hint">Perkiraan dana untuk membangun. Ini dipakai untuk cek kelayakan proyek (sesuai / lebih budget).</div>'
      +'<div class="sw-field" style="margin-bottom:14px;"><label>Budget (Rupiah)</label>'
      +'<input class="sw-input" id="swBudget" inputmode="numeric" value="'+d.budget.toLocaleString('id-ID')+'"></div>'
      +'<div class="sw-chips">'+BUDGET_PRESETS.map(function(p){
          var on=(p[0]==d.budget);
          return '<div class="sw-chip'+(on?' on':'')+'" onclick="swBudget('+p[0]+')">'+p[1]+'</div>';
        }).join('')+'</div>'
      +'<div class="sw-budget-area" id="swBudgetHint"></div>';
    foot.innerHTML='<button class="sw-btn ghost" onclick="swBack()">←</button><button class="sw-btn primary" onclick="swNext()">Lanjut →</button>';
  } else if(W.step===2){
    body.innerHTML='<div class="sw-q">Kebutuhan ruang</div>'
      +'<div class="sw-hint">Tentukan jumlah kamar tidur dan jumlah lantai rumah Anda. Jumlah kamar mandi disesuaikan otomatis.</div>'
      +'<div class="sw-step"><div class="lbl">🛏️ Kamar Tidur</div>'
      +'<div class="sw-stepper"><button onclick="swBeds(-1)">−</button><span class="v" id="swBedsV">'+d.beds+'</span><button onclick="swBeds(1)">+</button></div></div>'
      +'<div class="sw-step" style="margin-top:10px;"><div class="lbl">🏢 Jumlah Lantai</div>'
      +'<div class="sw-stepper"><button onclick="swFloors(-1)">−</button><span class="v" id="swFloorsV">'+d.floors+'</span><button onclick="swFloors(1)">+</button></div></div>';
    foot.innerHTML='<button class="sw-btn ghost" onclick="swBack()">←</button><button class="sw-btn primary" onclick="swNext()">Lanjut →</button>';
  } else if(W.step===3){
    body.innerHTML='<div class="sw-q">Pilih gaya rumah</div>'
      +'<div class="sw-hint">Gaya menentukan tampilan, material, dan perkiraan biaya per m².</div>'
      +'<div class="sw-styles">'+STYLE_LIST.map(function(s){
          var on=(s[0]===d.style);
          return '<div class="sw-style'+(on?' on':'')+'" onclick="swStyle(\''+s[0]+'\')"><span class="ic">'+s[2]+'</span><span class="nm">'+s[1]+'</span></div>';
        }).join('')+'</div>';
    foot.innerHTML='<button class="sw-btn ghost" onclick="swBack()">←</button><button class="sw-btn primary" onclick="swGenerate()">✨ Buatkan Desain Saya</button>';
  }
}

// step inputs
window.swLand=function(w,h){W.data.landW=w;W.data.landH=h;renderStep();};
window.swBudget=function(v){W.data.budget=v;var el=document.getElementById('swBudget');if(el)el.value=v.toLocaleString('id-ID');updateBudgetHint();document.querySelectorAll('#swBody .sw-chip').forEach(function(c){c.classList.toggle('on',c.textContent.trim()===(BUDGET_PRESETS.find(function(p){return p[0]==v;})||[])[1]);});};
window.swBeds=function(dlt){W.data.beds=Math.max(1,Math.min(6,W.data.beds+dlt));document.getElementById('swBedsV').textContent=W.data.beds;};
window.swFloors=function(dlt){W.data.floors=Math.max(1,Math.min(3,W.data.floors+dlt));document.getElementById('swFloorsV').textContent=W.data.floors;};
window.swStyle=function(id){W.data.style=id;document.querySelectorAll('.sw-style').forEach(function(e){e.classList.remove('on');});event.currentTarget.classList.add('on');};

function readStepInputs(){
  if(W.step===0){
    var w=parseFloat((document.getElementById('swLandW')||{}).value);
    var h=parseFloat((document.getElementById('swLandH')||{}).value);
    if(w>0)W.data.landW=w; if(h>0)W.data.landH=h;
  } else if(W.step===1){
    var b=parseBudget((document.getElementById('swBudget')||{}).value);
    if(b>0)W.data.budget=b;
  }
}
window.swNext=function(){readStepInputs();W.step++;renderStep();if(W.step===1)updateBudgetHint();};
window.swBack=function(){readStepInputs();W.step--;renderStep();};

function estCpm(style){
  var base=5000000;
  var cm=(typeof cityMultiplier!=='undefined'&&cityMultiplier[(typeof val==='function'&&val('citySelect'))||'jakarta'])||1;
  var f={minimalis:1.0,scandinavian:1.06,japandi:1.12,industrial:1.0,tropical:1.02,modern_luxury:1.55,klasik:1.4}[style]||1;
  return Math.round(base*cm*f);
}
function updateBudgetHint(){
  var el=document.getElementById('swBudgetHint');if(!el)return;
  var cpm=estCpm(W.data.style);
  var area=Math.max(21,Math.round(W.data.budget/cpm));
  el.innerHTML='💡 Dengan '+fmtRp(W.data.budget)+' (≈ '+fmtRp(cpm)+'/m² gaya '+W.data.style.replace('_',' ')+'), Anda bisa membangun sekitar <b>'+area+' m²</b>.';
}

// ---- Generate ----
window.swGenerate=function(){
  readStepInputs();
  var d=W.data;
  // simpan budget ke dashboard kelayakan (RAB)
  if(typeof setProjectBudget==='function'){window.projectBudget=d.budget;try{localStorage.setItem('rd3d_budget',d.budget);}catch(e){}}
  else{window.projectBudget=d.budget;}
  // derive sisanya otomatis
  var baths=Math.max(1,Math.round(d.beds/2));
  var landArea=d.landW*d.landH;
  var floorsN=Math.max(1,Math.min(3,d.floors||1));
  var roof=(typeof styleRoof==='function')?styleRoof(d.style):'pelana';

  var spec={landW:d.landW,landH:d.landH,beds:d.beds,baths:baths,floors:floorsN,
            garage:true,roof:roof,style:d.style,budget:d.budget,extras:{}};

  // loading state
  var body=document.getElementById('swBody'), foot=document.getElementById('swFoot');
  document.getElementById('swTitle').textContent='✨ Membuat desain…';
  document.getElementById('swSub').textContent='Menyusun denah, 3D & menghitung RAB';
  body.innerHTML='<div class="sw-result"><div class="sw-spin"></div><div class="sw-hint" style="text-align:center;">Menata '+d.beds+' kamar di tanah '+d.landW+'×'+d.landH+' m…</div></div>';
  foot.innerHTML='';

  setTimeout(function(){
    var res;
    try{ res=generateHouse(spec); }
    catch(e){ body.innerHTML='<div class="sw-hint" style="color:#e8523a;">Gagal membuat desain: '+e.message+'</div>';
      foot.innerHTML='<button class="sw-btn ghost" onclick="swBack()">←</button>'; return; }
    showResult(spec,res);
  },550);
};

function showResult(spec,res){
  var grand=0;
  try{ var rab=(typeof getRABForPDF==='function')?getRABForPDF():null; grand=rab?rab.grand:0; }catch(e){}
  var diff=spec.budget-grand, ok=diff>=0;
  var pct=grand>0?Math.round(Math.abs(diff)/spec.budget*100):0;

  document.getElementById('swTitle').textContent='🎉 Desain Anda siap!';
  document.getElementById('swSub').textContent='Denah otomatis dibuat — lihat hasil di bawah';

  var badge = ok
    ? '<div class="sw-badge" style="background:rgba(62,207,142,.16);color:#3ecf8e;">🟢 Sesuai Budget</div>'
    : '<div class="sw-badge" style="background:rgba(232,82,58,.16);color:#ff6b52;">🔴 Melebihi Budget '+pct+'%</div>';

  var sisaLine = grand>0
    ? (ok ? 'Sisa dana ± <b style="color:#3ecf8e;">'+fmtRp(diff)+'</b>'
          : 'Perlu tambahan ± <b style="color:#ff6b52;">'+fmtRp(-diff)+'</b>')
    : 'Tambahkan material untuk estimasi lebih akurat.';

  var body=document.getElementById('swBody');
  body.innerHTML='<div class="sw-result">'
    +badge
    +'<div class="sw-meta">'
      +'<div class="b"><div class="n">'+(res.totalRooms||'-')+'</div><div class="l">Ruangan</div></div>'
      +'<div class="b"><div class="n">'+(res.floors||1)+'</div><div class="l">Lantai</div></div>'
      +'<div class="b"><div class="n">'+(res.area?Math.round(res.area):'-')+'</div><div class="l">m² bangunan</div></div>'
    +'</div>'
    +'<div class="sw-budget-area" style="text-align:center;margin-top:10px;">'
      +'Estimasi biaya: <b style="color:#e8eaf2;">'+fmtRp(grand)+'</b> · Budget: '+fmtRp(spec.budget)+'<br>'+sisaLine
    +'</div></div>';

  var foot=document.getElementById('swFoot');
  foot.innerHTML='<button class="sw-btn ghost" onclick="closeStartWizard()">Tutup</button>'
    +'<button class="sw-btn primary" onclick="closeStartWizard();swView3D()">🎲 Lihat 3D</button>'
    +'<button class="sw-btn ghost" onclick="closeStartWizard();swViewRAB()" style="flex:0 0 auto;">📋 RAB</button>';
  refreshStartHero();
}
window.swView3D=function(){ if(typeof setView==='function')setView('3d'); };
window.swViewRAB=function(){ if(typeof setView==='function')setView('rab'); };

// ---- Hero overlay on empty canvas ----
function isEmpty(){
  try{ return !(typeof floors!=='undefined' && floors.some(function(f){return f.rooms&&f.rooms.length;})); }
  catch(e){ return false; }
}
window.refreshStartHero=function(){
  var wrap=document.getElementById('canvasWrap');if(!wrap)return;
  var hero=document.getElementById('swHero');
  if(isEmpty()){
    if(!hero){
      injectCSS();
      hero=document.createElement('div');hero.id='swHero';
      hero.innerHTML='<div class="glow g1"></div><div class="glow g2"></div>'
        +'<div class="hbox"><div class="badge">🏡</div>'
        +'<h3>Mulai Desain Rumah Anda</h3>'
        +'<p>Masukkan ukuran tanah, budget & jumlah kamar — AI buatkan denah, 3D, dan estimasi biaya (RAB) otomatis.</p>'
        +'<div class="pills"><span class="pill">📐 Denah</span><span class="pill">🎲 3D</span><span class="pill">💰 RAB</span></div>'
        +'<button class="hbtn" onclick="openStartWizard()">🚀 Mulai Desain Rumah</button>'
        +'<a class="scanlink" onclick="openScanPlan()">📷 atau Scan foto denah / sertifikat</a>'
        +(window.hasAutosaveSession&&window.hasAutosaveSession()?'<a class="scanlink" style="color:#9aa0b8;margin-top:8px;" onclick="continueAutosaveSession()">↩️ Lanjutkan sesi terakhir</a>':'')
        +'<span class="hsmall">Gratis · tanpa software berat · langsung dari HP</span></div>';
      wrap.appendChild(hero);
    }
    hero.style.display='flex';
  } else if(hero){ hero.style.display='none'; }
};

// boot
document.addEventListener('DOMContentLoaded',function(){
  injectCSS();
  setTimeout(refreshStartHero,800);
});
})();
