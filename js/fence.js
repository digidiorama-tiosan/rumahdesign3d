(function(){
'use strict';
var fencePoints=[];        // titik jalur pagar yang sedang digambar (world coords)
var FENCE_COLOR='#c49a6c';

// Aktif kalau currentTool==='fence'
window.toggleFenceMode=function(){
  var on=(typeof currentTool!=='undefined'&&currentTool==='fence');
  if(on){
    if(typeof setTool==='function')setTool('select');
    else if(typeof currentTool!=='undefined')window.currentTool='select';
  } else {
    if(typeof setTool==='function')setTool('fence');
    else window.currentTool='fence';
  }
  _syncUI();
  if(typeof showNotif==='function')showNotif(on?'Mode pagar off':'🚧 Mode pagar — klik denah untuk jalur pagar, lalu Selesai');
  if(typeof render==='function')render();
};

function _syncUI(){
  var active=(typeof currentTool!=='undefined'&&currentTool==='fence');
  var btn=document.querySelector('button[onclick="toggleFenceMode()"]');
  if(btn)btn.style.background=active?'rgba(196,154,108,.18)':'transparent';
  var panel=document.getElementById('fencePanel');
  if(panel)panel.style.display=active?'block':'none';
}
window.toggleFenceModeUI=_syncUI;

// Dipanggil dari mousedown handler interact.js
window.addFencePoint=function(x,y){
  if(typeof currentTool==='undefined'||currentTool!=='fence')return;
  fencePoints.push({x:x,y:y});
  if(typeof render==='function')render();
  if(typeof showNotif==='function')showNotif('📍 '+fencePoints.length+' titik pagar');
};

window.finishFence=function(){
  if(fencePoints.length<2){if(typeof showNotif==='function')showNotif('⚠️ Minimal 2 titik');return;}
  if(typeof saveSnapshot==='function')saveSnapshot();
  if(typeof activeFloor==='function'){
    activeFloor().perimeter={points:fencePoints.slice(),closed:true};
  }
  fencePoints=[];
  if(typeof setTool==='function')setTool('select');else window.currentTool='select';
  _syncUI();
  if(typeof render==='function')render();
  if(typeof recalcRAB==='function')recalcRAB();
  if(typeof showNotif==='function')showNotif('✅ Pagar terpasang');
};

window.clearFence=function(){
  fencePoints=[];
  if(typeof activeFloor==='function'&&activeFloor().perimeter){
    if(typeof saveSnapshot==='function')saveSnapshot();
    activeFloor().perimeter=null;
  }
  if(typeof render==='function')render();
  if(typeof showNotif==='function')showNotif('🗑 Pagar dihapus');
};

// Dipanggil di dalam render() (sudah dalam transform world)
window.drawFence=function(invZ){
  invZ=invZ||1;
  var ctx2=(typeof ctx!=='undefined')?ctx:null;if(!ctx2)return;
  // 1. Pagar tersimpan
  var per=(typeof activeFloor==='function')?activeFloor().perimeter:null;
  if(per&&per.points&&per.points.length>=2){
    _drawPath(ctx2,per.points,invZ,true,true);
  }
  // 2. Jalur yang sedang digambar
  if(fencePoints.length){
    _drawPath(ctx2,fencePoints,invZ,false,false);
  }
};

function _drawPath(c,pts,invZ,closed,solid){
  c.save();
  c.strokeStyle=FENCE_COLOR;
  c.lineWidth=7*invZ;
  c.lineJoin='round';c.lineCap='round';
  if(!solid)c.setLineDash([10*invZ,7*invZ]);
  c.globalAlpha=solid?0.9:0.6;
  c.beginPath();
  pts.forEach(function(p,i){i===0?c.moveTo(p.x,p.y):c.lineTo(p.x,p.y);});
  if(closed)c.closePath();
  c.stroke();
  c.setLineDash([]);
  c.globalAlpha=1;
  // tiang pagar (posts)
  c.fillStyle=FENCE_COLOR;
  pts.forEach(function(p){c.beginPath();c.arc(p.x,p.y,5*invZ,0,Math.PI*2);c.fill();});
  c.restore();
}
})();
