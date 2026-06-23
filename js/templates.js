(function(){
'use strict';
// ── Template Rumah Siap Pakai ──────────────────────────────
var PX=function(){return typeof PX_PER_M!=='undefined'?PX_PER_M:20;};
var RC=function(n){return(typeof roomColors!=='undefined'?roomColors:['#4a9eff','#3ecf8e','#f5a623','#e8523a','#a78bfa','#f472b6','#34d399','#fb923c'])[n%8];};

var TEMPLATES=[
  {id:'t21',name:'Tipe 21',emoji:'🏠',size:'3×7m',land:'6×12m',desc:'Starter home ideal untuk keluarga kecil',
   siteplan:{landW:6,landH:12,gsbFront:2,gsbBack:1,gsbLeft:1,gsbRight:1},
   rooms:[{t:'Ruang Tamu',w:3,h:2},{t:'Kamar Tidur',w:3,h:2.5},{t:'Kamar Mandi',w:1.5,h:1.5},{t:'Dapur',w:3,h:1.5},{t:'Teras',w:3,h:1}]},
  {id:'t36',name:'Tipe 36',emoji:'🏡',size:'6×6m',land:'8×14m',desc:'Rumah subsidi paling populer di Indonesia',
   siteplan:{landW:8,landH:14,gsbFront:3,gsbBack:1.5,gsbLeft:1,gsbRight:1},
   rooms:[{t:'Ruang Tamu',w:3,h:3},{t:'Ruang Makan',w:3,h:2.5},{t:'Kamar Tidur',w:3,h:3},{t:'Kamar Tidur',w:3,h:2.5},{t:'Kamar Mandi',w:1.5,h:2},{t:'Dapur',w:3,h:2.5},{t:'Teras',w:3,h:1.5}]},
  {id:'t45',name:'Tipe 45',emoji:'🏘️',size:'6×7.5m',land:'10×15m',desc:'Rumah menengah dengan 2 kamar nyaman',
   siteplan:{landW:10,landH:15,gsbFront:3,gsbBack:1.5,gsbLeft:1.5,gsbRight:1.5},
   rooms:[{t:'Ruang Tamu',w:4,h:3},{t:'Ruang Makan',w:3,h:3},{t:'Kamar Tidur',w:3.5,h:3.5},{t:'Kamar Tidur',w:3,h:3},{t:'Kamar Mandi',w:2,h:2},{t:'Dapur',w:3,h:2.5},{t:'Teras',w:4,h:1.5},{t:'Garasi',w:3,h:4}]},
  {id:'t54',name:'Tipe 54',emoji:'🏗️',size:'6×9m',land:'12×16m',desc:'3 kamar tidur untuk keluarga berkembang',
   siteplan:{landW:12,landH:16,gsbFront:3,gsbBack:2,gsbLeft:1.5,gsbRight:1.5},
   rooms:[{t:'Ruang Tamu',w:4,h:3.5},{t:'Ruang Makan',w:3,h:3},{t:'Kamar Tidur',w:4,h:3.5},{t:'Kamar Tidur',w:3,h:3},{t:'Kamar Tidur',w:3,h:3},{t:'Kamar Mandi',w:2,h:2},{t:'Kamar Mandi',w:2,h:2},{t:'Dapur',w:3.5,h:3},{t:'Garasi',w:3.5,h:4.5}]},
  {id:'t72',name:'Tipe 72',emoji:'🏰',size:'8×9m',land:'14×18m',desc:'Rumah luas dengan garasi & taman',
   siteplan:{landW:14,landH:18,gsbFront:3,gsbBack:2,gsbLeft:1.5,gsbRight:1.5},
   rooms:[{t:'Ruang Tamu',w:5,h:4},{t:'Ruang Makan',w:4,h:3.5},{t:'Kamar Tidur',w:4,h:4},{t:'Kamar Tidur',w:3.5,h:3.5},{t:'Kamar Tidur',w:3.5,h:3},{t:'Kamar Mandi',w:2,h:2.5},{t:'Kamar Mandi',w:2,h:2},{t:'Dapur',w:4,h:3},{t:'Garasi',w:4,h:5},{t:'Taman',w:4,h:3}]},
  {id:'t90',name:'Tipe 90',emoji:'🏯',size:'9×10m',land:'16×20m',desc:'Rumah mewah 4 kamar untuk keluarga besar',
   siteplan:{landW:16,landH:20,gsbFront:4,gsbBack:2,gsbLeft:2,gsbRight:2},
   rooms:[{t:'Ruang Tamu',w:5,h:4.5},{t:'Ruang Keluarga',w:4,h:4},{t:'Ruang Makan',w:4,h:3.5},{t:'Kamar Tidur',w:4.5,h:4.5},{t:'Kamar Tidur',w:4,h:4},{t:'Kamar Tidur',w:4,h:3.5},{t:'Kamar Tidur',w:3.5,h:3.5},{t:'Kamar Mandi',w:2.5,h:2.5},{t:'Kamar Mandi',w:2,h:2.5},{t:'Dapur',w:4.5,h:3.5},{t:'Garasi',w:5,h:5.5},{t:'Taman',w:5,h:4},{t:'Teras',w:5,h:2}]},
  {id:'toko_s',name:'Toko Kecil',emoji:'🏪',size:'4×8m',land:'5×10m',desc:'Toko/warung kecil dengan gudang',
   siteplan:{landW:5,landH:10,gsbFront:1,gsbBack:1,gsbLeft:0.5,gsbRight:0.5},
   rooms:[{t:'Area Penjualan',w:4,h:5},{t:'Gudang (Toko)',w:4,h:2},{t:'Toilet (Toko)',w:1.5,h:2},{t:'Teras/Parkir',w:4,h:1}]},
  {id:'toko_m',name:'Toko Sedang',emoji:'🏬',size:'8×12m',land:'10×14m',desc:'Minimarket / ruko 2 lantai siap pakai',
   siteplan:{landW:10,landH:14,gsbFront:2,gsbBack:1,gsbLeft:1,gsbRight:1},
   rooms:[{t:'Area Penjualan',w:8,h:7},{t:'Ruang Kasir',w:2.5,h:2},{t:'Gudang (Toko)',w:4,h:4},{t:'Ruang Karyawan',w:3,h:3},{t:'Toilet (Toko)',w:2,h:2},{t:'Dapur/Pantry',w:3,h:2.5},{t:'Teras/Parkir',w:8,h:2}]},
  {id:'masjid_s',name:'Mushola',emoji:'🕌',size:'8×10m',land:'10×12m',desc:'Mushola kecil untuk komplek perumahan',
   siteplan:{landW:10,landH:12,gsbFront:1,gsbBack:1,gsbLeft:1,gsbRight:1},
   rooms:[{t:'Ruang Sholat',w:8,h:7},{t:'Tempat Wudhu Pria',w:3,h:2},{t:'Tempat Wudhu Wanita',w:3,h:2},{t:'Selasar/Teras',w:8,h:2}]},
  {id:'masjid_m',name:'Masjid',emoji:'🕌',size:'15×20m',land:'20×25m',desc:'Masjid dengan kapasitas 200 jamaah',
   siteplan:{landW:20,landH:25,gsbFront:3,gsbBack:2,gsbLeft:2,gsbRight:2},
   rooms:[{t:'Ruang Sholat',w:15,h:14},{t:'Tempat Wudhu Pria',w:6,h:4},{t:'Tempat Wudhu Wanita',w:6,h:4},{t:'Selasar/Teras',w:15,h:3},{t:'Ruang Imam',w:3,h:3},{t:'Menara',w:2.5,h:2.5},{t:'Ruang Penyimpanan',w:3,h:3}]},
];

window.openTemplates=function(){
  var el=document.getElementById('templateModal');
  if(el)el.remove();
  var m=document.createElement('div');
  m.id='templateModal';
  m.style.cssText='position:fixed;inset:0;z-index:8400;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML='<div style="background:#161925;border:1px solid #2a2d3e;border-radius:16px;width:100%;max-width:860px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #2a2d3e;flex-shrink:0;">'+
      '<div><div style="font-size:17px;font-weight:800;color:#e8eaf2;">🏠 Template Bangunan Siap Pakai</div>'+
      '<div style="font-size:12px;color:#9aa0b8;margin-top:2px;">Pilih template → semua ruangan otomatis terbuat</div></div>'+
      '<button onclick="document.getElementById(\'templateModal\').remove()" style="background:#e8523a;border:none;color:#fff;border-radius:8px;padding:6px 14px;cursor:pointer;font-weight:700;">✕ Tutup</button>'+
    '</div>'+
    '<div style="padding:16px;overflow-y:auto;flex:1;">'+
      '<div style="font-size:11px;font-weight:700;color:#9aa0b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;">Rumah Tinggal</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-bottom:20px;">'+
        TEMPLATES.slice(0,6).map(_tplCard).join('')+
      '</div>'+
      '<div style="font-size:11px;font-weight:700;color:#9aa0b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;">Toko & Komersial</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-bottom:20px;">'+
        TEMPLATES.slice(6,8).map(_tplCard).join('')+
      '</div>'+
      '<div style="font-size:11px;font-weight:700;color:#9aa0b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;">Masjid & Mushola</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;">'+
        TEMPLATES.slice(8).map(_tplCard).join('')+
      '</div>'+
    '</div>'+
  '</div>';
  document.body.appendChild(m);
  m.addEventListener('click',function(e){if(e.target===m)m.remove();});
};

function _tplCard(t){
  var rooms=t.rooms;
  return '<div style="background:#111420;border:1px solid #2a2d3e;border-radius:12px;padding:16px;cursor:pointer;transition:border-color .2s,transform .15s;" '+
    'onmouseenter="this.style.borderColor=\'#f5a623\';this.style.transform=\'translateY(-2px)\'" '+
    'onmouseleave="this.style.borderColor=\'#2a2d3e\';this.style.transform=\'none\'" '+
    'onclick="applyTemplate(\''+t.id+'\')">' +
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'+
      '<div style="font-size:28px;">'+t.emoji+'</div>'+
      '<div><div style="font-size:14px;font-weight:800;color:#e8eaf2;">'+t.name+'</div>'+
      '<div style="font-size:11px;color:#f5a623;font-weight:600;">'+t.size+'</div></div>'+
      '<div style="margin-left:auto;font-size:10px;color:#5a607a;text-align:right;">Tanah<br>'+t.land+'</div>'+
    '</div>'+
    '<div style="font-size:11px;color:#9aa0b8;margin-bottom:10px;">'+t.desc+'</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:4px;">'+
      rooms.slice(0,5).map(function(r){return '<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:#1e2235;color:#8892a4;">'+r.t+'</span>';}).join('')+
      (rooms.length>5?'<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:#1e2235;color:#5a607a;">+'+( rooms.length-5)+' lagi</span>':'')+
    '</div>'+
    '<button style="width:100%;margin-top:12px;padding:9px;background:linear-gradient(135deg,#f5a623,#ff6b35);border:none;color:#000;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">Gunakan Template →</button>'+
  '</div>';
}

window.applyTemplate=function(id){
  var tpl=TEMPLATES.find(function(t){return t.id===id;});
  if(!tpl)return;
  if(typeof floors!=='undefined'&&floors.some(function(f){return f.rooms.length||(f.wallSegs&&f.wallSegs.length);})){
    if(!confirm('Gunakan template '+tpl.name+'? Kanvas akan dikosongkan.'))return;
  }
  // Clear project
  if(typeof _origNewProject==='function')_origNewProject(true);
  else if(typeof newProject==='function')newProject(true);

  // Apply siteplan
  var sp=tpl.siteplan;
  if(typeof siteplan!=='undefined'){
    Object.assign(siteplan,{enabled:true,landW:sp.landW,landH:sp.landH,gsbFront:sp.gsbFront,gsbBack:sp.gsbBack,gsbLeft:sp.gsbLeft,gsbRight:sp.gsbRight,showGsb:true});
  }

  // Add rooms
  var P=PX_PER_M||20;
  var ox=siteplan.originX+(sp.gsbLeft||1)*P;
  var oy=siteplan.originY+(sp.gsbFront||2)*P;
  var bw=(sp.landW-(sp.gsbLeft||1)-(sp.gsbRight||1))*P;
  var bh=(sp.landH-(sp.gsbFront||2)-(sp.gsbBack||1))*P;
  var used_w=0,used_h=0,row_h=0;

  tpl.rooms.forEach(function(r,i){
    var rw=r.w*P,rh=r.h*P;
    if(used_w>0&&used_w+rw>bw+4){used_h+=row_h;used_w=0;row_h=0;}
    var color=RC(i);
    var rx=ox+used_w,ry=oy+used_h;
    rx=Math.min(rx,ox+bw-rw);ry=Math.min(ry,oy+bh-rh);
    rooms.push({id:Date.now()+i+Math.random(),type:r.t,x:Math.round(rx),y:Math.round(ry),w:Math.round(rw),h:Math.round(rh),color:color});
    used_w+=rw;row_h=Math.max(row_h,rh);
  });

  if(typeof activeFloor==='function')activeFloor().rooms=rooms;
  if(typeof updateRoomList==='function')updateRoomList();
  if(typeof updateStats==='function')updateStats();
  if(typeof recalcRAB==='function')recalcRAB();
  if(typeof renderSiteplan==='function')renderSiteplan();
  if(typeof render==='function')render();
  document.getElementById('templateModal').remove();
  if(typeof showNotif==='function')showNotif('🏠 Template '+tpl.name+' diterapkan — '+tpl.rooms.length+' ruangan dibuat');
};

})();
