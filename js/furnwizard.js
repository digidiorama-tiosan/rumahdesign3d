(function(){
'use strict';

// ── Preset furnitur per ruangan & gaya ─────────────────────
var PRESETS={
  'Ruang Tamu':{
    icon:'🛋️',
    styles:{
      'Modern':[{id:'sofa3',x:.1,y:.15},{id:'sofa2',x:.6,y:.15},{id:'meja_kopi',x:.35,y:.35},{id:'meja_tv',x:.3,y:.8},{id:'karpet',x:.3,y:.3},{id:'rak_hias',x:.75,y:.75}],
      'Minimalis':[{id:'sofa2',x:.2,y:.15},{id:'meja_kopi',x:.3,y:.38},{id:'meja_tv',x:.3,y:.8},{id:'karpet',x:.25,y:.28}],
      'Skandinavia':[{id:'sofa3',x:.1,y:.12},{id:'meja_kopi',x:.32,y:.36},{id:'ottoman',x:.55,y:.38},{id:'meja_tv',x:.28,y:.78},{id:'karpet',x:.28,y:.28},{id:'rak_hias',x:.78,y:.1}],
      'Japandi':[{id:'sofa2',x:.15,y:.1},{id:'meja_kopi',x:.3,y:.35},{id:'karpet',x:.25,y:.25},{id:'meja_tv',x:.28,y:.78}],
      'Industrial':[{id:'sofa_l',x:.08,y:.1},{id:'meja_kopi',x:.45,y:.45},{id:'meja_tv',x:.3,y:.82},{id:'karpet',x:.3,y:.3}],
      'Mewah':[{id:'sofa3',x:.05,y:.1},{id:'sofa2',x:.6,y:.12},{id:'meja_kopi',x:.32,y:.38},{id:'ottoman',x:.5,y:.38},{id:'meja_tv',x:.28,y:.82},{id:'lemari_tv',x:.28,y:.84},{id:'karpet',x:.28,y:.28},{id:'rak_hias',x:.8,y:.1}]
    }
  },
  'Kamar Tidur':{
    icon:'🛏️',
    styles:{
      'Modern':[{id:'kasur_king',x:.2,y:.1},{id:'nakas',x:.02,y:.08},{id:'nakas',x:.62,y:.08},{id:'lemari_4',x:.7,y:.7},{id:'meja_tv',x:.2,y:.78}],
      'Minimalis':[{id:'kasur_queen',x:.2,y:.1},{id:'nakas',x:.05,y:.08},{id:'lemari_2',x:.72,y:.6}],
      'Skandinavia':[{id:'kasur_queen',x:.2,y:.08},{id:'nakas',x:.04,y:.06},{id:'nakas',x:.6,y:.06},{id:'lemari_4',x:.7,y:.72},{id:'rak_hias',x:.02,y:.6}],
      'Japandi':[{id:'kasur_queen',x:.22,y:.08},{id:'nakas',x:.06,y:.06},{id:'lemari_2',x:.7,y:.62}],
      'Industrial':[{id:'kasur_king',x:.15,y:.08},{id:'nakas',x:.02,y:.06},{id:'lemari_4',x:.72,y:.65}],
      'Mewah':[{id:'kasur_king',x:.15,y:.06},{id:'nakas',x:.02,y:.05},{id:'nakas',x:.68,y:.05},{id:'lemari_6',x:.7,y:.6},{id:'meja_rias',x:.08,y:.65},{id:'meja_tv',x:.2,y:.84}]
    }
  },
  'Dapur':{
    icon:'🍳',
    styles:{
      'Modern':[{id:'kitchen_set',x:.02,y:.02},{id:'kitchen_island',x:.3,y:.45},{id:'kulkas',x:.78,y:.02},{id:'bar_stool',x:.28,y:.68},{id:'bar_stool',x:.4,y:.68}],
      'Minimalis':[{id:'kitchen_set',x:.02,y:.02},{id:'kulkas',x:.78,y:.02}],
      'Skandinavia':[{id:'kitchen_set',x:.02,y:.02},{id:'kulkas',x:.78,y:.02},{id:'bar_table',x:.3,y:.5},{id:'bar_stool',x:.28,y:.68}],
      'Japandi':[{id:'kitchen_set',x:.02,y:.02},{id:'kulkas',x:.78,y:.02}],
      'Industrial':[{id:'kitchen_set',x:.02,y:.02},{id:'kitchen_island',x:.28,y:.42},{id:'kulkas',x:.78,y:.02},{id:'bar_stool',x:.25,y:.65},{id:'bar_stool',x:.42,y:.65}],
      'Mewah':[{id:'kitchen_set',x:.02,y:.02},{id:'kitchen_island',x:.28,y:.38},{id:'kulkas',x:.78,y:.02},{id:'bar_stool',x:.24,y:.62},{id:'bar_stool',x:.4,y:.62},{id:'bar_stool',x:.56,y:.62}]
    }
  },
  'Ruang Makan':{
    icon:'🍽️',
    styles:{
      'Modern':[{id:'meja_makan6',x:.2,y:.2},{id:'kursi_makan',x:.12,y:.18},{id:'kursi_makan',x:.12,y:.38},{id:'kursi_makan',x:.5,y:.18},{id:'kursi_makan',x:.5,y:.38},{id:'buffet',x:.7,y:.6}],
      'Minimalis':[{id:'meja_makan4',x:.25,y:.25},{id:'kursi_makan',x:.18,y:.22},{id:'kursi_makan',x:.18,y:.42},{id:'kursi_makan',x:.48,y:.22},{id:'kursi_makan',x:.48,y:.42}],
      'Skandinavia':[{id:'meja_makan6',x:.18,y:.18},{id:'kursi_makan',x:.1,y:.18},{id:'kursi_makan',x:.1,y:.38},{id:'kursi_makan',x:.52,y:.18},{id:'kursi_makan',x:.52,y:.38},{id:'lemari_pajang',x:.7,y:.1}],
      'Japandi':[{id:'meja_makan4',x:.25,y:.25},{id:'kursi_makan',x:.18,y:.22},{id:'kursi_makan',x:.48,y:.22}],
      'Industrial':[{id:'meja_makan8',x:.1,y:.2},{id:'kursi_makan',x:.05,y:.2},{id:'kursi_makan',x:.05,y:.38},{id:'kursi_makan',x:.62,y:.2},{id:'kursi_makan',x:.62,y:.38},{id:'bar_table',x:.7,y:.7}],
      'Mewah':[{id:'meja_makan8',x:.08,y:.15},{id:'kursi_makan',x:.02,y:.15},{id:'kursi_makan',x:.02,y:.32},{id:'kursi_makan',x:.02,y:.48},{id:'kursi_makan',x:.65,y:.15},{id:'kursi_makan',x:.65,y:.32},{id:'kursi_makan',x:.65,y:.48},{id:'buffet',x:.78,y:.1},{id:'lemari_pajang',x:.78,y:.5}]
    }
  },
  'Kamar Mandi':{
    icon:'🚿',
    styles:{
      'Modern':[{id:'bathtub',x:.1,y:.05},{id:'toilet_duduk',x:.7,y:.05},{id:'wastafel',x:.7,y:.55}],
      'Minimalis':[{id:'shower_area',x:.08,y:.05},{id:'toilet_duduk',x:.65,y:.05},{id:'wastafel',x:.65,y:.58}],
      'Skandinavia':[{id:'bathtub',x:.08,y:.05},{id:'toilet_duduk',x:.68,y:.05},{id:'wastafel',x:.68,y:.58}],
      'Japandi':[{id:'bathtub',x:.08,y:.05},{id:'toilet_duduk',x:.68,y:.05},{id:'wastafel',x:.68,y:.58}],
      'Industrial':[{id:'bathtub',x:.08,y:.05},{id:'toilet_duduk',x:.68,y:.08},{id:'wastafel',x:.68,y:.55}],
      'Mewah':[{id:'bathtub',x:.05,y:.05},{id:'toilet_duduk',x:.72,y:.05},{id:'wastafel',x:.68,y:.5},{id:'wastafel',x:.78,y:.5}]
    }
  }
};

var STYLES=['Modern','Minimalis','Skandinavia','Japandi','Industrial','Mewah'];
var STYLE_COLORS={Modern:'#4a9eff',Minimalis:'#3ecf8e',Skandinavia:'#f5a623',Japandi:'#a78bfa',Industrial:'#8b7355',Mewah:'#ffd700'};
var STYLE_DESC={Modern:'Bersih, garis tegas, furnitur fungsional',Minimalis:'Sederhana, ruang lega, warna netral',Skandinavia:'Kayu natural, putih, nyaman & hangat',Japandi:'Harmoni Jepang-Skandinavia, zen & rapi',Industrial:'Beton, besi, kayu gelap, urban',Mewah:'Elegan, kaya detail, furnitur premium'};

var _wRoomId=null,_wRoomType='Ruang Tamu',_wStyle='Modern',_wShuffled=0;

// ── Public entry ───────────────────────────────────────────
window.openFurnWizard=function(roomId){
  _wRoomId=roomId;
  var r=(typeof rooms!=='undefined'?rooms:[]).find(function(x){return x.id==roomId;});
  if(r){
    // Auto-select room type based on room.type
    var match=Object.keys(PRESETS).find(function(k){return r.type.includes(k.split(' ')[0]);});
    if(match)_wRoomType=match;
  }
  _buildWizard();
};

function _buildWizard(){
  var existing=document.getElementById('furnWizardModal');
  if(existing)existing.remove();

  var m=document.createElement('div');
  m.id='furnWizardModal';
  m.style.cssText='position:fixed;inset:0;z-index:8500;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML='<div style="background:#161925;border:1px solid #2a2d3e;border-radius:16px;width:100%;max-width:900px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #2a2d3e;flex-shrink:0;">'+
      '<div><div style="font-size:17px;font-weight:800;color:#e8eaf2;">🪄 Auto Isi Furnitur</div>'+
      '<div style="font-size:12px;color:#9aa0b8;margin-top:2px;">Pilih jenis ruangan & gaya, lalu terapkan</div></div>'+
      '<button onclick="document.getElementById(\'furnWizardModal\').remove()" style="background:#e8523a;border:none;color:#fff;border-radius:8px;padding:6px 14px;cursor:pointer;font-weight:700;">✕ Tutup</button>'+
    '</div>'+
    '<div style="display:flex;flex:1;overflow:hidden;min-height:0;">'+
      '<div style="flex:1;padding:16px;overflow-y:auto;display:flex;flex-direction:column;gap:16px;">'+
        '<div>'+
          '<div style="font-size:11px;font-weight:700;color:#9aa0b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;">Jenis Ruangan</div>'+
          '<div id="wzRoomTabs" style="display:flex;gap:8px;flex-wrap:wrap;">'+
            Object.keys(PRESETS).map(function(k){
              return '<button onclick="wzSetRoom(\''+k+'\')" id="wzrt_'+k.replace(/ /g,'_')+'" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 14px;border-radius:10px;border:2px solid '+(_wRoomType===k?'#f5a623':'#2a2d3e')+';background:'+(_wRoomType===k?'rgba(245,166,35,.12)':'#111420')+';color:'+(_wRoomType===k?'#f5a623':'#9aa0b8')+';cursor:pointer;font-size:11px;font-weight:700;min-width:72px;transition:all .2s;">'+
              '<span style="font-size:22px;">'+PRESETS[k].icon+'</span>'+k+'</button>';
            }).join('')+
          '</div>'+
        '</div>'+
        '<div>'+
          '<div style="font-size:11px;font-weight:700;color:#9aa0b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;">Gaya Interior</div>'+
          '<div id="wzStyleGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">'+
            STYLES.map(function(s){
              var sel=_wStyle===s;
              var c=STYLE_COLORS[s];
              return '<button onclick="wzSetStyle(\''+s+'\')" id="wzs_'+s+'" style="padding:14px 10px;border-radius:10px;border:2px solid '+(sel?c:'#2a2d3e')+';background:'+(sel?'rgba('+hexToRgb(c)+',0.12)':'#111420')+';cursor:pointer;text-align:left;transition:all .2s;">'+
              '<div style="font-size:13px;font-weight:800;color:'+(sel?c:'#e8eaf2')+';">'+s+'</div>'+
              '<div style="font-size:11px;color:#5a607a;margin-top:3px;line-height:1.4;">'+STYLE_DESC[s]+'</div>'+
              '</button>';
            }).join('')+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div style="width:320px;border-left:1px solid #2a2d3e;padding:16px;display:flex;flex-direction:column;gap:12px;flex-shrink:0;">'+
        '<div style="font-size:11px;font-weight:700;color:#9aa0b8;text-transform:uppercase;letter-spacing:.6px;">Preview Layout</div>'+
        '<canvas id="wzPreview" width="288" height="220" style="border-radius:10px;border:1px solid #2a2d3e;background:#0d0f14;width:100%;"></canvas>'+
        '<div id="wzFurnList" style="font-size:12px;color:#9aa0b8;flex:1;overflow-y:auto;"></div>'+
        '<div style="display:flex;gap:8px;">'+
          '<button onclick="wzShuffle()" style="flex:1;padding:10px;border-radius:8px;border:1px solid #3a3d4e;background:#252836;color:#e2e8f0;cursor:pointer;font-size:13px;font-weight:600;">↻ Shuffle</button>'+
          '<button onclick="wzApply()" style="flex:2;padding:10px;border-radius:8px;border:none;background:linear-gradient(135deg,#f5a623,#ff6b35);color:#000;cursor:pointer;font-size:14px;font-weight:800;">✓ Terapkan</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>';
  document.body.appendChild(m);
  m.addEventListener('click',function(e){if(e.target===m)m.remove();});
  wzDrawPreview();
}

function hexToRgb(hex){
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return r+','+g+','+b;
}

window.wzSetRoom=function(type){
  _wRoomType=type;_wShuffled=0;
  document.querySelectorAll('[id^="wzrt_"]').forEach(function(b){
    var k=b.id.replace('wzrt_','').replace(/_/g,' ');
    var sel=k===type;
    b.style.border='2px solid '+(sel?'#f5a623':'#2a2d3e');
    b.style.background=sel?'rgba(245,166,35,.12)':'#111420';
    b.style.color=sel?'#f5a623':'#9aa0b8';
  });
  wzDrawPreview();
};

window.wzSetStyle=function(style){
  _wStyle=style;_wShuffled=0;
  var c=STYLE_COLORS[style];
  document.querySelectorAll('[id^="wzs_"]').forEach(function(b){
    var s=b.id.replace('wzs_','');
    var sel=s===style;
    var sc=STYLE_COLORS[s];
    b.style.border='2px solid '+(sel?sc:'#2a2d3e');
    b.style.background=sel?'rgba('+hexToRgb(sc)+',0.12)':'#111420';
    b.querySelector('div').style.color=sel?sc:'#e8eaf2';
  });
  wzDrawPreview();
};

window.wzShuffle=function(){
  _wShuffled=(_wShuffled+1)%4;wzDrawPreview();
};

function wzGetItems(){
  var preset=(PRESETS[_wRoomType]||PRESETS['Ruang Tamu']).styles[_wStyle]||[];
  if(!_wShuffled)return preset;
  // Shuffle positions slightly
  return preset.map(function(item){
    var dx=(_wShuffled%2===0?1:-1)*0.05*(Math.random()-0.5)*2;
    var dy=(_wShuffled%3===0?1:-1)*0.05*(Math.random()-0.5)*2;
    return {id:item.id,x:Math.max(0.02,Math.min(0.85,item.x+dx)),y:Math.max(0.02,Math.min(0.85,item.y+dy))};
  });
}

function wzDrawPreview(){
  var cv=document.getElementById('wzPreview');if(!cv)return;
  var ctx=cv.getContext('2d');
  var W=cv.width,H=cv.height;
  ctx.clearRect(0,0,W,H);

  // Room background
  ctx.fillStyle='#1e2235';ctx.fillRect(0,0,W,H);
  // Grid
  ctx.strokeStyle='#2a2d3e';ctx.lineWidth=0.5;
  for(var i=0;i<W;i+=20){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,H);ctx.stroke();}
  for(var j=0;j<H;j+=20){ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(W,j);ctx.stroke();}
  // Room walls
  ctx.strokeStyle='#4a9eff';ctx.lineWidth=2;
  ctx.strokeRect(4,4,W-8,H-8);

  var items=wzGetItems();
  var FLib=typeof FURN_LIB!=='undefined'?FURN_LIB:[];
  var listEl=document.getElementById('wzFurnList');
  var listHTML='';
  var PX=typeof PX_PER_M!=='undefined'?PX_PER_M:20;
  var scaleW=(W-16)/((PRESETS[_wRoomType]?6:5));
  var scaleH=(H-16)/4;

  items.forEach(function(item){
    var def=FLib.find(function(f){return f.id===item.id;});
    if(!def)def={w:1,h:0.8,color:'#6b7280',icon:'📦',name:item.id};
    var x=8+item.x*(W-16);
    var y=8+item.y*(H-16);
    var fw=Math.min(def.w*scaleW*0.6,W/4);
    var fh=Math.min(def.h*scaleH*0.6,H/4);
    ctx.fillStyle=def.color||'#6b7280';
    ctx.globalAlpha=0.85;
    ctx.beginPath();
    ctx.roundRect?ctx.roundRect(x,y,fw,fh,3):ctx.rect(x,y,fw,fh);
    ctx.fill();
    ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=0.5;
    ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,fw,fh,3):ctx.rect(x,y,fw,fh);ctx.stroke();
    // Icon
    ctx.font=(fh>14?'11':'9')+'px sans-serif';
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(def.icon,x+fw/2,y+fh/2);
    listHTML+='<div style="display:flex;align-items:center;gap:5px;padding:2px 0;">'+'<span>'+def.icon+'</span>'+'<span style="color:#c8cde0;">'+def.name+'</span></div>';
  });
  if(listEl)listEl.innerHTML=listHTML||'<span style="color:#5a607a;">Tidak ada furnitur</span>';
}

