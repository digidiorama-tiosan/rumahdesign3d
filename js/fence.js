(function(){
'use strict';
var fenceMode=false,fencePoints=[],fenceThick=0.3;
window.toggleFenceMode=function(){
  fenceMode=!fenceMode;
  var btn=document.querySelector('button[onclick="toggleFenceMode()"]');
  if(btn)btn.style.background=fenceMode?'rgba(196,154,108,.15)':'transparent';
  if(typeof showNotif==='function')showNotif(fenceMode?'🚧 Mode pagar aktif — klik area untuk tentukan jalur':'Pagar mode off');
};
window.addFencePoint=function(x,y){
  if(!fenceMode)return;
  fencePoints.push({x,y});
  if(typeof render==='function')render();
  if(typeof showNotif==='function')showNotif('📍 '+fencePoints.length+' poin pagar');
};
window.finishFence=function(){
  if(fencePoints.length<2){if(typeof showNotif==='function')showNotif('⚠️ Minimal 2 poin');return;}
  if(typeof saveSnapshot==='function')saveSnapshot();
  if(typeof activeFloor==='function'){
    activeFloor().perimeter={points:fencePoints.slice(),thickness:fenceThick};
  }
  fencePoints=[];fenceMode=false;
  if(typeof render==='function')render();
  if(typeof showNotif==='function')showNotif('✅ Pagar tersimpan');
};
window.clearFence=function(){
  fencePoints=[];
  if(typeof render==='function')render();
  if(typeof showNotif==='function')showNotif('🗑 Pagar dihapus');
};
// Render fence on canvas
window.renderFencePreview=function(ctx,scale){
  if(!fencePoints.length)return;
  ctx.strokeStyle='#c49a6c';ctx.lineWidth=8/scale;ctx.globalAlpha=0.6;
  ctx.beginPath();
  fencePoints.forEach(function(p,i){
    if(i===0)ctx.moveTo(p.x,p.y);
    else ctx.lineTo(p.x,p.y);
  });
  ctx.closePath();ctx.stroke();
  ctx.globalAlpha=1;
  // Points
  fencePoints.forEach(function(p){
    ctx.fillStyle='#c49a6c';ctx.beginPath();ctx.arc(p.x,p.y,12/scale,0,Math.PI*2);ctx.fill();
  });
};
})();
