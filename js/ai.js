// ===================== AI STUDIO =====================
const aiState = { tab:'layout', interiorStyle:null, igRoom:'Ruang Tamu', igStyle:'japandi',
  form:{ beds:3, baths:2, garage:true, floors:1, roof:'pelana', style:'minimalis', budget:0,
         extras:{ kerja:false, mushola:false, laundry:false, gudang:false, gaming:false, kolam:false, rooftop:false } } };

// ---- Claude wrapper (graceful fallback) ----
async function aiComplete(prompt) {
  if (!(window.claude && typeof window.claude.complete === 'function')) return null;
  try { return await window.claude.complete(prompt); } catch(e) { return null; }
}
function extractJSON(text) {
  if (!text) return null;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch(e) { return null; }
}
function aiAvailable() { return !!(window.claude && typeof window.claude.complete === 'function'); }

// ---- modal ----
function openAIStudio() {
  if (typeof requireFeature==='function' && !requireFeature('aistudio')) return;
  document.getElementById('modalAI').classList.add('show'); aiNav(aiState.tab);
  if (typeof applyPlanLocks==='function') applyPlanLocks();
}
function closeAIStudio() { document.getElementById('modalAI').classList.remove('show'); }
function aiNav(tab) {
  // gate developer-only tabs
  if (typeof requireFeature==='function') {
    if (tab === 'developer' && !requireFeature('developer')) return;
    if (tab === 'template' && !requireFeature('marketplace')) return;
  }
  aiState.tab = tab;
  document.querySelectorAll('.ai-nav-item').forEach(n => n.classList.toggle('active', n.dataset.ai === tab));
  const c = document.getElementById('aiContent');
  ({ layout:renderAILayout, regulasi:renderAIRegulation, assistant:renderAIAssistant, optimizer:renderAIOptimizer, analysis:renderAIAnalysis, interior:renderAIInterior, developer:renderDevMode, renovasi:renderRenovation, scan:renderScan, template:renderMarketplace }[tab] || renderAILayout)(c);
}

// ============================================================
// 16. AI AUTO LAYOUT
// ============================================================
function renderAILayout(c) {
  const f = aiState.form;
  f.landW = siteplan.landW; f.landH = siteplan.landH;
  const STYLES = [['minimalis','Minimalis Modern'],['japandi','Japandi'],['scandinavian','Scandinavian'],['industrial','Industrial'],['tropical','Tropical'],['modern_luxury','Modern Luxury'],['klasik','Klasik']];
  const NEEDS = [['kerja','💻 Ruang Kerja'],['mushola','🕌 Musholla'],['laundry','🧺 Laundry'],['gudang','📦 Gudang'],['gaming','🎮 Ruang Gaming'],['kolam','🏊 Kolam Renang'],['rooftop','🌆 Rooftop']];
  c.innerHTML = `
    <div class="ai-title">🏗️ AI Auto Layout</div>
    <div class="ai-sub">Mulai dari <b>budget</b> atau dari <b>kebutuhan</b> — sistem menyusun denah otomatis yang langsung terhubung ke RAB, 3D & gambar kerja.</div>

    <div class="ai-card" style="border-color:rgba(62,207,142,0.4);">
      <div class="ai-card-title">💰 Budget Proyek <span style="color:var(--text3); font-weight:500; text-transform:none; letter-spacing:0;">— "bisa bangun berapa meter dengan uang saya?"</span></div>
      <div class="ai-grid2">
        <div class="ai-field"><label>Budget (Rp)</label><input class="ai-input" type="text" id="alBudget" placeholder="cth: 300000000 atau 300 juta" value="${f.budget?f.budget:''}"></div>
        <div class="ai-field"><label>&nbsp;</label><button class="ai-btn-ghost" onclick="calcFromBudget()">📐 Hitung Luas dari Budget</button></div>
      </div>
      <div id="budgetHint" class="ai-sub" style="margin:8px 0 0;"></div>
    </div>

    <div class="ai-card">
      <div class="ai-card-title">Ukuran Tanah</div>
      <div class="ai-grid2">
        <div class="ai-field"><label>Lebar tanah (m)</label><input class="ai-input" type="number" id="alLandW" value="${siteplan.landW}" min="4" max="60" step="0.5"></div>
        <div class="ai-field"><label>Panjang tanah (m)</label><input class="ai-input" type="number" id="alLandH" value="${siteplan.landH}" min="4" max="60" step="0.5"></div>
      </div>
    </div>

    <div class="ai-card">
      <div class="ai-card-title">Gaya Rumah</div>
      <div class="ai-toggle-row" id="alStyleRow">
        ${STYLES.map(([id,nm])=>`<div class="ai-chip ${f.style===id?'active':''}" onclick="aiSetStyle('${id}')">${nm}</div>`).join('')}
      </div>
    </div>

    <div class="ai-card">
      <div class="ai-card-title">Kebutuhan Ruang</div>
      <div class="ai-grid2">
        ${stepperHTML('Kamar Tidur', 'alBeds', f.beds, 1, 6)}
        ${stepperHTML('Kamar Mandi / WC', 'alBaths', f.baths, 1, 4)}
        ${stepperHTML('Jumlah Lantai', 'alFloors', f.floors, 1, 3)}
        <div class="ai-field"><label>Garasi</label>
          <div class="ai-toggle-row">
            <div class="ai-chip ${f.garage?'active':''}" id="alGarYes" onclick="aiSetGarage(true)">Ada</div>
            <div class="ai-chip ${!f.garage?'active':''}" id="alGarNo" onclick="aiSetGarage(false)">Tidak</div>
          </div>
        </div>
      </div>
      <div class="ai-field" style="margin-top:14px;"><label>Bentuk atap</label>
        <div class="ai-toggle-row" id="alRoofRow">
          ${['pelana','limas','miring','dak'].map(r=>`<div class="ai-chip ${f.roof===r?'active':''}" onclick="aiSetRoof('${r}')">${({pelana:'Pelana',limas:'Limas',miring:'Miring',dak:'Dak'})[r]}</div>`).join('')}
        </div>
      </div>
    </div>

    <div class="ai-card">
      <div class="ai-card-title">Kebutuhan Khusus / Prioritas</div>
      <div class="ai-toggle-row" id="alNeedsRow">
        ${NEEDS.map(([id,nm])=>`<div class="ai-chip ${f.extras[id]?'active':''}" onclick="aiToggleNeed('${id}')">${nm}</div>`).join('')}
      </div>
    </div>

    <button class="ai-btn-primary" onclick="runAutoLayout()">⚡ Generate Layout Otomatis</button>
    <div id="alResult"></div>`;
}
function parseRupiah(s) {
  if (!s) return 0;
  s = (''+s).toLowerCase();
  const u = /jt|juta/.test(s) ? 1e6 : /milyar|miliar|\bm\b|m$/.test(s) ? 1e9 : 1;
  // keep digits + decimal separator only, normalise comma→dot, THEN scale
  const num = parseFloat(s.replace(/rp|\s/g,'').replace(/[^0-9.,]/g,'').replace(',','.')) || 0;
  return Math.round(num * u);
}
function calcFromBudget() {
  const budget = parseRupiah(document.getElementById('alBudget').value);
  const hint = document.getElementById('budgetHint');
  if (budget < 30000000) { hint.innerHTML = '⚠️ Masukkan budget realistis (mis. 300 juta).'; return; }
  aiState.form.budget = budget;
  const s = suggestFromBudget(budget, aiState.form.style);
  // set steppers + floors
  document.getElementById('alBeds').textContent = s.beds; aiState.form.beds = s.beds;
  document.getElementById('alBaths').textContent = s.baths; aiState.form.baths = s.baths;
  document.getElementById('alFloors').textContent = s.floors; aiState.form.floors = s.floors;
  hint.innerHTML = `💡 Dengan <b>Rp ${budget.toLocaleString('id')}</b> (≈ Rp ${s.cpm.toLocaleString('id')}/m² gaya ${aiState.form.style.replace('_',' ')}), Anda bisa bangun sekitar <b style="color:var(--green)">${s.area} m²</b> → disarankan <b>${s.floors} lantai · ${s.beds} kamar tidur · ${s.baths} kamar mandi</b>. Klik Generate.`;
}
function aiSetStyle(id){
  aiState.form.style=id; aiState.form.roof=styleRoof(id);
  const names={minimalis:'Minimalis Modern',japandi:'Japandi',scandinavian:'Scandinavian',industrial:'Industrial',tropical:'Tropical',modern_luxury:'Modern Luxury',klasik:'Klasik'};
  document.querySelectorAll('#alStyleRow .ai-chip').forEach(c=>c.classList.toggle('active', c.textContent===names[id]));
  const rn={pelana:'Pelana',limas:'Limas',miring:'Miring',dak:'Dak'};
  document.querySelectorAll('#alRoofRow .ai-chip').forEach(c=>c.classList.toggle('active', c.textContent===rn[aiState.form.roof]));
}
function aiToggleNeed(id){
  aiState.form.extras[id]=!aiState.form.extras[id];
  const labels={kerja:'💻 Ruang Kerja',mushola:'🕌 Musholla',laundry:'🧺 Laundry',gudang:'📦 Gudang',gaming:'🎮 Ruang Gaming',kolam:'🏊 Kolam Renang',rooftop:'🌆 Rooftop'};
  document.querySelectorAll('#alNeedsRow .ai-chip').forEach(c=>{ if(c.textContent===labels[id]) c.classList.toggle('active', aiState.form.extras[id]); });
}
function stepperHTML(label, id, val, min, max) {
  return `<div class="ai-field"><label>${label}</label>
    <div class="ai-stepper">
      <button onclick="aiStep('${id}',-1,${min},${max})">−</button>
      <span id="${id}">${val}</span>
      <button onclick="aiStep('${id}',1,${min},${max})">+</button>
    </div></div>`;
}
function aiStep(id, d, min, max) {
  const el = document.getElementById(id); let v = parseInt(el.textContent)+d;
  v = Math.max(min, Math.min(max, v)); el.textContent = v;
  if (id==='alBeds') aiState.form.beds=v; if (id==='alBaths') aiState.form.baths=v; if (id==='alFloors') aiState.form.floors=v;
}
function aiSetGarage(v){ aiState.form.garage=v; document.getElementById('alGarYes').classList.toggle('active',v); document.getElementById('alGarNo').classList.toggle('active',!v); }
function aiSetRoof(r){ aiState.form.roof=r; document.querySelectorAll('#alRoofRow .ai-chip').forEach(c=>c.classList.toggle('active', c.textContent.toLowerCase().startsWith(r.slice(0,4)))); }

