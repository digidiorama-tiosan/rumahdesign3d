// ===================== AI PHOTOREALISTIC RENDER (OpenAI) =====================
// Captures the current 3D WebGL canvas and asks OpenAI gpt-image-1 to reimagine it
// as a photorealistic architectural visualization. Key is stored locally (this PC only).

const OAI_KEY_STORE = 'rumah3d_openai_key';
let airSourceId = null;      // canvas container id to capture
let airLastDataUrl = null;   // last captured source PNG
let airResultUrl = null;

function getOAIKey() { try { return localStorage.getItem(OAI_KEY_STORE) || ''; } catch(e){ return ''; } }
function setOAIKey(k) { try { localStorage.setItem(OAI_KEY_STORE, k.trim()); } catch(e){} }

const AIR_STYLES = {
  siang:   { label:'☀️ Siang Cerah', extra:'bright midday sunlight, clear blue sky, sharp shadows' },
  senja:   { label:'🌇 Senja', extra:'golden hour sunset, warm orange light, long soft shadows, dramatic sky' },
  malam:   { label:'🌙 Malam', extra:'night scene, warm interior lights glowing through windows, street lamps, dusk blue sky' },
  mendung: { label:'⛅ Sejuk', extra:'soft overcast diffused light, lush green tropical landscaping' },
};

function openAIRender(sourceId) {
  if (typeof requireFeature==='function' && !requireFeature('airender')) return;
  airSourceId = sourceId;
  // capture immediately
  const cont = document.getElementById(sourceId);
  const canvas = cont ? cont.querySelector('canvas') : null;
  if (!canvas) { showNotif('⚠️ Buka tampilan 3D dulu'); return; }
  try { airLastDataUrl = canvas.toDataURL('image/png'); }
  catch(e) { airLastDataUrl = null; }
  document.getElementById('modalAIRender').classList.add('show');
  renderAIRenderUI();
}
function closeAIRender() { document.getElementById('modalAIRender').classList.remove('show'); }

function renderAIRenderUI(state) {
  const body = document.getElementById('airenderBody');
  const key = getOAIKey();
  const hasKey = !!key;
  body.innerHTML = `
    <div class="air-left">
      <div class="air-panel">
        <div class="air-h">1 · API Key OpenAI</div>
        <div class="air-sub">Disimpan hanya di browser PC ini (localStorage). Tidak dikirim ke mana pun selain OpenAI saat Anda menekan Render.</div>
        <div class="air-keyrow">
          <input id="airKey" type="password" class="air-input" placeholder="sk-..." value="${key.replace(/"/g,'')}">
          <button class="air-btn" onclick="saveAirKey()">Simpan</button>
        </div>
        <div class="air-keystat">${hasKey ? '✅ Key tersimpan' : '⚠️ Belum ada key'}</div>
      </div>

      <div class="air-panel">
        <div class="air-h">2 · Suasana</div>
        <div class="air-styles" id="airStyles">
          ${Object.entries(AIR_STYLES).map(([k,v],i)=>`<div class="air-chip ${i===0?'active':''}" data-style="${k}" onclick="pickAirStyle('${k}')">${v.label}</div>`).join('')}
        </div>
        <div class="air-h" style="margin-top:14px;">Detail tambahan (opsional)</div>
        <textarea id="airExtra" class="air-textarea" placeholder="cth: cat fasad abu-abu & putih, pagar hitam, taman tropis, mobil putih di carport"></textarea>
        <div class="air-h" style="margin-top:14px;">Ukuran</div>
        <select id="airSize" class="air-input">
          <option value="1536x1024">Landscape (1536×1024)</option>
          <option value="1024x1024">Persegi (1024×1024)</option>
          <option value="1024x1536">Potret (1024×1536)</option>
        </select>
      </div>

      <button class="air-render-btn" id="airRenderBtn" onclick="runAIRender()" ${hasKey?'':'disabled'}>✨ Render Fotorealistik</button>
      <div class="air-note">Memakai model <b>gpt-image-1</b> (butuh akses Images API & verifikasi organisasi di akun OpenAI Anda). Biaya render ditagih ke akun OpenAI Anda. Hasil adalah interpretasi AI — tata letak dipertahankan, detail bisa berbeda.</div>
    </div>

    <div class="air-right">
      <div class="air-preview-box">
        <div class="air-preview-label">Sumber (snapshot 3D)</div>
        ${airLastDataUrl ? `<img src="${airLastDataUrl}" class="air-img">` : '<div class="air-empty">Tidak ada snapshot</div>'}
      </div>
      <div class="air-preview-box" id="airResultBox">
        <div class="air-preview-label">Hasil AI</div>
        <div class="air-empty">Tekan "Render Fotorealistik"</div>
      </div>
    </div>`;
}
function saveAirKey() {
  const v = document.getElementById('airKey').value;
  setOAIKey(v);
  showNotif('🔑 API key disimpan (lokal)');
  renderAIRenderUI();
}
function pickAirStyle(k) {
  document.querySelectorAll('#airStyles .air-chip').forEach(c=>c.classList.toggle('active', c.dataset.style===k));
}
function currentAirStyle() {
  const el = document.querySelector('#airStyles .air-chip.active');
  return el ? el.dataset.style : 'siang';
}

