const cityMultiplier={jakarta:1.0,surabaya:0.92,bandung:0.88,medan:0.85,makassar:0.80,yogyakarta:0.82};const floorPrices={keramik_40:85000,keramik_60:110000,granit:220000,vinyl:75000,semen:45000};const wallPrices={bata_merah:120000,hebel:145000,batako:95000};const roofPrices={genteng_beton:180000,genteng_metal:210000,asbes:85000,spandek:160000};const pondasiPrices={batu_kali:350000,footplat:520000,tiang_pancang:850000};const ZONE_PRICES={carport:450000,garden:180000,pool:2200000};function gatherRABData(){const wallH=parseFloat(val('wallHeight')||3);let totalArea=0,totalWallArea=0,totalRooms=0,totalBath=0;let footprint=0;floors.forEach((f,i)=>{const detArea=(f.detectedRooms||[]).reduce((s,r)=>s+r.area,0);const detLen=(typeof floorWallLen==='function')?floorWallLen(f):0;const a=f.rooms.reduce((s,r)=>s+(r.w/PX_PER_M)*(r.h/PX_PER_M),0)+detArea;const k=f.rooms.reduce((s,r)=>s+2*((r.w+r.h)/PX_PER_M),0)+detLen;totalArea+=a;totalWallArea+=k*wallH;totalRooms+=f.rooms.length+(f.detectedRooms||[]).length;totalBath+=f.rooms.filter(r=>r.type==='Kamar Mandi').length+(f.detectedRooms||[]).filter(r=>(r.name||r.type)==='Kamar Mandi').length;if(i===0)footprint=a;});const topArea=(floors[floors.length-1].rooms.reduce((s,r)=>s+(r.w/PX_PER_M)*(r.h/PX_PER_M),0)+(floors[floors.length-1].detectedRooms||[]).reduce((s,r)=>s+r.area,0))||footprint;return{wallH,totalArea,totalWallArea,totalRooms,totalBath:totalBath||1,footprint:footprint||totalArea,topArea};}function buildRABItems(){const city=val('citySelect')||'jakarta';const mult=cityMultiplier[city]||1;const floor=val('floorMat')||'keramik_40';const wall=val('wallMat')||'bata_merah';const roof=val('roofMat')||'genteng_beton';const pondasi=val('pondasiType')||'batu_kali';const d=gatherRABData();const items=[{name:'Pekerjaan Pondasi',detail:`${d.footprint.toFixed(1)} m² × Rp${Math.round(pondasiPrices[pondasi]*mult).toLocaleString('id')}`,total:d.footprint*pondasiPrices[pondasi]*mult},{name:'Pekerjaan Dinding',detail:`${d.totalWallArea.toFixed(1)} m² × Rp${Math.round(wallPrices[wall]*mult).toLocaleString('id')}`,total:d.totalWallArea*wallPrices[wall]*mult},{name:'Pekerjaan Lantai',detail:`${d.totalArea.toFixed(1)} m² × Rp${Math.round(floorPrices[floor]*mult).toLocaleString('id')}`,total:d.totalArea*floorPrices[floor]*mult},{name:'Pekerjaan Atap',detail:`${d.topArea.toFixed(1)} m² × Rp${Math.round(roofPrices[roof]*mult).toLocaleString('id')}`,total:d.topArea*roofPrices[roof]*mult},{name:'Pekerjaan Plafon',detail:`${d.totalArea.toFixed(1)} m² × Rp${Math.round(55000*mult).toLocaleString('id')}`,total:d.totalArea*55000*mult},{name:'Instalasi Listrik',detail:`${d.totalRooms} titik × Rp${Math.round(2500000*mult).toLocaleString('id')}`,total:d.totalRooms*2500000*mult},{name:'Instalasi Air & Sanitasi',detail:`${d.totalBath} kamar mandi`,total:d.totalBath*8500000*mult},{name:'Pengecatan',detail:`${(d.totalWallArea*2).toFixed(0)} m² (2 lapis)`,total:d.totalWallArea*2*35000*mult},];const siteItems=[];['carport','garden','pool'].forEach(type=>{const area=siteplan.zones.filter(z=>z.type===type).reduce((s,z)=>s+(z.w/PX_PER_M)*(z.h/PX_PER_M),0);if(area>0){const lbl=ZONE_TOOLS[type].label;siteItems.push({name:`Site — ${lbl}`,detail:`${area.toFixed(1)} m² × Rp${Math.round(ZONE_PRICES[type]*mult).toLocaleString('id')}`,total:area*ZONE_PRICES[type]*mult});}});const mepItems=[];if(typeof getMEPForRAB==='function'){const m=getMEPForRAB();if(m.elec>0)mepItems.push({name:'Instalasi Listrik',detail:'Lampu, stop kontak, saklar, MCB, dll + kabel',total:m.elec});if(m.plumb>0)mepItems.push({name:'Instalasi Plumbing',detail:'Sanitair + pipa supply & drain',total:m.plumb});}return{items,siteItems,mepItems,mult,city,d};}let rabTab='ringkas';function setRabTab(t){if((t==='konstruksi'||t==='struktur'||t==='takeoff')&&typeof requireFeature==='function'&&!requireFeature('rab_adv'))return;rabTab=t;document.querySelectorAll('.rab-subtab').forEach(el=>el.classList.toggle('active',el.dataset.rab===t));recalcRAB();}function recalcRAB(){const content=document.getElementById('rabContent');if(!content)return;if(rabTab==='konstruksi'&&typeof renderKonstruksi==='function'){renderKonstruksi(content);return;}if(rabTab==='struktur'&&typeof renderStruktur==='function'){renderStruktur(content);return;}if(rabTab==='takeoff'&&typeof renderTakeOff==='function'){renderTakeOff(content);return;}const hasRooms=floors.some(f=>f.rooms.length>0);if(!hasRooms){content.innerHTML='<div class="empty-state"><div class="empty-icon">📋</div>Tambahkan ruangan untuk melihat estimasi RAB</div>';return;}const{items,siteItems,mepItems,city,d}=buildRABItems();const allItems=[...items,...siteItems,...mepItems];const subtotal=allItems.reduce((s,i)=>s+i.total,0);const overhead=subtotal*0.15;const ppn=(subtotal+overhead)*0.11;const grand=subtotal+overhead+ppn;const sub=document.getElementById('rabFvSub');if(sub)sub.textContent=`${floors.length} lantai · ${d.totalArea.toFixed(1)} m² total · HSPK ${city.charAt(0).toUpperCase()+city.slice(1)} ${new Date().getFullYear()}`;const row=i=>`<div class="rab-item"><div class="rab-item-header"><span class="rab-item-name">${i.name}</span><span class="rab-item-total">Rp${Math.round(i.total).toLocaleString('id')}</span></div><div class="rab-item-detail">${i.detail}</div></div>`;ensureFeasCSS();content.innerHTML=`
    ${feasibilityHTML(grand,d.totalArea)}
    <div class="rab-section-title">Pekerjaan Bangunan</div>
    ${items.map(row).join('')}
    ${mepItems.length ? `<div class="rab-section-title">Pekerjaan MEP</div>${mepItems.map(row).join('')}` : ''}
    ${siteItems.length ? `<div class="rab-section-title">Pekerjaan Site/Lahan</div>${siteItems.map(row).join('')}` : ''}
    <div class="rab-section-title">Biaya Tambahan</div>
    <div class="rab-item"><div class="rab-item-header"><span class="rab-item-name">Overhead & Jasa (15%)</span><span class="rab-item-total" style="color:var(--text2)">Rp${Math.round(overhead).toLocaleString('id')}</span></div></div>
    <div class="rab-item"><div class="rab-item-header"><span class="rab-item-name">PPN 11%</span><span class="rab-item-total" style="color:var(--text2)">Rp${Math.round(ppn).toLocaleString('id')}</span></div></div>
    <div class="rab-total-box">
      <div class="rab-total-label">TOTAL ESTIMASI RAB (RINGKAS)</div>
      <div class="rab-total-value">Rp${Math.round(grand).toLocaleString('id')}</div>
      <div class="rab-total-sub">≈ Rp${Math.round(grand/d.totalArea).toLocaleString('id')}/m² · ${d.totalArea.toFixed(1)} m² · ${floors.length} lantai · estimasi kasar, bukan penawaran final</div>
    </div>`;}function exportRABExcel(){if(!floors.some(f=>f.rooms.length)){showNotif('⚠️ Tambah ruangan dulu!');return;}const{items,siteItems,mepItems,city}=buildRABItems();const all=[...items,...mepItems,...siteItems];let csv='No,Pekerjaan,Total (Rp)\n';all.forEach((it,i)=>csv+=`${i+1},"${it.name}",${Math.round(it.total)}\n`);const subtotal=all.reduce((s,it)=>s+it.total,0);csv+=`,,\n,Subtotal,${Math.round(subtotal)}\n,Overhead 15%,${Math.round(subtotal*0.15)}\n,PPN 11%,${Math.round(subtotal*1.15*0.11)}\n,TOTAL,${Math.round(subtotal*1.15*1.11)}\n`;const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`RAB_RumahDesign3D_${city}_${Date.now()}.csv`;a.click();showNotif('📊 RAB berhasil diekspor!');}function getRABForPDF(){const{items,siteItems,mepItems,city,d}=buildRABItems();const all=[...items,...mepItems,...siteItems];const subtotal=all.reduce((s,i)=>s+i.total,0);const overhead=subtotal*0.15,ppn=(subtotal+overhead)*0.11,grand=subtotal+overhead+ppn;return{all,subtotal,overhead,ppn,grand,city,d};}
