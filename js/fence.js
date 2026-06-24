(function(){
'use strict';
var fencePoints=[];        // titik jalur pagar yang sedang digambar (world coords)
var FENCE_COLOR='#c49a6c';

// Mulai mode pagar (dipanggil tombol rail kiri 🚧)
window.startFence=function(){
  if(typeof setTool==='function')setTool('fence');
  else window.currentTool='fence';
  fencePoints=[];
  _showBar();
  _markBtn(true);
  if(typeof showNotif==='function')showNotif('🚧 Klik tiap sudut lahan untuk jalur pagar, lalu Selesai (atau klik-dua-kali)');
  if(typeof render==='function')render();
};

// Toggle (kompat lama)
window.toggleFenceMode=function(){
  var on=(typeof currentTool!=='undefined'&&currentTool==='fence');
  if(on)_stop();else window.startFence();
};

function _stop(){
  if(typeof setTool==='function')setTool('select');
  else window.currentTool='select';
  _hideBar();_markBtn(false);
}

function _markBtn(on){
  var b=document.getElementById('tool-fence');
  if(b)b.classList.toggle('active',on);
}

// ── Floating bar ───────────────────────────────────────────
function _showBar(){
  if(document.getElementById('fenceBar'))return;
  var bar=document.createElement('div');
  bar.id='fenceBar';
  bar.style.cssText='position:fixed;bottom:74px;left:50%;transform:translateX(-50%);z-index:500;display:flex;gap:8px;align-items:center;background:rgba(13,15,20,.95);border:1px solid #c49a6c;border-radius:30px;padding:8px 14px;box-shadow:0 6px 24px rgba(0,0,0,.5);font-family:inherit;';
  bar.innerHTML='<span style="color:#c49a6c;font-size:13px;font-weight:700;">🚧 Pagar</span>'+
    '<span id="fenceCount" style="color:#9aa0b8;font-size:12px;">0 titik</span>'+
    '<button onclick="finishFence()" style="background:#3ecf8e;color:#000;border:none;border-radius:16px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;">✅ Selesai</button>'+
    '<button onclick="undoFencePoint()" style="background:#252836;color:#e2e8f0;border:1px solid #3a3d4e;border-radius:16px;padding:6px 12px;font-size:12px;cursor:pointer;">↶ Mundur</button>'+
    '<button onclick="cancelFence()" style="background:#e8523a;color:#fff;border:none;border-radius:16px;padding:6px 12px;font-size:12px;cursor:pointer;">✕ Batal</button>';
  document.body.appendChild(bar);
}
function _hideBar(){var b=document.getElementById('fenceBar');if(b)b.remove();}
function _updCount(){var c=document.getElementById('fenceCount');if(c)c.textContent=fencePoints.length+' titik';}

// Dipanggil dari mousedown handler interact.js
window.addFencePoint=function(x,y){
  if(typeof currentTool==='undefined'||currentTool!=='fence')return;
  // snap ke titik awal untuk menutup
  if(fencePoints.length>=3){
    var a=fencePoints[0];
    if(Math.hypot(a.x-x,a.y-y)<18){window.finishFence();return;}
  }
  fencePoints.push({x:x,y:y});
  _updCount();
  if(typeof render==='function')render();
};

window.undoFencePoint=function(){
  fencePoints.pop();_updCount();
  if(typeof render==='function')render();
};

window.finishFence=function(){
  if(fencePoints.length<2){if(typeof showNotif==='function')showNotif('⚠️ Minimal 2 titik');return;}
  if(typeof saveSnapshot==='function')saveSnapshot();
  if(typeof activeFloor==='function')activeFloor().perimeter={points:fencePoints.slice(),closed:true};
  fencePoints=[];_stop();
  if(typeof render==='function')render();
  if(typeof recalcRAB==='function')recalcRAB();
  if(typeof showNotif==='function')showNotif('✅ Pagar terpasang — lihat di Preview 3D');
};

window.cancelFence=function(){
  fencePoints=[];_stop();
  if(typeof render==='function')render();
};

window.clearFence=function(){
  if(typeof activeFloor==='function'&&activeFloor().perimeter){
    if(typeof saveSnapshot==='function')saveSnapshot();
    activeFloor().perimeter=null;
  }
  fencePoints=[];
  if(typeof render==='function')render();
  if(typeof showNotif==='function')showNotif('🗑 Pagar dihapus');
};

// ── Render di kanvas 2D (dipanggil dalam render(), sudah world transform) ──
window.drawFence=function(invZ){
  invZ=invZ||1;
  var c=(typeof ctx!=='undefined')?ctx:null;if(!c)return;
  var per=(typeof activeFloor==='function')?activeFloor().perimeter:null;
  if(per&&per.points&&per.points.length>=2)_drawPath(c,per.points,invZ,true,true);
  if(fencePoints.length)_drawPath(c,fencePoints,invZ,false,false);
};

function _drawPath(c,pts,invZ,closed,solid){
  c.save();
  c.strokeStyle=FENCE_COLOR;c.lineWidth=7*invZ;c.lineJoin='round';c.lineCap='round';
  if(!solid)c.setLineDash([10*invZ,7*invZ]);
  c.globalAlpha=solid?0.9:0.65;
  c.beginPath();
  pts.forEach(function(p,i){i===0?c.moveTo(p.x,p.y):c.lineTo(p.x,p.y);});
  if(closed)c.closePath();
  c.stroke();c.setLineDash([]);c.globalAlpha=1;
  c.fillStyle=FENCE_COLOR;
  pts.forEach(function(p,i){
    c.beginPath();c.arc(p.x,p.y,(i===0&&!solid?7:5)*invZ,0,Math.PI*2);c.fill();
  });
  c.restore();
}

// double-click di kanvas → selesai
document.addEventListener('DOMContentLoaded',function(){
  var cv=document.getElementById('floorCanvas');
  if(cv)cv.addEventListener('dblclick',function(){
    if(typeof currentTool!=='undefined'&&currentTool==='fence')window.finishFence();
  });
});
})();