function buildAirPrompt() {
  const styleKey = currentAirStyle();
  const st = AIR_STYLES[styleKey];
  const extra = (document.getElementById('airExtra').value||'').trim();
  const subject = airSourceId === 'dev3d-canvas-container'
    ? 'an aerial architectural visualization of an Indonesian residential housing complex (perumahan) with multiple identical houses, internal roads, carports and landscaping'
    : 'a photorealistic architectural exterior visualization of a modern Indonesian house';
  return `Convert this 3D massing model screenshot into a photorealistic architectural render of ${subject}. `
    + `Keep the exact same layout, building positions, proportions and camera viewpoint as the input image. `
    + `Apply realistic materials: plastered painted walls, clay roof tiles, glass windows, asphalt roads, real grass and tropical plants, realistic concrete. `
    + `${st.extra}. Professional architectural photography, high detail, realistic global illumination, ultra realistic. `
    + (extra ? `Additional details: ${extra}.` : '');
}

async function runAIRender() {
  const key = getOAIKey();
  if (!key) { showNotif('⚠️ Masukkan API key dulu'); return; }
  if (!airLastDataUrl) { showNotif('⚠️ Tidak ada snapshot 3D'); return; }
  const btn = document.getElementById('airRenderBtn');
  const resultBox = document.getElementById('airResultBox');
  btn.disabled = true; btn.textContent = '⏳ Merender... (15-40 detik)';
  resultBox.innerHTML = '<div class="air-preview-label">Hasil AI</div><div class="air-empty"><div class="ai-spinner"></div>AI sedang merender...</div>';

  try {
    const size = document.getElementById('airSize').value || '1536x1024';
    const blob = await (await fetch(airLastDataUrl)).blob();
    const fd = new FormData();
    fd.append('model', 'gpt-image-1');
    fd.append('image', blob, 'scene.png');
    fd.append('prompt', buildAirPrompt());
    fd.append('size', size);
    fd.append('n', '1');

    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key },
      body: fd
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || ('HTTP ' + res.status);
      throw new Error(msg);
    }
    const b64 = data?.data?.[0]?.b64_json;
    const url = data?.data?.[0]?.url;
    airResultUrl = b64 ? ('data:image/png;base64,' + b64) : url;
    if (!airResultUrl) throw new Error('Respons kosong dari OpenAI');
    resultBox.innerHTML = `<div class="air-preview-label">Hasil AI</div>
      <img src="${airResultUrl}" class="air-img">
      <a class="air-btn" style="margin-top:8px; display:inline-block; text-decoration:none;" href="${airResultUrl}" download="AI_Render_${Date.now()}.png">⬇️ Unduh PNG</a>`;
    showNotif('✨ Render AI selesai!');
  } catch (e) {
    resultBox.innerHTML = `<div class="air-preview-label">Hasil AI</div>
      <div class="air-error">❌ Gagal: ${escapeHtmlSafe(e.message)}<br><br>
      <b>Penyebab umum:</b><br>
      • Key salah / tidak punya akses Images API<br>
      • Organisasi belum diverifikasi untuk gpt-image-1 (cek platform.openai.com → Settings → Verifikasi)<br>
      • Saldo/billing OpenAI habis<br>
      • Diblokir CORS browser — coba jalankan lewat server lokal, bukan file://</div>`;
    showNotif('❌ Render gagal: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = '✨ Render Fotorealistik';
  }
}
function escapeHtmlSafe(s) { return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
