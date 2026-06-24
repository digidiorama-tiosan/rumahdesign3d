(function(){'use strict';
var ROOM_PRESETS={
  rumah:{types:['Ruang Tamu','Kamar Tidur','Dapur','Kamar Mandi','Ruang Makan','Garasi','Teras','Taman','Gudang'],sizes:{'Ruang Tamu':[200,160],'Kamar Tidur':[160,160],'Dapur':[160,120],'Kamar Mandi':[80,80],'Ruang Makan':[160,120],'Garasi':[200,120],'Teras':[200,80],'Taman':[200,140],'Gudang':[80,100]},defaultRooms:[{type:'Ruang Tamu',w:200,h:160},{type:'Kamar Tidur',w:160,h:160},{type:'Dapur',w:160,h:120},{type:'Kamar Mandi',w:80,h:80}]},
  toko:{types:['Area Penjualan','Ruang Kasir','Gudang (Toko)','Toilet (Toko)','Ruang Karyawan','Teras/Parkir','Dapur/Pantry'],sizes:{'Area Penjualan':[300,200],'Ruang Kasir':[100,80],'Gudang (Toko)':[120,100],'Toilet (Toko)':[80,80],'Ruang Karyawan':[120,80],'Teras/Parkir':[200,80],'Dapur/Pantry':[120,80]},defaultRooms:[{type:'Area Penjualan',w:300,h:200},{type:'Ruang Kasir',w:100,h:80},{type:'Gudang (Toko)',w:120,h:100},{type:'Toilet (Toko)',w:80,h:80},{type:'Ruang Karyawan',w:120,h:80},{type:'Teras/Parkir',w:200,h:80}]},
  masjid:{types:['Ruang Sholat','Tempat Wudhu Pria','Tempat Wudhu Wanita','Selasar/Teras','Ruang Imam','Menara','Ruang Penyimpanan'],sizes:{'Ruang Sholat':[400,300],'Tempat Wudhu Pria':[200,120],'Tempat Wudhu Wanita':[200,120],'Selasar/Teras':[400,80],'Ruang Imam':[80,80],'Menara':[60,60],'Ruang Penyimpanan':[80,100]},defaultRooms:[{type:'Ruang Sholat',w:400,h:300},{type:'Tempat Wudhu Pria',w:200,h:120},{type:'Tempat Wudhu Wanita',w:200,h:120},{type:'Selasar/Teras',w:400,h:80},{type:'Ruang Imam',w:80,h:80},{type:'Menara',w:60,h:60}]},
  ruko:{types:['Area Toko','Kasir','Gudang Toko','Toilet','Tangga','Dapur','Kamar Tidur','Ruang Keluarga','Teras/Parkir'],sizes:{'Area Toko':[240,300],'Kasir':[80,80],'Gudang Toko':[120,120],'Toilet':[70,70],'Tangga':[80,150],'Dapur':[120,100],'Kamar Tidur':[160,160],'Ruang Keluarga':[200,160],'Teras/Parkir':[240,80]},defaultRooms:[{type:'Teras/Parkir',w:240,h:80},{type:'Area Toko',w:240,h:300},{type:'Kasir',w:80,h:80},{type:'Gudang Toko',w:120,h:120},{type:'Toilet',w:70,h:70},{type:'Tangga',w:80,h:150}]},
  rumah_2lantai:{types:['Ruang Tamu','Kamar Tidur','Dapur','Kamar Mandi','Ruang Makan','Garasi','Teras','Taman','Gudang','Ruang Keluarga','Balkon','Tangga'],sizes:{'Ruang Tamu':[200,160],'Kamar Tidur':[160,160],'Dapur':[160,120],'Kamar Mandi':[80,80],'Ruang Makan':[160,120],'Garasi':[200,120],'Teras':[200,80],'Taman':[200,140],'Gudang':[80,100],'Ruang Keluarga':[200,160],'Balkon':[160,70],'Tangga':[80,150]},floors:2,
    floor1:[{type:'Teras',w:200,h:80},{type:'Ruang Tamu',w:200,h:160},{type:'Ruang Makan',w:160,h:120},{type:'Dapur',w:160,h:120},{type:'Kamar Mandi',w:80,h:80},{type:'Garasi',w:200,h:120},{type:'Tangga',w:80,h:150}],
    floor2:[{type:'Kamar Tidur',w:180,h:170},{type:'Kamar Tidur',w:160,h:160},{type:'Kamar Tidur',w:160,h:160},{type:'Kamar Mandi',w:80,h:80},{type:'Ruang Keluarga',w:200,h:150},{type:'Balkon',w:160,h:70},{type:'Tangga',w:80,h:150}]}
};

function injectModal(){
  var s=document.createElement('style');
  s.textContent='.btype-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0;}.btype-card{background:var(--surface2,#1a1d2e);border:2px solid var(--border,#2a2d3e);border-radius:12px;padding:18px 12px;text-align:center;cursor:pointer;transition:all .15s;}.btype-card:hover{border-color:var(--accent,#f5a623);transform:translateY(-2px);}.btype-icon{font-size:34px;margin-bottom:8px;}.btype-name{font-weight:800;font-size:14px;margin-bottom:4px;color:var(--text,#e8eaf2);}.btype-desc{font-size:11px;color:var(--text3,#9aa0b8);line-height:1.4;}';
  document.head.appendChild(s);
  var m=document.createElement('div');
  m.id='buildingTypeModal';m.className='modal-overlay';
  m.innerHTML='<div class="modal-box" style="max-width:560px;"><div class="modal-title">🏗️ Pilih Jenis Bangunan</div><div class="btype-grid">'+
    '<div class="btype-card" onclick="selectBuildingType(\'rumah\')"><div class="btype-icon">🏠</div><div class="btype-name">Rumah</div><div class="btype-desc">Rumah tinggal, villa, kos</div></div>'+
    '<div class="btype-card" onclick="selectBuildingType(\'rumah_2lantai\')"><div class="btype-icon">🏡</div><div class="btype-name">Rumah 2 Lantai</div><div class="btype-desc">Layout 2 lantai otomatis</div></div>'+
    '<div class="btype-card" onclick="selectBuildingType(\'ruko\')"><div class="btype-icon">🏢</div><div class="btype-name">Ruko</div><div class="btype-desc">Rumah-toko: toko bawah, hunian atas</div></div>'+
    '<div class="btype-card" onclick="selectBuildingType(\'toko\')"><div class="btype-icon">🏪</div><div class="btype-name">Toko / Ritel</div><div class="btype-desc">Minimarket, restoran, kantor</div></div>'+
    '<div class="btype-card" onclick="selectBuildingType(\'masjid\')"><div class="btype-icon">🕌</div><div class="btype-name">Masjid / Mushola</div><div class="btype-desc">Masjid, mushola, langgar</div></div>'+
    '</div><button class="floor-act" style="width:100%;" onclick="document.getElementById(\'buildingTypeModal\').classList.remove(\'show\')">✕ Batal</button></div>';
  document.body.appendChild(m);
}

var _origNewProject=null;
function patchNewProject(){
  var wait=setInterval(function(){
    if(typeof window.newProject==='function'){
      clearInterval(wait);
      _origNewProject=window.newProject;
      window.newProject=function(skip){
        if(skip===true){_origNewProject(true);return;}
        if(typeof floors!=='undefined'&&floors.some(function(f){return f.rooms&&f.rooms.length;})){
          if(!confirm('Mulai proyek baru? Kanvas akan dikosongkan.'))return;
        }
        document.getElementById('buildingTypeModal').classList.add('show');
      };
    }
  },200);
}

window.selectBuildingType=function(type){
  document.getElementById('buildingTypeModal').classList.remove('show');
  var preset=ROOM_PRESETS[type];
  var isMultiFloor=(type==='rumah_2lantai');
  var actualType=isMultiFloor?'rumah':type;
  // mulai proyek baru bersih
  window.buildingType=actualType;
  if(_origNewProject)_origNewProject(true);
  updateRoomDropdown();
  updateBuildingTypeIndicator();

  if(isMultiFloor){
    if(confirm('Buat rumah 2 lantai dengan layout otomatis?'))applyMultiFloor(preset);
  } else if(type!=='rumah'&&preset){
    var label=type==='toko'?'Toko/Ritel':type==='masjid'?'Masjid/Mushola':'Ruko';
    if(confirm('Tambahkan ruangan '+label+' secara otomatis?'))applyDefaultRooms(preset);
  }
  var nm={rumah:'Rumah',rumah_2lantai:'Rumah 2 Lantai',ruko:'Ruko',toko:'Toko/Ritel',masjid:'Masjid/Mushola'};
  if(typeof showNotif==='function')showNotif('🏗️ Mode: '+(nm[type]||'Rumah'));
};

function _pushRooms(arr){
  var cols=typeof roomColors!=='undefined'?roomColors:['#4a9eff','#3ecf8e','#f5a623','#e8523a','#a78bfa','#f472b6','#34d399','#fb923c'];
  arr.forEach(function(rm,i){rooms.push({id:Date.now()+i+Math.random(),type:rm.type,x:80,y:80,w:rm.w,h:rm.h,color:cols[i%cols.length]});});
}

function applyDefaultRooms(preset){
  _pushRooms(preset.defaultRooms);
  if(typeof autoArrangeByBuildingType==='function')autoArrangeByBuildingType();
  else if(typeof autoArrangeRooms==='function')autoArrangeRooms();
  if(typeof updateRoomList==='function')updateRoomList();
  if(typeof recalcRAB==='function')recalcRAB();
  if(typeof render==='function')render();
}

function applyMultiFloor(preset){
  if(typeof saveSnapshot==='function')saveSnapshot();
  // LANTAI 1 (lantai aktif sekarang)
  _pushRooms(preset.floor1);
  if(typeof autoArrangeRooms==='function')autoArrangeRooms();
  // LANTAI 2 — buat langsung via floors[] (tanpa gate fitur)
  if(typeof floors!=='undefined'&&typeof makeFloor==='function'&&typeof syncActive==='function'){
    floors.push(makeFloor('Lantai 2','floor'));
    currentFloorIndex=floors.length-1;
    syncActive();
    _pushRooms(preset.floor2);
    if(typeof autoArrangeRooms==='function')autoArrangeRooms();
    // kembali ke lantai 1 sebagai tampilan awal
    currentFloorIndex=0;
    syncActive();
  } else {
    if(typeof showNotif==='function')showNotif('⚠️ Multi-lantai tidak tersedia — lantai 1 saja');
  }
  if(typeof updateRoomList==='function')updateRoomList();
  if(typeof renderFloorTabs==='function')renderFloorTabs();
  if(typeof updateFloorTabs==='function')updateFloorTabs();
  if(typeof updateStats==='function')updateStats();
  if(typeof recalcRAB==='function')recalcRAB();
  if(typeof render==='function')render();
  if(typeof showNotif==='function')showNotif('✅ Rumah 2 lantai dibuat — ganti lantai di bar bawah');
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
  var labels={rumah:'🏠 Rumah',toko:'🏪 Toko',masjid:'🕌 Masjid',ruko:'🏢 Ruko'};
  el.textContent=labels[window.buildingType]||'🏠 Rumah';
}

window.autoArrangeByBuildingType=function(){
  var type=window.buildingType||'rumah';
  if(type==='toko')autoArrangeStore();
  else if(type==='masjid')autoArrangeMasjid();
  else if(type==='ruko')autoArrangeRuko();
  else if(typeof autoArrangeRooms==='function')autoArrangeRooms();
};

function autoArrangeRuko(){
  // toko di depan, area servis di belakang — pakai packer generik bila ada
  if(typeof autoArrangeRooms==='function'){autoArrangeRooms();return;}
  if(typeof updateRoomList==='function')updateRoomList();
  if(typeof render==='function')render();
}

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
  var wudhuP=rooms.find(function(r){return r.type.includes('Wudhu Pria')||(r.type.includes('Wudhu')&&!r.type.includes('Wanita'));});
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
