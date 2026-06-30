/* global window */
/* ============================================================
   Quick AI Render — sambung ke backend yang sama dgn
   "AI Render Fotorealistik" (Cloud.invokeAIRender → Edge
   Function 'ai-render' → OpenAI gpt-image-1, API KEY ADMIN).
   Prompt dibangun otomatis & TIDAK ditampilkan ke user.
   ============================================================ */
(function () {
  const STYLE_EN = {
    'Minimalis Modern': 'modern minimalist Indonesian house, flat roof, clean white & grey plaster facade, large glass windows',
    'Japandi': 'Japandi style house, warm wood accents, muted earthy tones, low pitched roof, calm minimal landscaping',
    'Industrial': 'industrial style house, exposed brick and raw concrete, dark metal frames, mono-pitch roof',
    'Scandinavian': 'Scandinavian style house, white walls with natural timber cladding, gable roof, bright airy look',
    'Tropical': 'modern tropical Indonesian house, terracotta clay roof tiles, warm render walls, lush tropical garden',
  };
  const FEAT_EN = {
    pagar: 'front fence and gate', taman: 'landscaped front garden with tropical plants',
    carport: 'covered carport with a car', '2lantai': 'two-storey building',
    musholla: 'small prayer room', kolam: 'a swimming pool',
  };

  // hidden — never surfaced in UI
  function buildPrompt(d, kind) {
    const style = STYLE_EN[d.gaya] || STYLE_EN['Minimalis Modern'];
    const feats = [...(d.needs || [])].map(k => FEAT_EN[k]).filter(Boolean);
    const featStr = feats.length ? (' Include ' + feats.join(', ') + '.') : '';
    const beds = (d.beds || 2) + ' bedrooms';
    if (kind === '3d') {
      return `Convert this massing model into a realistic 3D isometric architectural cutaway render (top-down birds-eye, ~45°) of a ${d.w}x${d.l} meter ${style}, with ${beds}. `
        + `Show interior room layout from above with furniture, surrounded by neighbour houses, street with parked cars, boundary walls and garden.${featStr} `
        + `Keep the same footprint and proportions. Bright daylight, soft shadows, professional 3D visualization, ultra detailed, photorealistic.`;
    }
    return `Convert this 3D massing screenshot into a photorealistic architectural exterior render of a ${d.w}x${d.l} meter ${style}, with ${beds}. `
      + `Keep the exact same layout, building position, proportions and camera viewpoint.${featStr} `
      + `Realistic materials: painted plaster walls, roof tiles, glass windows, real grass and tropical plants, concrete driveway. `
      + `Bright midday sunlight, clear sky, sharp shadows. Professional architectural photography, high detail, ultra realistic.`;
  }

  // crude isometric massing → source image for images/edits (like THREE snapshot)
  function drawSource(d, size) {
    const W = size, H = Math.round(size * 2 / 3);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    // sky
    let sky = x.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#bcd9ef'); sky.addColorStop(1, '#eaf4fb');
    x.fillStyle = sky; x.fillRect(0, 0, W, H);
    // ground
    x.fillStyle = '#bcd49a'; x.fillRect(0, H * 0.58, W, H * 0.42);
    const two = d.needs && d.needs.has('2lantai');
    const cx = W * 0.5, baseY = H * 0.78, bw = W * 0.30, bh = H * (two ? 0.40 : 0.28), dep = W * 0.16;
    // shadow
    x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(cx, baseY + 6, bw * 0.95, dep * 0.5, 0, 0, 7); x.fill();
    // right side
    x.fillStyle = '#d7cebf'; x.beginPath(); x.moveTo(cx + bw / 2, baseY); x.lineTo(cx + bw / 2 + dep, baseY - dep * 0.6); x.lineTo(cx + bw / 2 + dep, baseY - dep * 0.6 - bh); x.lineTo(cx + bw / 2, baseY - bh); x.closePath(); x.fill();
    // front
    x.fillStyle = '#efe9df'; x.fillRect(cx - bw / 2, baseY - bh, bw, bh);
    // windows
    x.fillStyle = '#9fc4dd'; const rows = two ? 2 : 1;
    for (let r = 0; r < rows; r++) for (let i = 0; i < 2; i++) { x.fillRect(cx - bw / 2 + bw * (0.18 + i * 0.42), baseY - bh + bh * (0.18 + r * 0.42), bw * 0.22, bh * 0.24); }
    // roof
    x.fillStyle = '#7a4a33'; x.beginPath(); x.moveTo(cx - bw / 2 - 6, baseY - bh); x.lineTo(cx, baseY - bh - dep * 0.7); x.lineTo(cx + bw / 2 + dep + 6, baseY - bh - dep * 0.6); x.lineTo(cx + bw / 2 + 6, baseY - bh); x.closePath(); x.fill();
    // trees
    x.fillStyle = '#5f8d4e'; [[W * 0.18, baseY - 10], [W * 0.84, baseY - 4]].forEach(([tx, ty]) => { x.beginPath(); x.arc(tx, ty, W * 0.035, 0, 7); x.fill(); });
    return c.toDataURL('image/png');
  }

  function cloud() {
    try { if (window.Cloud) return window.Cloud; } catch (e) {}
    try { if (window.parent && window.parent.Cloud) return window.parent.Cloud; } catch (e) {}
    return null;
  }
  function available() { const C = cloud(); return !!(C && C.isLoggedIn && C.isLoggedIn() && C.invokeAIRender); }

  async function generate(d, kind) {
    const C = cloud();
    if (!available()) { const e = new Error('DEMO'); e.demo = true; throw e; }
    const size = kind === '3d' ? '1536x1024' : '1536x1024';
    const imageBase64 = drawSource(d, 1024);
    const prompt = buildPrompt(d, kind);
    const data = await C.invokeAIRender({ imageBase64, prompt, size });
    if (!data || !data.image) throw new Error('Respons render kosong');
    return data.image;
  }

  window.QuickRender = { generate, available, _buildPrompt: buildPrompt };
})();