/* ===== #3 Dashboard Kelayakan Proyek ===== */
function getProjectBudget(){var v=window.projectBudget;if(!v){var s=parseFloat(localStorage.getItem('rd3d_budget'));if(s>0)v=s;}return v||0;}
function setProjectBudget(v){window.projectBudget=v||0;try{localStorage.setItem('rd3d_budget',window.projectBudget);}catch(e){}if(typeof recalcRAB==='function')recalcRAB();}
function _feasParse(s){if(typeof s==='number')return s;s=(''+s).toLowerCase();var m=1;if(/jt|juta/.test(s))m=1e6;else if(/milyar|miliar|m/.test(s))m=1e9;s=s.replace(/[a-z\s]/g,'').replace(/\./g,'').replace(',','.');return Math.round((parseFloat(s)||0)*m);}
window.setProjectBudgetFromInput=function(el){setProjectBudget(_feasParse(el.value));};
function ensureFeasCSS(){if(document.getElementById('feas-css'))return;var s=document.createElement('style');s.id='feas-css';s.textContent=`
.feas-card{background:linear-gradient(135deg,#1a1d2e,#15171f);border:1px solid #2a2d3e;border-radius:16px;padding:18px 20px;margin-bottom:18px;}
.feas-top{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px;}
.feas-box{flex:1;min-width:150px;background:#0d0f16;border:1px solid #20242f;border-radius:12px;padding:12px 14px;}
.feas-box label{display:block;font-size:11px;font-weight:700;color:#8a90a6;letter-spacing:.3px;margin-bottom:6px;text-transform:uppercase;}
.feas-box .v{font-size:21px;font-weight:800;color:#e8eaf2;}
.feas-box input{width:100%;box-sizing:border-box;background:transparent;border:none;border-bottom:1.5px dashed #3a3f52;color:#f5a623;font-size:21px;font-weight:800;outline:none;padding:0 0 3px;}
.feas-box input:focus{border-bottom-color:#f5a623;}
.feas-bar{height:12px;border-radius:7px;background:#0d0f16;border:1px solid #20242f;overflow:hidden;margin:4px 0 12px;position:relative;}
.feas-fill{height:100%;border-radius:7px;transition:width .5s cubic-bezier(.4,0,.2,1);}
.feas-badge{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:24px;font-size:14px;font-weight:800;}
.feas-sub{font-size:12.5px;color:#9aa0b8;margin-top:10px;line-height:1.6;}
.feas-sub b{color:#e8eaf2;}
.feas-set{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.feas-set input{flex:1;min-width:140px;background:#0d0f16;border:1.5px solid #2c3144;border-radius:10px;padding:11px 13px;color:#e8eaf2;font-size:15px;font-weight:700;outline:none;}
.feas-set button{background:linear-gradient(135deg,#f5a623,#ff7a3c);color:#1a1206;border:none;border-radius:10px;padding:11px 18px;font-size:14px;font-weight:800;cursor:pointer;}
`;document.head.appendChild(s);}
function feasibilityHTML(grand,area){
  var budget=getProjectBudget();
  var cpm=area>0?grand/area:0;
  var fmt=function(n){return 'Rp '+Math.round(n).toLocaleString('id-ID');};
  if(!budget){
    return '<div class="feas-card"><div class="rab-section-title" style="margin:0 0 10px;">📊 Kelayakan Proyek</div>'
      +'<div class="feas-sub" style="margin:0 0 10px;">Masukkan budget Anda untuk cek apakah desain ini sesuai anggaran.</div>'
      +'<div class="feas-set"><input id="feasBudgetIn" inputmode="numeric" placeholder="mis. 500.000.000 atau 500 jt">'
      +'<button onclick="setProjectBudgetFromInput(document.getElementById(\'feasBudgetIn\'))">Cek Kelayakan</button></div>'
      +'<div class="feas-sub" style="margin-top:12px;">Estimasi biaya saat ini: <b>'+fmt(grand)+'</b> · ≈ '+fmt(cpm)+'/m²</div></div>';
  }
  var diff=budget-grand, ok=diff>=0;
  var pct=budget>0?Math.min(100,Math.round(grand/budget*100)):0;
  var overPct=budget>0?Math.round(Math.abs(diff)/budget*100):0;
  var fillColor=ok?(pct>85?'linear-gradient(90deg,#f5a623,#ff7a3c)':'linear-gradient(90deg,#3ecf8e,#34d399)'):'linear-gradient(90deg,#e8523a,#ff6b52)';
  var badge=ok?'<div class="feas-badge" style="background:rgba(62,207,142,.16);color:#3ecf8e;">🟢 Sesuai Budget</div>'
              :'<div class="feas-badge" style="background:rgba(232,82,58,.16);color:#ff6b52;">🔴 Melebihi Budget '+overPct+'%</div>';
  var sub=ok?'Sisa dana ± <b style="color:#3ecf8e;">'+fmt(diff)+'</b> ('+pct+'% budget terpakai)'
            :'Perlu tambahan ± <b style="color:#ff6b52;">'+fmt(-diff)+'</b> — coba kurangi luas, ganti material, atau naikkan budget.';
  return '<div class="feas-card"><div class="rab-section-title" style="margin:0 0 12px;">📊 Kelayakan Proyek</div>'
    +'<div class="feas-top">'
    +'<div class="feas-box"><label>Budget Anda</label><input value="'+budget.toLocaleString('id-ID')+'" inputmode="numeric" onchange="setProjectBudgetFromInput(this)"></div>'
    +'<div class="feas-box"><label>Estimasi Biaya</label><div class="v">'+fmt(grand)+'</div></div>'
    +'<div class="feas-box"><label>Biaya per m²</label><div class="v">'+fmt(cpm)+'</div></div>'
    +'</div>'
    +'<div class="feas-bar"><div class="feas-fill" style="width:'+Math.min(100,Math.round(grand/budget*100))+'%;background:'+fillColor+';"></div></div>'
    +badge+'<div class="feas-sub">'+sub+'</div></div>';
}