async function runAutoLayout() {
  const spec = {
    landW: parseFloat(document.getElementById('alLandW').value)||10,
    landH: parseFloat(document.getElementById('alLandH').value)||15,
    beds: parseInt(document.getElementById('alBeds').textContent),
    baths: parseInt(document.getElementById('alBaths').textContent),
    floors: parseInt(document.getElementById('alFloors').textContent),
    garage: aiState.form.garage, roof: aiState.form.roof,
    style: aiState.form.style, budget: parseRupiah(document.getElementById('alBudget').value),
    extras: { ...aiState.form.extras }
  };
  const res = generateHouse(spec);
  // actual RAB after build
  const rab = (typeof getRABForPDF==='function') ? getRABForPDF() : null;
  const grand = rab ? rab.grand : 0;
  let budgetLine = '';
  if (spec.budget > 0 && grand) {
    const diff = spec.budget - grand;
    const ok = diff >= 0;
    budgetLine = `<div class="opt-total" style="${ok?'':'background:linear-gradient(135deg,rgba(232,82,58,0.14),rgba(232,82,58,0.04));border-color:rgba(232,82,58,0.4)'}">
      <div class="opt-total-label">BUDGET Rp ${spec.budget.toLocaleString('id')} · ESTIMASI RAB Rp ${Math.round(grand).toLocaleString('id')}</div>
      <div class="opt-total-value" style="color:${ok?'var(--green)':'var(--accent2)'}">${ok?'✓ Sisa Rp '+Math.round(diff).toLocaleString('id'):'⚠ Lebih Rp '+Math.round(-diff).toLocaleString('id')}</div>
      <div class="rab-total-sub">${ok?'Desain ini masih di dalam budget Anda.':'Coba kurangi luas/lantai, atau buka <b>AI RAB Optimizer</b> untuk hemat.'}</div></div>`;
  }
  const box = document.getElementById('alResult');
  box.innerHTML = `${budgetLine}
    <div class="ai-result"><b>✅ Layout dibuat!</b>\n${res.floors} lantai · ${res.totalRooms} ruangan · luas total ${res.area.toFixed(1)} m² · gaya ${aiState.form.style.replace('_',' ')}.\nDenah, RAB & 3D sudah otomatis diperbarui.</div>
    <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
      <button class="ai-btn-ghost" onclick="closeAIStudio()">Lihat Denah</button>
      <button class="ai-btn-ghost" onclick="closeAIStudio(); setView('3d')">Lihat 3D</button>
      <button class="ai-btn-ghost" onclick="closeAIStudio(); setView('rab')">Lihat RAB</button>
      <button class="ai-btn-ghost" onclick="applyInteriorStyle('${styleIdFromName(aiState.form.style)}'); aiNav('interior')">Terapkan Interior</button>
    </div>`;
  showNotif('🏗️ Layout otomatis dibuat');
  if (aiAvailable()) {
    const note = document.createElement('div'); note.className='ai-loading'; note.innerHTML='<div class="ai-spinner"></div> AI menambahkan catatan desain...';
    box.appendChild(note);
    const extrasList = Object.entries(spec.extras).filter(([k,v])=>v).map(([k])=>k).join(', ') || 'tidak ada';
    const txt = await aiComplete(`Anda arsitek Indonesia. Beri 2-3 kalimat catatan desain (bahasa Indonesia, tanpa markdown) untuk rumah gaya ${spec.style} ${spec.floors} lantai di tanah ${spec.landW}x${spec.landH}m, ${spec.beds} kamar tidur, ${spec.baths} kamar mandi${spec.garage?', garasi':''}, kebutuhan khusus: ${extrasList}. Fokus sirkulasi & pencahayaan tropis.`);
    note.outerHTML = txt ? `<div class="ai-result"><h4>💡 Catatan AI</h4>${escapeHtml(txt)}</div>` : '';
  }
}

