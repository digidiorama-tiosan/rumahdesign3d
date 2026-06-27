/* ============================================================
   BATAS PROYEK PER PAKET
   - Free      : 2 proyek tersimpan
   - Pro       : 25 proyek
   - Developer : 75 proyek
   Saat kuota penuh, untuk membuat / menyimpan proyek baru
   pengguna diarahkan upgrade paket (atau hapus proyek lama).
   ============================================================ */
(function(){
'use strict';

var LIMITS = { free:2, pro:25, dev:75 };
var REG_KEY = 'rumah3d_projects_v1';
var CUR_KEY = 'rumah3d_proj_cur_v1';

function plan(){
  try{ return (typeof getPlan==='function' && getPlan()) || localStorage.getItem('rumah3d_user_plan') || 'free'; }
  catch(e){ return 'free'; }
}
function planLabel(){ return ({free:'Free',pro:'Pro',dev:'Developer'})[plan()] || 'Free'; }
function limit(){ return LIMITS[plan()] || LIMITS.free; }

function reg(){ try{ return JSON.parse(localStorage.getItem(REG_KEY)||'[]'); }catch(e){ return []; } }
function setReg(a){ try{ localStorage.setItem(REG_KEY, JSON.stringify(a)); }catch(e){} }
function curId(){ try{ return localStorage.getItem(CUR_KEY)||''; }catch(e){ return ''; } }
function setCurId(v){ try{ v?localStorage.setItem(CUR_KEY,v):localStorage.removeItem(CUR_KEY); }catch(e){} }
function notif(m){ if(typeof showNotif==='function') showNotif(m); }

function defaultName(){
  var d=new Date();
  return 'Proyek '+d.toLocaleDateString('id-ID',{day:'numeric',month:'short'})+' '+
         d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
}

// ---- API publik ----
window.rdProjects = {
  count: function(){ return reg().length; },
  limit: limit,
  plan: plan
};

function isCurrentNew(){
  var id = curId();
  return !id || !reg().some(function(p){ return p.id===id; });
}

// Catat proyek tersimpan (buat slot baru bila proyek ini belum terdaftar)
function registerSave(name){
  var list = reg(), id = curId();
  var existing = id && list.filter(function(p){ return p.id===id; })[0];
  if(existing){
    existing.ts = Date.now();
    if(name) existing.name = name;
  }else{
    id = 'p'+Date.now()+Math.floor(Math.random()*10000);
    setCurId(id);
    list.push({ id:id, name:name||defaultName(), ts:Date.now() });
  }
  setReg(list);
  updateMenuCount();
}

// ---- Modal batas tercapai ----
function showLimitModal(verb){
  var ov = document.getElementById('rdLimitOverlay');
  if(ov) ov.remove();
  ov = document.createElement('div');
  ov.id = 'rdLimitOverlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9600;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,10,16,.72);backdrop-filter:blur(6px);';
  ov.innerHTML =
    '<div style="width:100%;max-width:440px;background:#13151f;border:1px solid #262a3a;border-radius:18px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.6);">'
    + '<div style="padding:22px 24px 16px;background:linear-gradient(135deg,#f5a623,#ff7a3c);color:#1a1206;">'
    +   '<div style="font-size:30px;line-height:1;margin-bottom:8px;">📁</div>'
    +   '<div style="font-size:19px;font-weight:800;">Batas proyek tercapai</div>'
    +   '<div style="font-size:13px;font-weight:600;opacity:.85;margin-top:4px;">Paket '+planLabel()+' — maksimal '+limit()+' proyek tersimpan</div>'
    + '</div>'
    + '<div style="padding:20px 24px;color:#c7ccdb;font-size:14px;line-height:1.6;">'
    +   'Anda sudah menyimpan <b style="color:#e8eaf2;">'+reg().length+' dari '+limit()+'</b> proyek. '
    +   'Untuk '+verb+' proyek baru, upgrade ke paket yang lebih tinggi, atau hapus salah satu proyek lama.'
    +   '<div style="margin-top:10px;font-size:12.5px;color:#8a90a6;">⭐ Pro: 25 proyek &nbsp;·&nbsp; 👑 Developer: 75 proyek</div>'
    + '</div>'
    + '<div style="display:flex;gap:10px;padding:0 24px 22px;flex-wrap:wrap;">'
    +   '<button onclick="rdCloseLimit();openProjectManager()" style="flex:1;min-width:130px;padding:13px;border-radius:11px;border:1.5px solid #2c3144;background:#1a1d2a;color:#c7ccdb;font-size:14px;font-weight:700;cursor:pointer;">🗂 Kelola Proyek</button>'
    +   '<button onclick="rdCloseLimit();if(typeof openPlanModal===\'function\')openPlanModal();" style="flex:1;min-width:130px;padding:13px;border-radius:11px;border:none;background:linear-gradient(135deg,#f5a623,#ff7a3c);color:#1a1206;font-size:14px;font-weight:800;cursor:pointer;">⬆ Upgrade Paket</button>'
    + '</div>'
    + '</div>';
  ov.addEventListener('mousedown', function(e){ if(e.target===ov) ov.remove(); });
  document.body.appendChild(ov);
}
window.rdCloseLimit = function(){ var o=document.getElementById('rdLimitOverlay'); if(o)o.remove(); };

// ---- Manager proyek ----
window.openProjectManager = function(){
  var ov = document.getElementById('rdMgrOverlay');
  if(ov) ov.remove();
  ov = document.createElement('div');
  ov.id = 'rdMgrOverlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9600;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,10,16,.72);backdrop-filter:blur(6px);';
  var list = reg().slice().sort(function(a,b){ return b.ts-a.ts; });
  var used = reg().length, max = limit();
  var rowsHtml = list.length ? list.map(function(p){
    var when = new Date(p.ts).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    var isCur = p.id===curId();
    return '<div style="display:flex;align-items:center;gap:12px;padding:11px 13px;border:1px solid #20242f;border-radius:11px;background:#0d0f16;margin-bottom:8px;">'
      + '<div style="width:34px;height:34px;border-radius:9px;background:#1a1d2a;display:flex;align-items:center;justify-content:center;font-size:16px;">🏠</div>'
      + '<div style="flex:1;min-width:0;"><div style="font-size:13.5px;font-weight:700;color:#e8eaf2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+escapeRd(p.name)+(isCur?' <span style="color:#3ecf8e;font-size:11px;">• aktif</span>':'')+'</div>'
      + '<div style="font-size:11.5px;color:#8a90a6;margin-top:1px;">'+when+'</div></div>'
      + '<button onclick="rdDeleteProject(\''+p.id+'\')" title="Hapus slot proyek" style="border:none;background:rgba(232,82,58,.14);color:#ff6b52;width:30px;height:30px;border-radius:8px;font-size:14px;cursor:pointer;">✕</button>'
      + '</div>';
  }).join('') : '<div style="text-align:center;color:#8a90a6;font-size:13px;padding:24px 0;">Belum ada proyek tersimpan.</div>';

  ov.innerHTML =
    '<div style="width:100%;max-width:480px;background:#13151f;border:1px solid #262a3a;border-radius:18px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.6);display:flex;flex-direction:column;max-height:90vh;">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #20242f;">'
    +   '<div><div style="font-size:17px;font-weight:800;color:#e8eaf2;">🗂 Proyek Saya</div>'
    +   '<div style="font-size:12.5px;color:#8a90a6;margin-top:2px;">'+used+' / '+max+' proyek terpakai · Paket '+planLabel()+'</div></div>'
    +   '<button onclick="rdCloseMgr()" style="width:30px;height:30px;border-radius:50%;border:none;background:#1a1d2a;color:#c7ccdb;font-size:16px;cursor:pointer;">✕</button>'
    + '</div>'
    + '<div style="height:5px;background:#1a1d2a;"><div style="height:100%;width:'+Math.min(100,used/max*100)+'%;background:linear-gradient(90deg,#f5a623,#ff7a3c);transition:.3s;"></div></div>'
    + '<div style="padding:16px 22px;overflow-y:auto;">' + rowsHtml + '</div>'
    + (plan()==='free'
        ? '<div style="padding:0 22px 18px;"><button onclick="rdCloseMgr();if(typeof openPlanModal===\'function\')openPlanModal();" style="width:100%;padding:13px;border-radius:11px;border:none;background:linear-gradient(135deg,#f5a623,#ff7a3c);color:#1a1206;font-size:14px;font-weight:800;cursor:pointer;">⬆ Upgrade untuk 25–75 proyek</button></div>'
        : '')
    + '</div>';
  ov.addEventListener('mousedown', function(e){ if(e.target===ov) ov.remove(); });
  document.body.appendChild(ov);
};
window.rdCloseMgr = function(){ var o=document.getElementById('rdMgrOverlay'); if(o)o.remove(); };
window.rdDeleteProject = function(id){
  if(!confirm('Hapus slot proyek ini? File yang sudah Anda simpan di komputer tidak ikut terhapus.')) return;
  setReg(reg().filter(function(p){ return p.id!==id; }));
  if(curId()===id) setCurId('');
  updateMenuCount();
  openProjectManager();
  notif('🗑 Slot proyek dihapus — kuota bertambah');
};

function escapeRd(s){ return String(s||'').replace(/[&<>"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];}); }

// ---- Update label hitungan di menu ----
function updateMenuCount(){
  var el = document.getElementById('rdProjCount');
  if(el) el.textContent = reg().length + ' / ' + limit();
}

// ---- Bungkus fungsi simpan & proyek-baru ----
function gateSaves(){
  var origSave = window.saveProject;
  var origSaveNew = window.saveAndNew;
  var origNew = window.newProject;

  if(typeof origSave==='function'){
    window.saveProject = function(){
      if(isCurrentNew() && reg().length >= limit()){ showLimitModal('menyimpan'); return; }
      registerSave();                          // buat/update slot SEBELUM menyimpan file
      return origSave.apply(this, arguments);
    };
  }

  if(typeof origSaveNew==='function'){
    window.saveAndNew = function(){
      if(isCurrentNew() && reg().length >= limit()){ showLimitModal('menyimpan'); return; }
      registerSave();                          // catat proyek sekarang dulu
      return origSaveNew.apply(this, arguments); // simpan file lalu newProject(true)
    };
  }

  if(typeof origNew==='function'){
    window.newProject = function(skip){
      if(skip!==true && reg().length >= limit()){ showLimitModal('membuat'); return; }
      setCurId('');                            // mulai kanvas baru → lepas slot aktif
      return origNew.apply(this, arguments);
    };
  }
  updateMenuCount();
}

// Tunggu projectfile.js & building-types.js selesai menetapkan fungsinya
function boot(){
  if(typeof window.saveProject==='function' && typeof window.newProject==='function'){
    gateSaves();
  }else{
    setTimeout(boot, 300);
  }
}
setTimeout(boot, 600);
})();