// ── ALIAS & AUTO-FURNISH SEMUA RUANGAN ─────────────────────
var FURN_ALIAS={lemari_4:'lemari_pakaian',lemari_2:'lemari_2pintu',lemari_6:'lemari_pakaian',
  kitchen_set:'kabinet_bawah',kitchen_island:'island',toilet_duduk:'toilet',shower_area:'shower'};
function resolveDef(id){
  var FLib=typeof FURN_LIB!=='undefined'?FURN_LIB:[];
  return FLib.find(function(f){return f.id===id;}) || FLib.find(function(f){return f.id===FURN_ALIAS[id];});
}
function presetKeyFor(type){
  var t=(type||'').toLowerCase();
  if(/mandi|toilet/.test(t)||/\bwc\b/.test(t)||/\bkm\b/.test(t)||t.indexOf('km/')===0) return 'Kamar Mandi';
  if(/dapur|pantry/.test(t)) return 'Dapur';
  if(/makan/.test(t)) return 'Ruang Makan';
  if(/tidur|kamar utama|kamar anak/.test(t)) return 'Kamar Tidur';
  if(/tamu|keluarga|santai|family/.test(t)) return 'Ruang Tamu';
  return null;
}
function _placeInto(arr,r,id,fx,fy,opt){
  opt=opt||{};
  var def=resolveDef(id); if(!def)return;
  var PX=typeof PX_PER_M!=='undefined'?PX_PER_M:20;
  var rot=opt.rot||0;
  var w=def.w*PX, h=def.h*PX;
  var bw=(rot%180===0)?w:h, bh=(rot%180===0)?h:w;
  // skala agar selalu muat di dalam ruang (tak menembus dinding)
  var availW=Math.max(8,r.w-6), availH=Math.max(8,r.h-6);
  var sc=Math.min(1, availW/bw, availH/bh);
  if(sc<1){ w*=sc; h*=sc; bw*=sc; bh*=sc; }
  var cx = opt.center ? r.x+r.w/2 : r.x+fx*r.w + w/2;
  var cy = opt.center ? r.y+r.h/2 : r.y+fy*r.h + h/2;
  cx=Math.max(r.x+bw/2+2, Math.min(r.x+r.w-bw/2-2, cx));
  cy=Math.max(r.y+bh/2+2, Math.min(r.y+r.h-bh/2-2, cy));
  arr.push({fid:Date.now()+Math.random(),defId:def.id,name:def.name,icon:def.icon,
    x:cx-w/2, y:cy-h/2, w:w, h:h, color:def.color, rotation:rot});
}
function _hasFurnIn(arr,r){
  return arr.some(function(f){ var c=f.x+f.w/2, d=f.y+f.h/2; return c>=r.x&&c<=r.x+r.w&&d>=r.y&&d<=r.y+r.h; });
}
window.autoFurnishAll=function(style){
  style=style||'Minimalis';
  if(!PRESETS['Ruang Tamu'].styles[style]) style='Minimalis';
  if(typeof saveSnapshot==='function')saveSnapshot();
  var fls=(typeof floors!=='undefined'&&floors.length)?floors:[{rooms:(typeof rooms!=='undefined'?rooms:[]),furnitures:(typeof furnitures!=='undefined'?furnitures:[])}];
  var total=0;
  fls.forEach(function(fl){
    if(!fl.furnitures)fl.furnitures=[];
    var arr=fl.furnitures;
    (fl.rooms||[]).forEach(function(r){
      if(_hasFurnIn(arr,r)) return;
      var before=arr.length;
      var key=presetKeyFor(r.type);
      var t=(r.type||'').toLowerCase();
      if(key){
        var items=(PRESETS[key].styles[style]||PRESETS[key].styles['Minimalis']);
        items.forEach(function(it){ _placeInto(arr,r,it.id,it.x,it.y); });
      }else if(/garasi|carport/.test(t)){
        var vertical=r.h>=r.w;
        _placeInto(arr,r,'mobil',0,0,{center:true,rot:vertical?90:0});
      }else if(/taman|garden|halaman/.test(t)){
        _placeInto(arr,r,'tanaman_besar',0.05,0.05);
        _placeInto(arr,r,'set_taman',0.4,0.4);
        _placeInto(arr,r,'tanaman',0.75,0.72);
      }else if(/teras|balkon|beranda/.test(t)){
        _placeInto(arr,r,'kursi_taman',0.18,0.3);
        _placeInto(arr,r,'pot_besar',0.7,0.55);
      }else if(/kerja|kantor/.test(t)){
        _placeInto(arr,r,'meja_kerja',0.2,0.2); _placeInto(arr,r,'kursi_kantor',0.3,0.45); _placeInto(arr,r,'rak_buku',0.7,0.1);
      }
      total+=(arr.length-before);
    });
  });
  if(typeof syncActive==='function')syncActive();
  if(typeof updateStats==='function')updateStats();
  if(typeof recalcRAB==='function')recalcRAB();
  if(typeof render==='function')render();
  if(typeof showNotif==='function')showNotif('🪄 '+total+' furnitur ditata otomatis');
  return total;
};