// ============================================================
// 17. AI DESIGN ASSISTANT
// ============================================================
function renderAIAssistant(c) {
  c.innerHTML = `
    <div class="ai-title">💬 AI Design Assistant</div>
    <div class="ai-sub">Jelaskan rumah impian Anda dalam kalimat biasa. AI menyusun spesifikasi, lalu sistem membangun denah + 3D, plus saran eksterior & interior.</div>
    <div class="ai-card">
      <textarea class="ai-prompt" id="aiPrompt" placeholder="Contoh: Buat rumah minimalis modern 2 lantai, 3 kamar tidur, 2 kamar mandi, ada garasi dan taman belakang"></textarea>
      <div class="ai-examples">
        ${['Rumah minimalis modern 2 lantai','Rumah tropis 1 lantai 3 kamar','Rumah industrial 2 lantai dengan rooftop','Rumah Japandi 4 kamar tidur'].map(e=>`<span class="ai-ex" onclick="document.getElementById('aiPrompt').value='${e}'">${e}</span>`).join('')}
      </div>
      <button class="ai-btn-primary" style="margin-top:14px;" id="aiAsstBtn" onclick="runAssistant()">✨ Bangun Desain</button>
      ${!aiAvailable()?'<div class="ai-sub" style="margin-top:10px;">ℹ️ Mode tanpa AI: sistem akan membaca kata kunci (jumlah lantai, kamar, gaya) dari teks Anda.</div>':''}
    </div>
    <div id="aiAsstResult"></div>`;
}
function heuristicSpec(p) {
  p = (p||'').toLowerCase();
  const fm = p.match(/(\d+)\s*(?:lantai|tingkat|lt)/);
  let floors = fm ? Math.max(1, Math.min(3, +fm[1]))
              : (/tiga\s*lantai|3\s*lantai/.test(p) ? 3
              : (/dua\s*lantai|bertingkat|tingkat/.test(p) ? 2 : 1));
  let beds = (p.match(/(\d+)\s*kamar(?!\s*mandi)/)||[])[1]; beds = beds?+beds:3;
  let baths = (p.match(/(\d+)\s*(?:km|kamar mandi|wc)/)||[])[1]; baths = baths?+baths:2;
  let roof = 'pelana'; if (/limas|perisai/.test(p)) roof='limas'; if (/dak|datar|rooftop|flat/.test(p)) roof='dak'; if (/miring|sandar|skylight/.test(p)) roof='miring';
  let style='minimalis'; if(/scandinav/.test(p))style='scandinavian'; if(/japandi/.test(p))style='japandi'; if(/industrial/.test(p))style='industrial'; if(/tropis|tropical/.test(p))style='tropical'; if(/luxury|mewah|modern luxury/.test(p))style='modern_luxury'; if(/klasik|classic/.test(p))style='klasik';
  const garage = !/tanpa garasi/.test(p);
  const extras = {
    kerja: /kerja|wfh|kantor|office|studio/.test(p),
    mushola: /mushola|musholla|sholat/.test(p),
    laundry: /laundry|cuci jemur|cuci/.test(p),
    gudang: /gudang|storage/.test(p),
    gaming: /gaming|game/.test(p),
    kolam: /kolam|pool|renang/.test(p),
    rooftop: /rooftop|roof top|atap terbuka/.test(p)
  };
  const styleName = {minimalis:'Minimalis Modern',scandinavian:'Scandinavian',japandi:'Japandi',industrial:'Industrial',tropical:'Tropical',modern_luxury:'Modern Luxury',klasik:'Klasik'}[style];
  return { floors, beds, baths, garage, roof, style: styleName, extras, landW:siteplan.landW, landH:siteplan.landH,
    exterior:`Fasad ${styleName.toLowerCase()} ${floors} lantai dengan atap ${roof}, garis bersih dan bukaan lebar untuk pencahayaan alami.`,
    interior:`Interior ${styleName.toLowerCase()}: palet netral, material natural, penataan ${beds} kamar tidur yang efisien dengan ruang keluarga sebagai pusat.` };
}
async function runAssistant() {
  const prompt = document.getElementById('aiPrompt').value.trim();
  if (!prompt) { showNotif('⚠️ Tulis dulu deskripsi rumahnya'); return; }
  const btn = document.getElementById('aiAsstBtn'); btn.disabled = true;
  const box = document.getElementById('aiAsstResult');
  box.innerHTML = '<div class="ai-loading"><div class="ai-spinner"></div> AI menyusun desain...</div>';
  let spec = null;
  if (aiAvailable()) {
    const txt = await aiComplete(`Anda arsitek Indonesia. Ubah permintaan ini menjadi JSON spesifikasi rumah. Jawab HANYA JSON tanpa penjelasan. Schema: {"floors":int(1-3),"beds":int,"baths":int,"garage":bool,"roof":"pelana"|"limas"|"miring"|"dak","style":"Minimalis Modern"|"Japandi"|"Scandinavian"|"Industrial"|"Tropical"|"Modern Luxury"|"Klasik","extras":{"kerja":bool,"mushola":bool,"laundry":bool,"gudang":bool,"gaming":bool,"kolam":bool,"rooftop":bool},"landW":number,"landH":number,"exterior":"1-2 kalimat Indonesia","interior":"2-3 kalimat Indonesia"}. Jika ukuran tanah tak disebut pakai landW=${siteplan.landW}, landH=${siteplan.landH}. Permintaan: "${prompt.replace(/"/g,"'")}"`);
    spec = extractJSON(txt);
  }
  if (!spec || !spec.floors) spec = heuristicSpec(prompt);
  spec.floors = Math.max(1, Math.min(3, spec.floors||1));
  const res = generateHouse(spec);
  btn.disabled = false;
  box.innerHTML = `
    <div class="ai-result">
      <h4>🏠 Spesifikasi</h4>${spec.floors} lantai · ${spec.beds} kamar tidur · ${spec.baths} kamar mandi${spec.garage?' · garasi':''} · atap ${spec.roof} · gaya ${spec.style||'-'}
      <h4>🎨 Eksterior</h4>${escapeHtml(spec.exterior||'-')}
      <h4>🛋️ Saran Interior</h4>${escapeHtml(spec.interior||'-')}
    </div>
    <div style="display:flex; gap:8px; margin-top:12px;">
      <button class="ai-btn-ghost" onclick="closeAIStudio()">Lihat Denah</button>
      <button class="ai-btn-ghost" onclick="closeAIStudio(); setView('3d')">Lihat 3D</button>
      ${spec.style?`<button class="ai-btn-ghost" onclick="aiNav('interior'); applyInteriorStyle(styleIdFromName('${spec.style}'))">Terapkan Interior ${escapeHtml(spec.style)}</button>`:''}
    </div>`;
  showNotif('✨ Desain dibuat dari prompt');
}

