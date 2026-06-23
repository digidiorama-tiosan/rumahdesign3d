(function(){'use strict';
var ROOM_PRESETS={
  rumah:{types:['Ruang Tamu','Kamar Tidur','Dapur','Kamar Mandi','Ruang Makan','Garasi','Teras','Taman','Gudang'],sizes:{'Ruang Tamu':[200,160],'Kamar Tidur':[160,160],'Dapur':[160,120],'Kamar Mandi':[80,80],'Ruang Makan':[160,120],'Garasi':[200,120],'Teras':[200,80],'Taman':[200,140],'Gudang':[80,100]},defaultRooms:[{type:'Ruang Tamu',w:200,h:160},{type:'Kamar Tidur',w:160,h:160},{type:'Dapur',w:160,h:120},{type:'Kamar Mandi',w:80,h:80}]},
  toko:{types:['Area Penjualan','Ruang Kasir','Gudang (Toko)','Toilet (Toko)','Ruang Karyawan','Teras/Parkir','Dapur/Pantry'],sizes:{'Area Penjualan':[300,200],'Ruang Kasir':[100,80],'Gudang (Toko)':[120,100],'Toilet (Toko)':[80,80],'Ruang Karyawan':[120,80],'Teras/Parkir':[200,80],'Dapur/Pantry':[120,80]},defaultRooms:[{type:'Area Penjualan',w:300,h:200},{type:'Ruang Kasir',w:100,h:80},{type:'Gudang (Toko)',w:120,h:100},{type:'Toilet (Toko)',w:80,h:80},{type:'Ruang Karyawan',w:120,h:80},{type:'Teras/Parkir',w:200,h:80}]},
  masjid:{types:['Ruang Sholat','Tempat Wudhu Pria','Tempat Wudhu Wanita','Selasar/Teras','Ruang Imam','Menara','Ruang Penyimpanan'],sizes:{'Ruang Sholat':[400,300],'Tempat Wudhu Pria':[200,120],'Tempat Wudhu Wanita':[200,120],'Selasar/Teras':[400,80],'Ruang Imam':[80,80],'Menara':[60,60],'Ruang Penyimpanan':[80,100]},defaultRooms:[{type:'Ruang Sholat',w:400,h:300},{type:'Tempat Wudhu Pria',w:200,h:120},{type:'Tempat Wudhu Wanita',w:200,h:120},{type:'Selasar/Teras',w:400,h:80},{type:'Ruang Imam',w:80,h:80},{type:'Menara',w:60,h:60}]}
};

window.buildingType='rumah';
window.BUILDING_ROOM_SIZES={'Area Penjualan':[300,200],'Ruang Kasir':[100,80],'Gudang (Toko)':[120,100],'Toilet (Toko)':[80,80],'Ruang Karyawan':[120,80],'Teras/Parkir':[200,80],'Dapur/Pantry':[120,80],'Ruang Sholat':[400,300],'Tempat Wudhu Pria':[200,120],'Tempat Wudhu Wanita':[200,120],'Selasar/Teras':[400,80],'Ruang Imam':[80,80],'Menara':[60,60],'Ruang Penyimpanan':[80,100]};

var _origNewProject=null;

function injectModal(){
  var s=document.createElement('style');
  s.textContent='.btype-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0;}.btype-card{background:var(--surface2,#1a1d2e);border:2px solid var(--border,#2a2d3e);border-radius:12px;padding:18px 12px;text-align:center;cursor:pointer;transition:border-color .2s,transform .15s;}.btype-card:hover{border-color:var(--accent,#f5a623);transform:translateY(-2px);}.btype-icon{font-size:36px;margin-bottom:8px;}.btype-name{font-size:15px;font-weight:700;color:var(--text,#e2e8f0);margin-bottom:4px;}.btype-desc{font-size:11px;color:var(--text3,#8892a4);}';
  document.head.appendChild(s);
  var m=document.createElement('div');
  m.id='buildingTypeModal';m.className='modal-overlay';
  m.innerHTML='<div class="modal-box" style="max-width:480px;"><div class="modal-title">🏗️ Pilih Jenis Bangunan</div><div class="btype-grid"><div class="btype-card" onclick="selectBuildingType(\'rumah\')"><div class="btype-icon">🏠</div><div class="btype-name">Rumah</div><div class="btype-desc">Rumah tinggal, villa, kos-kosan</div></div><div class="btype-card" onclick="selectBuildingType(\'toko\')"><div class="btype-icon">🏪</div><div class="btype-name">Toko / Ritel</div><div class="btype-desc">Minimarket, toko, restoran, kantor</div></div><div class="btype-card" onclick="selectBuildingType(\'masjid\')"><div class="btype-icon">🕌</div><div class="btype-name">Masjid / Mushola</div><div class="btype-desc">Masjid, mushola, langgar, surau</div></div></div><button class="floor-act" style="width:100%;" onclick="document.getElementById(\'buildingTypeModal\').classList.remove(\'show\')">✕ Batal</button></div>';
  document.body.appendChild(m);
}

function patchNewProject(){
  var wait=setInterval(function(){
    if(typeof window.newProject==='function'){
      clearInterval(wait);
      _origNewProject=window.newProject;
      window.newProject=function(silent){
        if(silent){_origNewProject(true);return;}
        if(typeof floors!=='undefined'&&floors.some(function(f){return f.rooms.length||(f.wallSegs&&f.wallSegs.length);})){
          if(!confirm('Mulai proyek baru? Kanvas akan dikosongkan.'))return;
        }
        document.getElementById('buildingTypeModal').classList.add('show');
      };
    }
  },120);
}

window.selectBuildingType=function(type){
  window.buildingType=type;
  document.getElementById('buildingTypeModal').classList.remove('show');
  if(_origNewProject)_origNewProject(true);
  updateRoomDropdown();
  updateBuildingTypeIndicator();
  var preset=ROOM_PRESETS[type];
  if(preset&&type!=='rumah'){
    var label=type==='toko'?'Toko/Ritel':'Masjid/Mushola';
    if(confirm('Tambahkan ruangan '+label+' secara otomatis?')){applyDefaultRooms(preset);}
  }
  if(typeof showNotif==='function')showNotif('🏗️ Mode: '+(type==='rumah'?'Rumah':type==='toko'?'Toko/Ritel':'Masjid/Mushola'));
};

function applyDefaultRooms(preset){
  var PX=typeof PX_PER_M!=='undefined'?PX_PER_M:20;
  var cols=typeof roomColors!=='undefined'?roomColors:['#4a9eff','#3ecf8e','#f5a623','#e8523a','#a78bfa','#f472b6','#34d399','#fb923c'];
  preset.defaultRooms.forEach(function(rm,i){rooms.push({id:Date.now()+i+Math.random(),type:rm.type,x:80,y:80,w:rm.w,h:rm.h,color:cols[i%cols.length]});});
  if(typeof autoArrangeByBuildingType==='function')autoArrangeByBuildingType();
  else if(typeof autoArrangeRooms==='function')autoArrangeRooms();
  if(typeof updateRoomList==='function')updateRoomList();
  if(typeof recalcRAB==='function')recalcRAB();
  if(typeof render==='function')render();
}

function updateRoomDropdown(){
  var sel=document.getElementById('newRoomType');
  if(!sel)return;
  var preset=ROOM_PRESETS[window.buildingType||'rumah'];
  if(!preset)return;
  sel.innerHTML=preset.types.map(function(t){return'<option value="'+t+'">'+t+'</option>';}).join('');
}

function updateBuildingTypeIndicator(){
  var el=document.getElementById('buildingTypeIndicator');
  if(!el)return;
  var labels={rumah:'🏠 Rumah',toko:'🏪 Toko',masjid:'🕌 Masjid'};
  el.textContent=labels[window.buildingType]||'🏠 Rumah';
}

window.autoArrangeByBuildingType=function(){
  var type=window.buildingType||'rumah';
  if(type==='toko')autoArrangeStore();
  else if(type==='masjid')autoArrangeMasjid();
  else if(typeof autoArrangeRooms==='function')autoArrangeRooms();
};

function autoArrangeStore(){
  if(!rooms||!rooms.length){if(typeof showNotif==='function')showNotif('⚠️ Belum ada ruangan');return;}
  if(typeof saveSnapshot==='function')saveSnapshot();
  var ox=80,oy=80;
  var penjualan=rooms.find(function(r){return r.type.includes('Penjualan');});
  var kasir=rooms.find(function(r){return r.type.includes('Kasir');});
  var gudang=rooms.find(function(r){return r.type.includes('Gudang');});
  var teras=rooms.find(function(r){return r.type.includes('Teras')||r.type.includes('Parkir');});
  var toilet=rooms.find(function(r){return r.type.includes('Toilet');});
  var karyawan=rooms.find(function(r){return r.type.includes('Karyawan');});
  var dapur=rooms.find(function(r){return r.type.includes('Dapur')||r.type.includes('Pantry');});
  var y=oy;
  if(teras){teras.x=ox;teras.y=y;y+=teras.h+4;}
  if(penjualan){penjualan.x=ox;penjualan.y=y;}
  if(kasir&&penjualan){kasir.x=penjualan.x+penjualan.w+4;kasir.y=penjualan.y;}
  var backY=(penjualan?penjualan.y+penjualan.h+4:y+120);
  var backX=ox;
  [gudang,karyawan,toilet,dapur].filter(Boolean).forEach(function(r){r.x=backX;r.y=backY;backX+=r.w+4;});
  if(typeof updateRoomList==='function')updateRoomList();
  if(typeof recalcRAB==='function')recalcRAB();
  if(typeof render==='function')render();
  if(typeof showNotif==='function')showNotif('🏪 Ruangan toko ditata otomatis');
}

function autoArrangeMasjid(){
  if(!rooms||!rooms.length){if(typeof showNotif==='function')showNotif('⚠️ Belum ada ruangan');return;}
  if(typeof saveSnapshot==='function')saveSnapshot();
  var ox=80,oy=80;
  var sholat=rooms.find(function(r){return r.type.includes('Sholat');});
  var selasar=rooms.find(function(r){return r.type.includes('Selasar')||r.type.includes('Teras');});
  var wudhuP=rooms.find(function(r){return r.type.includes('Wudhu Pria')||r.type.includes('Wudhu')&&!r.type.includes('Wanita');});
  var wudhuW=rooms.find(function(r){return r.type.includes('Wanita');});
  var imam=rooms.find(function(r){return r.type.includes('Imam');});
  var menara=rooms.find(function(r){return r.type.includes('Menara');});
  var simpan=rooms.find(function(r){return r.type.includes('Simpan')||r.type.includes('Penyimpanan');});
  var y=oy;
  if(selasar){selasar.x=ox;selasar.y=y;y+=selasar.h+4;}
  if(imam){imam.x=ox+(sholat?sholat.w/2-imam.w/2:80);imam.y=y;y+=imam.h+4;}
  if(sholat){sholat.x=ox;sholat.y=y;}
  if(menara&&selasar){menara.x=selasar.x+selasar.w+4;menara.y=selasar.y;}
  var backY=(sholat?sholat.y+sholat.h+4:y+200);
  var backX=ox;
  [wudhuP,wudhuW,simpan].filter(Boolean).forEach(function(r){r.x=backX;r.y=backY;backX+=r.w+4;});
  if(typeof updateRoomList==='function')updateRoomList();
  if(typeof recalcRAB==='function')recalcRAB();
  if(typeof render==='function')render();
  if(typeof showNotif==='function')showNotif('🕌 Ruangan masjid ditata otomatis');
}

document.addEventListener('DOMContentLoaded',function(){
  injectModal();
  patchNewProject();
});
})();
