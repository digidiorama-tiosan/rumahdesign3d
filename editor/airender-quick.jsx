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
    const two = d.needs && d.needs.has('2lantai');
    const storeyStr = two ? 'two-storey' : 'single-storey';
    const feats = [...(d.needs || [])].filter(k => k !== '2lantai').map(k => FEAT_EN[k]).filter(Boolean);
    const featStr = feats.length ? (' Include ' + feats.join(', ') + '.') : '';
    const beds = (d.beds || 2) + ' bedrooms';
    if (kind === '3d') {
      return `Convert this top-down 2D architectural floor plan into a realistic 3D isometric cutaway render, bird's-eye view at ~45 degrees, with the roof partially removed to reveal the furnished interior. `
        + `CRITICAL: preserve the EXACT same room layout, positions, sizes and wall arrangement shown in the floor plan. `
        + `Room layout: master bedroom at top-left, kitchen and dining at top-right, second bedroom at middle-left, bathroom at middle-right, third bedroom just below the bathroom, garage with a car at bottom-left, living room at bottom-right, front terrace and garden at the front. `
        + `A ${d.w}x${d.l} meter ${storeyStr} ${style} with ${beds}. Furnish each room realistically (beds, wardrobes, sofa, coffee table, dining set, kitchen counter, toilet). `
        + `Add boundary walls, concrete driveway, neighbour houses and street context with parked cars.${featStr} `
        + `Bright daylight, soft realistic shadows, professional architectural 3D visualization, ultra detailed, photorealistic.`;
    }
    return `Convert this 3D massing screenshot into a photorealistic architectural exterior render of a ${d.w}x${d.l} meter ${storeyStr} ${style}, with ${beds}. `
      + `Keep the exact same layout, building position, proportions and camera viewpoint.${featStr} `
      + `Realistic materials: painted plaster walls, roof tiles, glass windows, real grass and tropical plants, concrete driveway. `
      + `Bright midday sunlight, clear sky, sharp shadows. Professional architectural photography, high detail, ultra realistic.`;
  }

  // top-down 2D floor-plan schematic → sumber akurat untuk 3D cutaway (meniru FloorPlan)
  function drawPlan(d, size) {
    const W = size, H = Math.round(size * 2 / 3);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = '#fbfaf7'; x.fillRect(0, 0, W, H);
    const ratio = (d.w || 6) / ((d.l || 12) * 1.18);
    const ph = H * 0.9, pw = ph * ratio, pxl = (W - pw) / 2, pyt = (H - ph) / 2;
    const hh = ph * 0.85; // tinggi rumah; sisanya taman depan
    // taman depan
    x.fillStyle = '#7aa64f'; x.fillRect(pxl, pyt + hh, pw, ph - hh);
    x.fillStyle = '#5d8a3f';
    [0.16, 0.34, 0.66, 0.86].forEach(fx => { x.beginPath(); x.arc(pxl + pw * fx, pyt + hh + (ph - hh) * 0.5, pw * 0.045, 0, 7); x.fill(); });
    // dinding luar + lantai interior
    x.fillStyle = '#23211e'; x.fillRect(pxl, pyt, pw, hh);
    const m = pw * 0.02, ix = pxl + m, iy = pyt + m, iw = pw - m * 2, ih = hh - m * 2;
    x.fillStyle = '#ece5d8'; x.fillRect(ix, iy, iw, ih);
    const RX = (p) => ix + iw * p / 100, RY = (p) => iy + ih * p / 100, RW = (w) => iw * w / 100, RH = (h) => ih * h / 100;
    const room = (rx, ry, rw, rh, fill) => { x.fillStyle = fill; x.fillRect(RX(rx), RY(ry), RW(rw), RH(rh)); x.strokeStyle = '#8d8473'; x.lineWidth = Math.max(1, pw * 0.004); x.strokeRect(RX(rx), RY(ry), RW(rw), RH(rh)); };
    const furn = (rx, ry, rw, rh, fill) => { x.fillStyle = fill; x.fillRect(RX(rx), RY(ry), RW(rw), RH(rh)); };
    // koridor tengah
    x.fillStyle = '#e6ddcd'; x.fillRect(RX(47), iy, RW(6), ih);
    // KIRI
    room(0, 0, 47, 38, '#ece5d8'); furn(8, 6, 31, 16, '#f3f0ea');     // KT Utama + kasur
    room(0, 38, 47, 24, '#e6ddcd'); furn(8, 43, 22, 12, '#f3f0ea');   // KT2 + kasur
    room(0, 62, 47, 38, '#cfccc6'); furn(12, 70, 23, 24, '#2c3138');  // Garasi + mobil
    // KANAN
    room(53, 0, 47, 38, '#e6ddcd'); furn(60, 16, 26, 14, '#a07d4d');  // Dapur + meja makan
    room(53, 38, 47, 15, '#cfe0e6'); furn(60, 42, 18, 8, '#ffffff');  // KM + kloset
    room(53, 53, 47, 20, '#ece5d8'); furn(60, 58, 22, 11, '#f3f0ea'); // KT3 + kasur
    room(53, 73, 47, 27, '#ece5d8'); furn(74, 80, 18, 14, '#cfd3d6'); // Ruang Tamu + sofa
    // teras
    x.fillStyle = '#e6ddcd'; x.fillRect(pxl + pw * 0.40, pyt + hh, pw * 0.34, (ph - hh) * 0.42);
    return c.toDataURL('image/png');
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
    const size = '1536x1024';
    const imageBase64 = kind === '3d' ? drawPlan(d, 1024) : drawSource(d, 1024);
    const prompt = buildPrompt(d, kind);
    const data = await C.invokeAIRender({ imageBase64, prompt, size });
    if (!data || !data.image) throw new Error('Respons render kosong');
    return data.image;
  }

  window.QuickRender = { generate, available, _buildPrompt: buildPrompt, _drawPlan: drawPlan };
})();