// ============================================================
// 18. AI RAB OPTIMIZER (deterministic savings)
// ============================================================
function buildOptimizations() {
  if (!floors.some(f=>f.rooms.length || (f.wallSegs&&f.wallSegs.length))) return null;
  const mult = (cityMultiplier[val('citySelect')||'jakarta'])||1;
  const d = gatherRABData();
  const cur = { floor:val('floorMat'), wall:val('wallMat'), roof:val('roofMat'), pondasi:val('pondasiType') };
  const opts = [];
  // floor
  const floorAlt = { granit:'keramik_60', keramik_60:'keramik_40', vinyl:'keramik_40' };
  if (floorAlt[cur.floor]) { const to=floorAlt[cur.floor]; const s=(floorPrices[cur.floor]-floorPrices[to])*d.totalArea*mult;
    if (s>0) opts.push({ id:'floor', selectId:'floorMat', name:'Material Lantai', action:`Ganti ${matLabel('floor',cur.floor)} → ${matLabel('floor',to)}`, desc:`Lantai ${d.totalArea.toFixed(0)} m²`, to, saving:s }); }
  // wall
  const wallAlt = { hebel:'bata_merah', bata_merah:'batako' };
  if (wallAlt[cur.wall]) { const to=wallAlt[cur.wall]; const s=(wallPrices[cur.wall]-wallPrices[to])*d.totalWallArea*mult;
    if (s>0) opts.push({ id:'wall', selectId:'wallMat', name:'Material Dinding', action:`Ganti ${matLabel('wall',cur.wall)} → ${matLabel('wall',to)}`, desc:`Dinding ${d.totalWallArea.toFixed(0)} m²`, to, saving:s }); }
  // roof
  const roofAlt = { genteng_metal:'spandek', genteng_beton:'spandek' };
  if (roofAlt[cur.roof]) { const to=roofAlt[cur.roof]; const s=(roofPrices[cur.roof]-roofPrices[to])*d.topArea*mult;
    if (s>0) opts.push({ id:'roof', selectId:'roofMat', name:'Material Atap', action:`Optimasi atap: ${matLabel('roof',cur.roof)} → ${matLabel('roof',to)}`, desc:`Atap ${d.topArea.toFixed(0)} m²`, to, saving:s }); }
  // foundation (only if ≤ 2 floors)
  if (floors.length <= 2 && cur.pondasi==='footplat') { const s=(pondasiPrices.footplat-pondasiPrices.batu_kali)*d.footprint*mult;
    if (s>0) opts.push({ id:'pondasi', selectId:'pondasiType', name:'Jenis Pondasi', action:'Optimasi pondasi: Footplat → Batu Kali', desc:`Cukup untuk ${floors.length} lantai · ${d.footprint.toFixed(0)} m²`, to:'batu_kali', saving:s }); }
  return opts;
}
function matLabel(kind, v) {
  const L = { floor:{keramik_40:'Keramik 40×40',keramik_60:'Keramik 60×60',granit:'Granit',vinyl:'Vinyl',semen:'Semen'},
    wall:{bata_merah:'Bata Merah',hebel:'Bata Hebel',batako:'Batako'},
    roof:{genteng_beton:'Genteng Beton',genteng_metal:'Genteng Metal',asbes:'Asbes',spandek:'Spandek'} };
  return (L[kind]||{})[v]||v;
}
function renderAIOptimizer(c) {
  const opts = buildOptimizations();
  if (!opts) { c.innerHTML = `<div class="ai-title">💰 AI RAB Optimizer</div><div class="ai-sub">Buat denah dulu (pakai AI Auto Layout atau gambar manual) agar AI bisa menganalisis biaya.</div>`; return; }
  const FACTOR = 1.15 * 1.11;   // overhead + PPN — true impact on grand total
  const rabAwal = (typeof getRABForPDF==='function') ? getRABForPDF().grand : opts.reduce((s,o)=>s+o.saving,0);
  const total = opts.reduce((s,o)=>s+o.saving,0) * FACTOR;
  const rabSetelah = rabAwal - total;
  c.innerHTML = `
    <div class="ai-title">💰 AI RAB Optimizer</div>
    <div class="ai-sub">Saran hemat tanpa mengurangi fungsi — dihitung dari volume & harga material proyek Anda (HSPK ${(val('citySelect')||'jakarta')}).</div>
    <div class="ai-card" style="text-align:center;">
      <div class="ai-card-title" style="margin-bottom:6px;">RAB Awal</div>
      <div style="font-size:26px; font-weight:800; font-family:'Space Mono',monospace; color:var(--text);">Rp ${Math.round(rabAwal).toLocaleString('id')}</div>
    </div>
    ${opts.length?`<div class="ai-card-title">AI menemukan:</div>
    <div id="optList">${opts.map(o=>`
      <div class="opt-item" id="opt-${o.id}">
        <div class="opt-left"><div class="opt-name">${o.action}</div><div class="opt-desc">${o.desc}</div></div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="opt-save">Hemat Rp ${Math.round(o.saving*FACTOR).toLocaleString('id')}</span>
          <button class="ai-btn-ghost" onclick="applyOpt('${o.id}','${o.selectId}','${o.to}')">Terapkan</button>
        </div>
      </div>`).join('')}</div>
    <div class="opt-total"><div class="opt-total-label">POTENSI PENGHEMATAN</div><div class="opt-total-value">Rp ${Math.round(total).toLocaleString('id')}</div>
      <div class="rab-total-sub">RAB setelah optimasi ≈ <b>Rp ${Math.round(rabSetelah).toLocaleString('id')}</b> · sudah termasuk dampak ke overhead & PPN</div></div>
    <button class="ai-btn-primary" style="margin-top:2px;" onclick="applyAllOpt()">Terapkan Semua & Hemat Rp ${Math.round(total).toLocaleString('id')}</button>`
    :'<div class="ai-result">👍 Pilihan material Anda sudah ekonomis — tidak ada saran penghematan signifikan.</div>'}
    <div id="optNarr"></div>`;
  if (opts.length && aiAvailable()) optimizerNarrative(opts, total);
}
async function optimizerNarrative(opts, total) {
  const box = document.getElementById('optNarr');
  box.innerHTML = '<div class="ai-loading"><div class="ai-spinner"></div> AI menambahkan saran efisiensi & alternatif struktur...</div>';
  const list = opts.map(o=>o.desc).join('; ');
  const txt = await aiComplete(`Anda QS/estimator bangunan Indonesia. Dalam 3-4 kalimat (bahasa Indonesia, tanpa markdown), beri saran efisiensi biaya & alternatif struktur untuk rumah ini. Penghematan material terhitung: ${list}, total Rp${Math.round(total).toLocaleString('id')}. Sebutkan juga 1 tips struktur (mis. bentang, modul, reuse bekisting) tanpa mengorbankan keamanan.`);
  box.innerHTML = txt ? `<div class="ai-result"><h4>🧠 Saran AI</h4>${escapeHtml(txt)}</div>` : '';
}
function applyOpt(id, selectId, to) {
  saveSnapshot();
  setVal(selectId, to); recalcRAB();
  const el = document.getElementById('opt-'+id); if (el) el.classList.add('applied');
  showNotif('✅ Diterapkan ke RAB & material');
  setTimeout(()=>renderAIOptimizer(document.getElementById('aiContent')), 600);
}
function applyAllOpt() {
  const opts = buildOptimizations(); if (!opts) return;
  saveSnapshot();
  opts.forEach(o => setVal(o.selectId, o.to));
  recalcRAB();
  showNotif('✅ Semua saran diterapkan');
  renderAIOptimizer(document.getElementById('aiContent'));
}