window.wzApply=function(){
  var r=(typeof rooms!=='undefined'?rooms:[]).find(function(x){return x.id==_wRoomId;});
  if(!r){if(typeof showNotif==='function')showNotif('⚠️ Ruangan tidak ditemukan');return;}
  if(typeof saveSnapshot==='function')saveSnapshot();
  var items=wzGetItems();
  var FLib=typeof FURN_LIB!=='undefined'?FURN_LIB:[];
  var PX=typeof PX_PER_M!=='undefined'?PX_PER_M:20;
  var added=0;
  items.forEach(function(item){
    var def=FLib.find(function(f){return f.id===item.id;});if(!def)return;
    var fx=r.x+item.x*r.w;
    var fy=r.y+item.y*r.h;
    fx=Math.max(r.x+4,Math.min(r.x+r.w-def.w*PX-4,fx));
    fy=Math.max(r.y+4,Math.min(r.y+r.h-def.h*PX-4,fy));
    furnitures.push({fid:Date.now()+Math.random()+added,defId:def.id,name:def.name,icon:def.icon,x:fx,y:fy,w:def.w*PX,h:def.h*PX,color:def.color,rotation:0});
    added++;
  });
  if(typeof activeFloor==='function')activeFloor().furnitures=furnitures;
  if(typeof updateStats==='function')updateStats();
  if(typeof recalcRAB==='function')recalcRAB();
  // Force rebuild 3D jika interior terbuka
  if(typeof rebuild3DIfOpen==='function')rebuild3DIfOpen();
  if(typeof render==='function')render();
  document.getElementById('furnWizardModal').remove();
  if(typeof showNotif==='function')showNotif('✅ '+added+' furnitur ditambahkan ('+_wStyle+')');
};

})();
