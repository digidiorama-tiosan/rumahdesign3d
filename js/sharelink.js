(function(){
'use strict';
// ── Share Desain via Link ─────────────────────────────────

window.shareDesign=function(){
  var CLOUD_ON=typeof Cloud!=='undefined'&&Cloud.enabled&&Cloud.sb;
  if(CLOUD_ON){_shareViaSupabase();}else{_shareViaUrl();}
};

// ── Metode 1: URL (offline, max ~50KB) ────────────────────
function _shareViaUrl(){
  try{
    var state={floors:JSON.parse(JSON.stringify(typeof floors!=='undefined'?floors:[])),siteplan:JSON.parse(JSON.stringify(typeof siteplan!=='undefined'?siteplan:{}))};
    var json=JSON.stringify(state);
    if(json.length>60000){if(typeof showNotif==='function')showNotif('⚠️ Proyek terlalu besar untuk URL — aktifkan Cloud dulu');return;}
    var encoded=btoa(unescape(encodeURIComponent(json)));
    var url=window.location.origin+window.location.pathname+'?share='+encoded;
    _showShareModal(url,'Link aktif selama browser menyimpan URL. Salin & kirim ke klien.');
  }catch(e){if(typeof showNotif==='function')showNotif('Gagal: '+e.message);}
}

// ── Metode 2: Supabase (cloud, unlimited) ─────────────────
async function _shareViaSupabase(){
  if(typeof showNotif==='function')showNotif('⏳ Menyimpan desain ke cloud...');
  try{
    var state={floors:JSON.parse(JSON.stringify(typeof floors!=='undefined'?floors:[])),siteplan:JSON.parse(JSON.stringify(typeof siteplan!=='undefined'?siteplan:{}))};
    var{data,error}=await Cloud.sb.from('shared_designs').insert({project_data:state}).select('id').single();
    if(error)throw error;
    var url=window.location.origin+window.location.pathname+'?view='+data.id;
    _showShareModal(url,'Link aktif 30 hari. Siapa saja yang punya link bisa melihat desain Anda.');
  }catch(e){
    // Fallback to URL method if table doesn't exist
    if(typeof showNotif==='function')showNotif('Cloud error — menggunakan URL saja');
    _shareViaUrl();
  }
}

function _showShareModal(url, note){
  var el=document.getElementById('shareModal');if(el)el.remove();
  var m=document.createElement('div');
  m.id='shareModal';
  m.style.cssText='position:fixed;inset:0;z-index:8300;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML='<div style="background:#161925;border:1px solid #2a2d3e;border-radius:16px;padding:28px;max-width:480px;width:100%;">'+
    '<div style="font-size:17px;font-weight:800;color:#e8eaf2;margin-bottom:8px;">🔗 Bagikan Desain</div>'+
    '<div style="font-size:12px;color:#9aa0b8;margin-bottom:16px;">'+note+'</div>'+
    '<div style="display:flex;gap:8px;margin-bottom:16px;">'+
      '<input id="shareLinkInput" value="'+url+'" readonly style="flex:1;padding:10px;background:#0d0f14;border:1px solid #2a2d3e;border-radius:8px;color:#e8eaf2;font-size:12px;cursor:text;">'+
      '<button onclick="var i=document.getElementById(\'shareLinkInput\');i.select();document.execCommand(\'copy\');this.textContent=\'✓ Disalin!\';setTimeout(()=>this.textContent=\'Salin\',2000)" style="padding:10px 14px;background:#3ecf8e;border:none;color:#000;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;">Salin</button>'+
    '</div>'+
    '<div style="background:#0d0f14;border-radius:8px;padding:10px;font-size:11px;color:#9aa0b8;margin-bottom:16px;">'+
      '💡 Penerima link bisa melihat Preview 3D tanpa perlu akun atau install apapun.'+
    '</div>'+
    '<button onclick="document.getElementById(\'shareModal\').remove()" style="width:100%;padding:10px;background:#252836;border:1px solid #3a3d4e;color:#e2e8f0;border-radius:8px;cursor:pointer;font-weight:600;">Tutup</button>'+
  '</div>';
  document.body.appendChild(m);
  m.addEventListener('click',function(e){if(e.target===m)m.remove();});
  // Auto-select URL
  setTimeout(function(){var i=document.getElementById('shareLinkInput');if(i)i.select();},100);
}

// ── Load shared project on page load ─────────────────────
(function loadSharedOnLoad(){
  var params=new URLSearchParams(window.location.search);
  // URL share method
  var shareData=params.get('share');
  if(shareData){
    try{
      var json=decodeURIComponent(escape(atob(shareData)));
      var state=JSON.parse(json);
      setTimeout(function(){_applySharedState(state,'URL');},1200);
    }catch(e){console.warn('Share load error:',e);}
    return;
  }
  // Supabase view method
  var viewId=params.get('view');
  if(viewId){
    setTimeout(async function(){
      if(typeof Cloud==='undefined'||!Cloud.sb){
        if(typeof showNotif==='function')showNotif('⚠️ Cloud tidak aktif — tidak bisa memuat desain bersama');return;
      }
      try{
        var{data,error}=await Cloud.sb.from('shared_designs').select('project_data').eq('id',viewId).single();
        if(error)throw error;
        _applySharedState(data.project_data,'Cloud');
      }catch(e){if(typeof showNotif==='function')showNotif('Gagal memuat desain: '+e.message);}
    },1500);
  }
})();

function _applySharedState(state,src){
  try{
    if(state.floors&&typeof floors!=='undefined'){
      floors.length=0;
      state.floors.forEach(function(f){floors.push(f);});
      if(typeof currentFloorIndex!=='undefined')currentFloorIndex=0;
      if(typeof syncActive==='function')syncActive();
    }
    if(state.siteplan&&typeof siteplan!=='undefined')Object.assign(siteplan,state.siteplan);
    if(typeof selectedRoom!=='undefined')selectedRoom=null;
    if(typeof render==='function')render();
    if(typeof updateRoomList==='function')updateRoomList();
    if(typeof updateStats==='function')updateStats();
    if(typeof recalcRAB==='function')recalcRAB();
    if(typeof renderWallPanel==='function')renderWallPanel();
    if(typeof showNotif==='function')showNotif('🔗 Desain dibagikan berhasil dimuat ('+src+')');
    // Show view-only banner
    var banner=document.createElement('div');
    banner.style.cssText='position:fixed;top:0;left:0;right:0;z-index:7000;background:linear-gradient(90deg,#f5a623,#ff6b35);color:#000;text-align:center;padding:7px;font-size:13px;font-weight:700;';
    banner.innerHTML='👁️ Mode Lihat Saja — desain ini dibagikan kepada Anda <a href="Floor Planner 2.0.html" style="color:#000;margin-left:16px;text-decoration:underline;">Buat proyek baru →</a>';
    document.body.prepend(banner);
  }catch(e){console.error('Apply shared state error:',e);}
}

})();
