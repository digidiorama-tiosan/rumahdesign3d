// ===================== AI PHOTOREALISTIC RENDER (server-side, aman) =====================
// Snapshot kanvas 3D dikirim ke Edge Function 'ai-render' di Supabase.
// API key OpenAI TIDAK ada di browser — dikelola admin & dipakai di server.
// Kuota: Pro 1×/bulan, Dev 3×/bulan (reset bulanan). Habis → beli per render.

let airSourceId = null;      // id container kanvas yang di-capture
let airLastDataUrl = null;   // PNG sumber terakhir
let airResultUrl = null;
let airStatus = null;        // {plan, freeQuota, used, remainingFree, credits}

const AIR_STYLES = {
  siang:   { label:'☀️ Siang Cerah', extra:'bright midday sunlight, clear blue sky, sharp shadows' },
  senja:   { label:'🌇 Senja', extra:'golden hour sunset, warm orange light, long soft shadows, dramatic sky' },
  malam:   { label:'🌙 Malam', extra:'night scene, warm interior lights glowing through windows, street lamps, dusk blue sky' },
  mendung: { label:'⛅ Sejuk', extra:'soft overcast diffused light, lush green tropical landscaping' },
};

function openAIRender(sourceId) {
  if (typeof requireFeature==='function' && !requireFeature('airender')) return;
  airSourceId = sourceId;
  const cont = document.getElementById(sourceId);
  const canvas = cont ? cont.querySelector('canvas') : null;
  if (!canvas) { showNotif('⚠️ Buka tampilan 3D dulu'); return; }
  try { airLastDataUrl = canvas.toDataURL('image/png'); }
  catch(e) { airLastDataUrl = null; }
  document.getElementById('modalAIRender').classList.add('show');
  renderAIRenderUI();
  refreshAirStatus();
}
function closeAIRender() { document.getElementById('modalAIRender').classList.remove('show'); }