// ============================================================
// 19. AI FENG SHUI & SUN ANALYSIS (deterministic + narrative)
// ============================================================
function screenCW(vx, vy) { return (Math.atan2(vx, -vy)*180/Math.PI + 360) % 360; }
function bearingOf(vx, vy) { return (screenCW(vx,vy) - northAngle + 360) % 360; }
function dirName(b) { const names=['Utara','Timur Laut','Timur','Tenggara','Selatan','Barat Daya','Barat','Barat Laut']; return names[Math.round(b/45)%8]; }

function analyzeBuilding() {
  const f = activeFloor();
  const center = (()=>{ const b=floorBoundsAll ? floorBoundsAll(f):null; return b?{x:(b.minX+b.maxX)/2,y:(b.minY+b.maxY)/2}:{x:0,y:0}; })();
  const wins = [];
  f.windows.forEach(w => {
    let v = null;
    if (w.segId!=null) { const s=(f.wallSegs||[]).find(x=>x.id===w.segId); if(s){ const dx=s.b.x-s.a.x, dy=s.b.y-s.a.y; let nx=-dy, ny=dx; const mx=(s.a.x+s.b.x)/2,my=(s.a.y+s.b.y)/2; if((mx-center.x)*nx+(my-center.y)*ny<0){nx=-nx;ny=-ny;} v={x:nx,y:ny}; } }
    else { const m={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]}[w.edge]; if(m) v={x:m[0],y:m[1]}; }
    if (v) wins.push(bearingOf(v.x, v.y));
  });
  const inSect = (b, lo, hi) => { b=(b+360)%360; return lo<hi ? (b>=lo&&b<hi) : (b>=lo||b<hi); };
  const north = wins.filter(b=>inSect(b,315,45)).length;
  const east  = wins.filter(b=>inSect(b,45,135)).length;
  const south = wins.filter(b=>inSect(b,135,225)).length;
  const west  = wins.filter(b=>inSect(b,225,315)).length;
  const nRooms = f.rooms.length + (f.detectedRooms||[]).length || 1;

  const heat = Math.max(0, Math.min(100, 100 - west*22 - east*6));
  const light = Math.max(0, Math.min(100, (wins.length/nRooms)*55 + north*8 + south*4));
  const hasOpp = (north||south) && (east||west);
  const vent = Math.max(0, Math.min(100, (wins.length/nRooms)*45 + (hasOpp?40:0) + (south&&north?15:0)));

  const findings = [];
  if (west>0) findings.push(`⚠️ ${west} jendela menghadap Barat — kena panas sore. Tambahkan tritisan/overhang ≥60cm, kanopi, atau tanaman peneduh.`);
  if (east>0) findings.push(`☀️ ${east} jendela menghadap Timur — cahaya pagi yang sehat, pertahankan.`);
  if (north||south) findings.push(`✅ ${north+south} jendela menghadap Utara/Selatan — pencahayaan stabil & minim silau, ideal untuk iklim tropis.`);
  if (hasOpp) findings.push(`💨 Ada bukaan di sisi berseberangan → ventilasi silang baik untuk mengalirkan udara.`);
  else findings.push(`💨 Belum ada bukaan berseberangan — tambah jendela di sisi berlawanan agar ada ventilasi silang.`);
  if (wins.length < nRooms) findings.push(`🪟 Rasio jendela rendah (${wins.length} jendela / ${nRooms} ruang) — pertimbangkan menambah bukaan.`);
  // feng shui basic
  const firstDoor = f.doors[0];
  if (firstDoor) { findings.push(`🚪 Pintu utama menghadap relatif ke arah ${doorBearingName(f, firstDoor)} — hindari posisi pintu depan segaris lurus dengan pintu belakang (feng shui: energi cepat lolos).`); }
  findings.push(`🧭 Feng shui dasar: dapur & toilet sebaiknya tidak berhadapan langsung; area tidur jauhkan dari atas garasi.`);

  return { wins:wins.length, north, east, south, west, heat, light, vent, findings };
}
function doorBearingName(f, d) {
  let v=null;
  if (d.segId!=null){ const s=(f.wallSegs||[]).find(x=>x.id===d.segId); if(s){const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y; v={x:-dy,y:dx};} }
  else { const m={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]}[d.edge]; if(m)v={x:m[0],y:m[1]}; }
  return v?dirName(bearingOf(v.x,v.y)):'-';
}
function renderAIAnalysis(c) {
  if (!activeFloor().rooms.length && !(activeFloor().wallSegs||[]).length) {
    c.innerHTML = `<div class="ai-title">🧭 Sun & Feng Shui Analysis</div><div class="ai-sub">Buat denah dulu agar AI bisa menganalisis arah matahari, ventilasi, dan feng shui dasar.</div>`; return;
  }
  const a = analyzeBuilding();
  const bar = (v,col)=>`<div class="score-bar"><div class="score-fill" style="width:${v}%; background:${col}"></div></div>`;
  c.innerHTML = `
    <div class="ai-title">🧭 Sun & Feng Shui Analysis</div>
    <div class="ai-sub">Berdasarkan orientasi Utara (${Math.round(((northAngle%360)+360)%360)}°) dan posisi ${a.wins} jendela pada <b>${activeFloor().name}</b>. Putar kompas di kanvas untuk melihat perubahan.</div>
    <div class="score-grid">
      <div class="score-card"><div class="score-ring" style="color:${scoreCol(a.light)}">${Math.round(a.light)}</div><div class="score-name">Pencahayaan</div>${bar(a.light,scoreCol(a.light))}</div>
      <div class="score-card"><div class="score-ring" style="color:${scoreCol(a.vent)}">${Math.round(a.vent)}</div><div class="score-name">Ventilasi Silang</div>${bar(a.vent,scoreCol(a.vent))}</div>
      <div class="score-card"><div class="score-ring" style="color:${scoreCol(a.heat)}">${Math.round(a.heat)}</div><div class="score-name">Kendali Panas</div>${bar(a.heat,scoreCol(a.heat))}</div>
    </div>
    <div class="ai-card">
      <div class="ai-card-title">Distribusi Jendela per Arah</div>
      <div class="ai-grid2">
        <div class="opt-item"><span>🧭 Utara</span><b>${a.north}</b></div>
        <div class="opt-item"><span>☀️ Timur</span><b>${a.east}</b></div>
        <div class="opt-item"><span>🌅 Selatan</span><b>${a.south}</b></div>
        <div class="opt-item"><span>🔥 Barat</span><b>${a.west}</b></div>
      </div>
    </div>
    <div class="ai-card"><div class="ai-card-title">Temuan & Rekomendasi</div>
      ${a.findings.map(f=>`<div style="font-size:13px; line-height:1.7; margin-bottom:6px;">${escapeHtml(f)}</div>`).join('')}
    </div>
    <div id="analysisNarr"></div>`;
  if (aiAvailable()) analysisNarrative(a);
}
function scoreCol(v){ return v>=70?'#3ecf8e':v>=45?'#f5a623':'#e8523a'; }
async function analysisNarrative(a) {
  const box = document.getElementById('analysisNarr');
  box.innerHTML = '<div class="ai-loading"><div class="ai-spinner"></div> AI merangkum analisis...</div>';
  const txt = await aiComplete(`Anda konsultan desain bioklimatik & feng shui di Indonesia. Dalam 3-4 kalimat (bahasa Indonesia, tanpa markdown), rangkum kondisi rumah ini dan beri 1-2 saran praktis: skor pencahayaan ${Math.round(a.light)}/100, ventilasi ${Math.round(a.vent)}/100, kendali panas ${Math.round(a.heat)}/100; jendela Barat ${a.west}, Timur ${a.east}, Utara ${a.north}, Selatan ${a.south}. Iklim tropis lembap.`);
  box.innerHTML = txt ? `<div class="ai-result"><h4>🧠 Ringkasan AI</h4>${escapeHtml(txt)}</div>` : '';
}

