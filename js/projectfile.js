/* ============================================================
   PROJECT FILE — Simpan / Buka proyek sebagai FILE (.rumah3d)
   - Desktop (Chrome/Edge): pilih folder & nama file (File System Access API)
   - HP / browser lain: unduh file + buka via pemilih file
   - Auto-save ke localStorage → refresh tidak kehilangan pekerjaan
   - Bisa menyimpan desain yang BELUM selesai, lalu dibuka lagi utuh
   ============================================================ */
(function(){
'use strict';
var FS_OK = (typeof window.showSaveFilePicker === 'function');
var _fileHandle = null;            // ingat file terakhir (untuk simpan ulang cepat)
var AUTOSAVE_KEY = 'rumah3d_autosave_v1';

function notif(m){ if(typeof showNotif==='function')showNotif(m); }

function stateJSON(){
  var st = (typeof getProjectState==='function') ? getProjectState() : {};
  st.projectBudget = window.projectBudget || 0;
  st.app = 'RumahDesign3D';
  st.fileVersion = 1;
  return JSON.stringify(st);
}

function pad(n){ return (''+n).padStart(2,'0'); }
function defaultName(){
  var d=new Date();
  return 'Proyek-Rumah-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes());
}

function writeAutosave(json){ try{ localStorage.setItem(AUTOSAVE_KEY, json||stateJSON()); }catch(e){} }

// ---- SIMPAN ----
async function saveToFile(saveAs){
  var json = stateJSON();
  writeAutosave(json);                 // selalu simpan salinan lokal (jaring pengaman)

  if(FS_OK){
    try{
      var handle = _fileHandle;
      if(saveAs || !handle){
        handle = await window.showSaveFilePicker({
          suggestedName: defaultName()+'.rumah3d',
          types:[{description:'Proyek RumahDesign3D', accept:{'application/json':['.rumah3d','.json']}}]
        });
        _fileHandle = handle;
      }
      var w = await handle.createWritable();
      await w.write(json);
      await w.close();
      notif('💾 Tersimpan ke file: '+(handle.name||''));
      return;
    }catch(e){
      if(e && e.name==='AbortError') return;   // user batal — jangan unduh
      // selain itu: jatuh ke metode unduh
    }
  }
  // Fallback: unduh file (HP / browser tanpa File System Access)
  var blob = new Blob([json], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = defaultName()+'.rumah3d';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
  notif('💾 File proyek diunduh ke folder Download');
}

// ---- BUKA ----
async function openFromFile(){
  if(FS_OK){
    try{
      var picked = await window.showOpenFilePicker({
        types:[{description:'Proyek RumahDesign3D', accept:{'application/json':['.rumah3d','.json']}}]
      });
      var handle = picked[0];
      _fileHandle = handle;
      var file = await handle.getFile();
      applyLoaded(await file.text(), file.name);
      return;
    }catch(e){ if(e && e.name==='AbortError') return; }
  }
  var inp = document.createElement('input');
  inp.type='file'; inp.accept='.rumah3d,.json,application/json';
  inp.onchange = function(){
    var f = inp.files && inp.files[0]; if(!f) return;
    var r = new FileReader();
    r.onload = function(){ applyLoaded(r.result, f.name); };
    r.readAsText(f);
  };
  inp.click();
}

function applyLoaded(text, name){
  try{
    var st = JSON.parse(text);
    if(typeof applyProjectState!=='function') throw new Error('applyProjectState tidak tersedia');
    applyProjectState(st);
    if(st.projectBudget){ window.projectBudget = st.projectBudget; try{localStorage.setItem('rd3d_budget', st.projectBudget);}catch(e){} }
    if(typeof recalcRAB==='function') recalcRAB();
    if(typeof refreshStartHero==='function') refreshStartHero();
    writeAutosave(text);
    notif('📂 Proyek dibuka: '+(name||''));
  }catch(e){ notif('⚠️ Gagal membuka file: '+e.message); }
}

// ---- Override tombol toolbar ----
window.saveProject   = function(){ saveToFile(false); };
window.saveProjectAs = function(){ saveToFile(true); };
window.loadProject   = function(){ openFromFile(); };
window.saveAndNew    = function(){ saveToFile(false).then(function(){ if(typeof newProject==='function') newProject(true); }); };

// ---- Ctrl+S = simpan ----
document.addEventListener('keydown', function(e){
  if((e.ctrlKey||e.metaKey) && (e.key==='s'||e.key==='S')){ e.preventDefault(); saveToFile(false); }
});

// ---- Auto-save (debounce) supaya refresh tidak menghilangkan pekerjaan ----
var _t=null;
function scheduleAutosave(){ clearTimeout(_t); _t=setTimeout(function(){ writeAutosave(); }, 1200); }
(function hookAutosave(){
  if(typeof window.afterStateChange==='function'){
    var orig = window.afterStateChange;
    window.afterStateChange = function(){ orig.apply(this, arguments); scheduleAutosave(); };
  } else { setTimeout(hookAutosave, 500); }
})();

// ---- Lanjutkan sesi terakhir (kalau ada auto-save & kanvas masih kosong) ----
window.hasAutosaveSession = function(){ try{ return !!localStorage.getItem(AUTOSAVE_KEY); }catch(e){ return false; } };
window.continueAutosaveSession = function(){
  try{ var j=localStorage.getItem(AUTOSAVE_KEY); if(j) applyLoaded(j, 'sesi terakhir'); }catch(e){}
};
})();