function renderAIRenderUI() {
  const body = document.getElementById('airenderBody');
  body.innerHTML = `
    <div class="air-left">
      <div class="air-panel" id="airStatusBox">
        <div class="air-keystat">Memuat kuota…</div>
      </div>

      <div class="air-panel">
        <div class="air-h">Suasana</div>
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

      <button class="air-render-btn" id="airRenderBtn" onclick="runAIRender()" disabled>✨ Render Fotorealistik</button>
      <div class="air-note">Render diproses aman di server. Hasil adalah interpretasi AI — tata letak dipertahankan, detail bisa berbeda.</div>
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

async function refreshAirStatus() {
  const el = document.getElementById('airStatusBox');
  if (!window.Cloud || !Cloud.isLoggedIn || !Cloud.isLoggedIn()) {
    airStatus = null;
    if (el) el.innerHTML = '<div class="air-h">Kuota Render</div><div class="air-keystat">⚠️ Masuk dulu (Akun) untuk memakai AI Render — kuota terikat akun Anda.</div>';
    updateRenderBtn();
    return;
  }
  if (el) el.innerHTML = '<div class="air-h">Kuota Render</div><div class="air-keystat">Memuat…</div>';
  try {
    airStatus = await Cloud.getRenderStatus();
    renderAirStatusBox();
  } catch (e) {
    if (el) el.innerHTML = `<div class="air-h">Kuota Render</div><div class="air-error" style="font-size:11px;">Gagal memuat kuota: ${escapeHtmlSafe(e.message)}</div>`;
  }
  updateRenderBtn();
}

function renderAirStatusBox() {
  const el = document.getElementById('airStatusBox');
  if (!el || !airStatus) return;
  const { plan, freeQuota, remainingFree, credits } = airStatus;
  const planName = plan==='dev' ? '👑 Developer' : plan==='pro' ? '⭐ Pro' : '🆓 Free';
  const total = (remainingFree||0) + (credits||0);
  el.innerHTML = `
    <div class="air-h">Kuota Render</div>
    <div class="air-quota">
      <div class="air-quota-num">${total}</div>
      <div class="air-quota-lbl">render tersedia
        <span>${remainingFree||0} gratis bulan ini${credits ? ` · ${credits} berbayar` : ''}</span>
      </div>
    </div>
    <div class="air-sub" style="margin-bottom:0;">Paket <b>${planName}</b> — jatah ${freeQuota}× / bulan, reset tiap bulan.</div>
    ${ total<=0 ? `
      <button class="air-btn-pay" onclick="buyRenderCredit()">💳 Beli 1 render — Rp 5.000</button>
      <div class="air-keystat" style="margin-top:6px;">Pembayaran masih simulasi (akan disambung ke gateway).</div>` : '' }
  `;
}

function updateRenderBtn() {
  const btn = document.getElementById('airRenderBtn');
  if (!btn) return;
  const loggedIn = window.Cloud && Cloud.isLoggedIn && Cloud.isLoggedIn();
  const total = airStatus ? ((airStatus.remainingFree||0) + (airStatus.credits||0)) : 0;
  btn.disabled = !loggedIn || total <= 0;
}

async function buyRenderCredit() {
  if (!confirm('Beli 1 render seharga Rp 5.000?\n\n(Sementara ini disimulasikan — belum ada transaksi nyata.)')) return;
  try {
    await Cloud.addRenderCreditDemo();
    showNotif('✅ 1 render ditambahkan');
    await refreshAirStatus();
  } catch (e) { showNotif('❌ Gagal: ' + e.message); }
}

function pickAirStyle(k) {
  document.querySelectorAll('#airStyles .air-chip').forEach(c=>c.classList.toggle('active', c.dataset.style===k));
}
function currentAirStyle() {
  const el = document.querySelector('#airStyles .air-chip.active');
  return el ? el.dataset.style : 'siang';
}

function buildAirPrompt() {
  const st = AIR_STYLES[currentAirStyle()];
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
  if (!window.Cloud || !Cloud.isLoggedIn()) { showNotif('⚠️ Masuk dulu untuk render'); return; }
  if (!airLastDataUrl) { showNotif('⚠️ Tidak ada snapshot 3D'); return; }
  const btn = document.getElementById('airRenderBtn');
  const resultBox = document.getElementById('airResultBox');
  const oldLabel = btn.textContent;
  btn.disabled = true; btn.textContent = '⏳ Merender... (15-40 detik)';
  resultBox.innerHTML = '<div class="air-preview-label">Hasil AI</div><div class="air-empty"><div class="ai-spinner"></div>AI sedang merender...</div>';

  try {
    const size = document.getElementById('airSize').value || '1536x1024';
    const data = await Cloud.invokeAIRender({ imageBase64: airLastDataUrl, prompt: buildAirPrompt(), size });
    airResultUrl = data.image;
    if (!airResultUrl) throw new Error('Respons kosong dari server');
    resultBox.innerHTML = `<div class="air-preview-label">Hasil AI</div>
      <img src="${airResultUrl}" class="air-img">
      <a class="air-btn" style="margin-top:8px; display:inline-block; text-decoration:none;" href="${airResultUrl}" download="AI_Render_${Date.now()}.png">⬇️ Unduh PNG</a>`;
    airStatus = Object.assign({}, airStatus, { remainingFree: data.remainingFree, credits: data.credits });
    renderAirStatusBox();
    showNotif('✨ Render AI selesai!');
  } catch (e) {
    if (e.body?.error === 'QUOTA_EMPTY' || e.status === 402) {
      airStatus = Object.assign({}, airStatus, { remainingFree: 0, credits: 0 });
      renderAirStatusBox();
      resultBox.innerHTML = `<div class="air-preview-label">Hasil AI</div>
        <div class="air-empty">Kuota render bulan ini habis. Beli 1 render (Rp 5.000) di panel kiri untuk melanjutkan.</div>`;
    } else {
      resultBox.innerHTML = `<div class="air-preview-label">Hasil AI</div>
        <div class="air-error">❌ Gagal: ${escapeHtmlSafe(e.message)}<br><br>
        <b>Penyebab umum:</b><br>
        • Admin belum mengatur API key OpenAI (Panel Admin)<br>
        • Organisasi OpenAI belum diverifikasi untuk gpt-image-1<br>
        • Saldo/billing OpenAI habis<br>
        • Edge Function 'ai-render' belum di-deploy</div>`;
    }
    showNotif('❌ Render gagal: ' + e.message);
  } finally {
    btn.textContent = oldLabel;
    updateRenderBtn();
  }
}
function escapeHtmlSafe(s) { return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