// ============================================================
// 20. AI INTERIOR DESIGNER
// ============================================================
const INTERIOR_STYLES = [
  { id:'minimalis', name:'Minimalis Modern', desc:'Monokrom, garis bersih, 1 aksen', palette:['#ffffff','#e6e6e6','#bfbfbf','#2b2b2b','#4a9eff'], wood:'#c8c8c8', soft:'#d9d9d9', metal:'#5a5a5a', roof:'dak' },
  { id:'japandi', name:'Japandi', desc:'Tenang, kayu hangat, abu, aksen hitam', palette:['#ece6dd','#cbbfa9','#9c8b73','#5c5448','#1c1c1c'], wood:'#a8916f', soft:'#cdc4b4', metal:'#3a3631', roof:'pelana' },
  { id:'scandinavian', name:'Scandinavian', desc:'Terang, kayu muda, putih, aksen pastel', palette:['#f5f0e8','#e8d9c5','#c9b89a','#8fa9b8','#3a3a3a'], wood:'#d8c3a5', soft:'#dfe6ea', metal:'#9aa6ad', roof:'pelana' },
  { id:'industrial', name:'Industrial', desc:'Bata ekspos, metal, abu gelap, kulit', palette:['#3a3633','#6b5d52','#8a8580','#b5651d','#1a1a1a'], wood:'#6e4b2a', soft:'#7a6f66', metal:'#4a4845', roof:'miring' },
  { id:'tropical', name:'Tropical', desc:'Kayu, hijau daun, rotan, terang alami', palette:['#f3efe2','#d8c9a3','#8a9a5b','#46663a','#caa472'], wood:'#b08850', soft:'#cdd6b0', metal:'#6f6552', roof:'limas' },
  { id:'modern_luxury', name:'Modern Luxury', desc:'Marmer, emas, gelap elegan', palette:['#f4f1ec','#d9c79a','#b8973f','#2a2a2e','#1b1b1f'], wood:'#3a3530', soft:'#cbb9a0', metal:'#b8973f', roof:'dak' },
  { id:'klasik', name:'Klasik', desc:'Ornamen, krem, kayu gelap, mewah', palette:['#efe4cf','#d8c19a','#a8763f','#5e4326','#2e2117'], wood:'#7a5230', soft:'#e0d2b4', metal:'#9a7b3f', roof:'limas' },
];
function styleIdFromName(n){ n=(n||'').toLowerCase(); if(n.includes('scandi'))return'scandinavian'; if(n.includes('japandi'))return'japandi'; if(n.includes('indus'))return'industrial'; if(n.includes('trop'))return'tropical'; if(n.includes('lux')||n.includes('mewah'))return'modern_luxury'; if(n.includes('klasik')||n.includes('classic'))return'klasik'; return'minimalis'; }
function styleRoof(id){ return (INTERIOR_STYLES.find(s=>s.id===id)||{}).roof || 'pelana'; }

// recommended furniture set per room type (base prices in Rp)
const FURNISH_SETS = {
  'Ruang Tamu':[['Sofa 3-dudukan',1,4500000],['Meja Kopi',1,1200000],['Rak / Kabinet TV',1,2500000],['Karpet',1,1500000],['Lampu Lantai',1,800000]],
  'Ruang Keluarga':[['Sofa L-shape',1,7000000],['TV 50"',1,5500000],['Rak Dinding',1,2000000],['Karpet',1,1800000]],
  'Ruang Santai':[['Sofa Santai',1,3500000],['Coffee Table',1,900000],['Bean Bag',2,700000]],
  'Kamar Utama':[['Kasur King + Dipan',1,7500000],['Nakas',2,950000],['Lemari Pakaian 3 Pintu',1,4500000],['Meja Rias',1,2200000]],
  'Kamar Tidur':[['Kasur Queen + Dipan',1,5500000],['Nakas',1,900000],['Lemari Pakaian 2 Pintu',1,3200000],['Meja Belajar',1,1500000]],
  'Dapur':[['Kitchen Set',1,15000000],['Kulkas 2 Pintu',1,5500000],['Kompor + Hood',1,3500000]],
  'Ruang Makan':[['Meja Makan 6 Kursi',1,6500000],['Buffet / Credenza',1,3000000]],
  'Kamar Mandi':[['Kloset Duduk',1,2500000],['Wastafel + Kabinet',1,1800000],['Shower Set',1,1500000]],
  'Ruang Kerja':[['Meja Kerja',1,2800000],['Kursi Kantor Ergonomis',1,2200000],['Rak Buku',1,1800000]],
  'Ruang Gaming':[['Meja Gaming',1,3500000],['Kursi Gaming',1,2800000],['Setup Monitor + Rak',1,4000000],['LED Ambient',1,600000]],
  'Garasi':[['Rak Penyimpanan',1,1500000],['Pintu Lipat',1,4500000]],
  'Teras':[['Set Kursi Teras',1,2500000],['Pot Tanaman',3,400000]],
};
const INTERIOR_FACTOR = { minimalis:1.0, scandinavian:1.12, japandi:1.22, industrial:1.08, tropical:1.06, modern_luxury:1.85, klasik:1.6 };
function furnishList(roomType, styleId) {
  const base = FURNISH_SETS[roomType] || [['Sofa / Tempat Duduk',1,3000000],['Meja',1,1200000],['Penyimpanan',1,2000000]];
  const f = INTERIOR_FACTOR[styleId]||1;
  const cm = (typeof cityMultiplier!=='undefined' ? cityMultiplier[val('citySelect')||'jakarta'] : 1)||1;
  return base.map(([name,qty,price]) => ({ name, qty, price: Math.round(price*f*cm*qty) }));
}
function renderAIInterior(c) {
  // available rooms from the project, else generic list
  const present = [...new Set(floors.flatMap(f=>f.rooms.map(r=>r.type).concat((f.detectedRooms||[]).map(r=>r.name||r.type))))];
  const roomOpts = (present.length?present:['Ruang Tamu','Kamar Utama','Dapur','Ruang Keluarga','Ruang Kerja']);
  if (!roomOpts.includes(aiState.igRoom)) aiState.igRoom = roomOpts[0];
  c.innerHTML = `
    <div class="ai-title">🛋️ Interior Generator</div>
    <div class="ai-sub">Pilih ruang + gaya → dapatkan <b>render interior</b>, <b>daftar furnitur</b>, dan <b>estimasi biaya</b>.</div>
    <div class="ai-card">
      <div class="ai-grid2">
        <div class="ai-field"><label>Ruang</label>
          <select class="ai-input" id="igRoom" onchange="aiState.igRoom=this.value">
            ${roomOpts.map(r=>`<option ${r===aiState.igRoom?'selected':''}>${r}</option>`).join('')}
          </select>
        </div>
        <div class="ai-field"><label>Gaya</label>
          <select class="ai-input" id="igStyle" onchange="aiState.igStyle=this.value">
            ${INTERIOR_STYLES.map(s=>`<option value="${s.id}" ${s.id===aiState.igStyle?'selected':''}>${s.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <button class="ai-btn-primary" style="margin-top:14px;" onclick="generateInterior()">✨ Generate Interior</button>
    </div>
    <div id="igResult"></div>`;
}
function generateInterior() {
  aiState.igRoom = document.getElementById('igRoom').value;
  aiState.igStyle = document.getElementById('igStyle').value;
  const st = INTERIOR_STYLES.find(s=>s.id===aiState.igStyle);
  const room = aiState.igRoom;
  const items = furnishList(room, st.id);
  const total = items.reduce((s,i)=>s+i.price,0);
  const box = document.getElementById('igResult');
  box.innerHTML = `
    <div class="ig-render-wrap"><canvas id="igCanvas" width="720" height="420"></canvas>
      <div class="ig-render-cap">${room} · ${st.name}</div></div>
    <div class="ai-grid2" style="align-items:start; margin-top:16px;">
      <div class="ai-card">
        <div class="ai-card-title">Daftar Furnitur</div>
        ${items.map(i=>`<div class="ig-fitem"><span>${i.name}${i.qty>1?' ×'+i.qty:''}</span><b>Rp ${i.price.toLocaleString('id')}</b></div>`).join('')}
        <div class="ig-ftotal"><span>Estimasi Total</span><b>Rp ${total.toLocaleString('id')}</b></div>
      </div>
      <div class="ai-card">
        <div class="ai-card-title">Palet ${st.name}</div>
        <div class="style-sw" style="margin-bottom:10px;">${st.palette.map(p=>`<span style="background:${p}; height:34px;"></span>`).join('')}</div>
        <button class="ai-btn-ghost" style="width:100%;" onclick="applyInteriorStyle('${st.id}'); showNotif('Gaya diterapkan ke furnitur 3D')">Terapkan ke Furnitur 3D</button>
        <div id="igNarr"></div>
      </div>
    </div>`;
  drawInteriorRender(document.getElementById('igCanvas').getContext('2d'), 720, 420, st, room);
  showNotif('🛋️ Interior '+room+' dibuat');
  if (aiAvailable()) interiorNarrative(room, st);
}
async function interiorNarrative(room, st) {
  const nb = document.getElementById('igNarr'); if (!nb) return;
  nb.innerHTML = '<div class="ai-loading"><div class="ai-spinner"></div> AI menyusun saran...</div>';
  const txt = await aiComplete(`Anda desainer interior. Dalam bahasa Indonesia tanpa markdown, beri 3-4 poin saran penataan ${room} bergaya ${st.name}: material, warna, pencahayaan, dan 1 elemen dekoratif kunci. Singkat.`);
  nb.innerHTML = txt ? `<div class="ai-result" style="margin-top:12px;"><h4>🧠 Saran AI</h4>${escapeHtml(txt)}</div>` : '';
}
// stylised one-point-perspective interior render
function drawInteriorRender(g, W, H, st, room) {
  const P = st.palette;
  const floorC = P[2], wallC = P[0], wallC2 = shade(P[0],-12), backC = P[1], accent = P[4]||P[3];
  // vanishing rectangle (back wall)
  const bx=W*0.28, by=H*0.22, bw=W*0.44, bh=H*0.46;
  // ceiling
  g.fillStyle = shade(wallC, 8); poly(g,[[0,0],[W,0],[bx+bw,by],[bx,by]]);
  // left & right walls (both shaded from the hex, not from an rgb() string)
  g.fillStyle = wallC2; poly(g,[[0,0],[bx,by],[bx,by+bh],[0,H]]);
  g.fillStyle = shade(wallC,-22); poly(g,[[W,0],[bx+bw,by],[bx+bw,by+bh],[W,H]]);
  // floor
  g.fillStyle = floorC; poly(g,[[0,H],[W,H],[bx+bw,by+bh],[bx,by+bh]]);
  // floor planks (perspective lines)
  g.strokeStyle='rgba(0,0,0,0.10)'; g.lineWidth=1.5;
  for(let i=1;i<8;i++){ const t=i/8; g.beginPath(); g.moveTo(t*W, H); g.lineTo(bx+t*bw, by+bh); g.stroke(); }
  // back wall
  g.fillStyle = backC; g.fillRect(bx,by,bw,bh);
  // big window on back wall with daylight
  const wx=bx+bw*0.16, wy=by+bh*0.16, ww=bw*0.68, wh=bh*0.5;
  const sky=g.createLinearGradient(0,wy,0,wy+wh); sky.addColorStop(0,'#bfe0f5'); sky.addColorStop(1,'#eaf4e6');
  g.fillStyle=sky; g.fillRect(wx,wy,ww,wh);
  g.strokeStyle=shade(accent,-20); g.lineWidth=4; g.strokeRect(wx,wy,ww,wh);
  g.lineWidth=2; g.beginPath(); g.moveTo(wx+ww/2,wy); g.lineTo(wx+ww/2,wy+wh); g.moveTo(wx,wy+wh/2); g.lineTo(wx+ww/2,wy+wh/2); g.stroke();
  // simple furniture by room type (front, on floor)
  drawRoomFurniture(g, W, H, room, st);
  // accent rug
  g.fillStyle = hexA(accent,0.22); ellipse(g, W*0.5, H*0.86, W*0.26, H*0.07);
  // vignette
  const vg=g.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.8); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.22)');
  g.fillStyle=vg; g.fillRect(0,0,W,H);
}
function drawRoomFurniture(g, W, H, room, st) {
  const soft=st.soft, wood=st.wood, accent=st.palette[4]||st.palette[3];
  const baseY=H*0.84;
  if (/Tamu|Keluarga|Santai/.test(room)) {
    box3d(g, W*0.30, baseY, W*0.4, H*0.12, soft);                 // sofa
    box3d(g, W*0.44, baseY+H*0.02, W*0.12, H*0.05, wood);         // coffee table
    box3d(g, W*0.72, baseY-H*0.04, W*0.05, H*0.16, accent);       // floor lamp
  } else if (/Kamar/.test(room) && !/Mandi/.test(room)) {
    box3d(g, W*0.32, baseY, W*0.36, H*0.14, soft);                // bed
    box3d(g, W*0.30, baseY-H*0.02, W*0.06, H*0.06, wood);         // nightstand
    box3d(g, W*0.70, baseY-H*0.10, W*0.10, H*0.22, wood);         // wardrobe
  } else if (/Dapur/.test(room)) {
    box3d(g, W*0.22, baseY-H*0.06, W*0.5, H*0.06, wood);          // counter
    box3d(g, W*0.6, baseY, W*0.18, H*0.1, accent);                // island
  } else if (/Mandi/.test(room)) {
    box3d(g, W*0.30, baseY, W*0.12, H*0.1, soft);                 // toilet
    box3d(g, W*0.52, baseY-H*0.02, W*0.16, H*0.06, wood);         // vanity
  } else if (/Kerja|Gaming/.test(room)) {
    box3d(g, W*0.30, baseY-H*0.02, W*0.26, H*0.07, wood);         // desk
    box3d(g, W*0.40, baseY+H*0.02, W*0.08, H*0.1, accent);        // chair
    box3d(g, W*0.66, baseY-H*0.10, W*0.1, H*0.2, soft);           // shelf
  } else {
    box3d(g, W*0.34, baseY, W*0.32, H*0.12, soft);
  }
}
// helpers
function poly(g,pts){ g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.fill(); }
function ellipse(g,cx,cy,rx,ry){ g.beginPath(); g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); g.fill(); }
function box3d(g,x,y,w,h,color){ const d=Math.min(w,h)*0.4; g.fillStyle=shade(color,-18); poly(g,[[x,y-h],[x+w,y-h],[x+w+d,y-h-d],[x+d,y-h-d]]); g.fillStyle=shade(color,-30); poly(g,[[x+w,y-h],[x+w,y],[x+w+d,y-d],[x+w+d,y-h-d]]); g.fillStyle=color; g.fillRect(x,y-h,w,h); }
function shade(hex,amt){ const c=hexToRgb(hex); return `rgb(${clamp(c.r+amt)},${clamp(c.g+amt)},${clamp(c.b+amt)})`; }
function hexA(hex,a){ const c=hexToRgb(hex); return `rgba(${c.r},${c.g},${c.b},${a})`; }
function clamp(v){ return Math.max(0,Math.min(255,v|0)); }
function hexToRgb(hex){ hex=(hex||'#888')+''; const m=hex.match(/rgba?\(([^)]+)\)/); if(m){ const p=m[1].split(',').map(x=>parseInt(x)); return {r:p[0]||0,g:p[1]||0,b:p[2]||0}; } hex=hex.replace('#',''); if(hex.length===3)hex=hex.split('').map(x=>x+x).join(''); const n=parseInt(hex,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
function applyInteriorStyle(id) {
  const st = INTERIOR_STYLES.find(s=>s.id===id); if (!st) return;
  saveSnapshot();
  aiState.interiorStyle = id;
  let count = 0;
  floors.forEach(f => (f.furnitures||[]).forEach(ft => {
    const nm = (ft.defId||'')+' '+(ft.name||'');
    if (/sofa|kursi|kasur|bed|cushion/i.test(nm)) ft.color = st.soft;
    else if (/meja|lemari|rak|nakas|island|rias|tv|kabinet|filing/i.test(nm)) ft.color = st.wood;
    else if (/kompor|kulkas|ac|sink|wastafel|toilet|shower|metal/i.test(nm)) ft.color = st.metal;
    else ft.color = st.palette[2];
    count++;
  }));
  render();
  showNotif('🛋️ Gaya '+st.name+' diterapkan ke '+count+' furnitur');
}

// ---- util ----
function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
