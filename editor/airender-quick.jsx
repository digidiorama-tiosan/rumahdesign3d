/* global window */
/* ============================================================
   Quick AI Render — sambung ke backend yang sama dgn
   "AI Render Fotorealistik" (Cloud.invokeAIRender → Edge
   Function 'ai-render' → OpenAI gpt-image-1-mini, API KEY ADMIN).
   Prompt dibangun otomatis & TIDAK ditampilkan ke user.
   ============================================================ */
(function () {
  const STYLE_EN = {
    'Minimalis Modern': 'modern minimalist Indonesian house, flat roof, clean white & grey plaster facade, large glass windows',
    'Japandi': 'Japandi style house, warm wood accents, muted earthy tones, low pitched roof, calm minimal landscaping',
    'Industrial': 'modern minimalist industrial Indonesian house, exposed red brick combined with smooth grey plaster, black matte aluminium frames, dark charcoal gable roof, steel-frame carport',
    'Scandinavian': 'Scandinavian style house, white walls with natural timber cladding, gable roof, bright airy look',
    'Tropical': 'modern tropical Indonesian house, terracotta clay roof tiles, warm render walls, lush tropical garden',
  };
  const FEAT_EN = {
    pagar: 'front fence and gate', taman: 'landscaped front garden with tropical plants',
    carport: 'covered carport with a car', '2lantai': 'two-storey building',
    musholla: 'small prayer room', kolam: 'a swimming pool',
  };

  // Penguncian denah + realisme — disuntikkan ke semua prompt (hidden)
  const LOCK = `This 2D floor plan is the SINGLE SOURCE OF TRUTH: preserve the EXACT same room layout, positions, sizes, proportions and building orientation; do NOT rotate, mirror, swap, add or remove any room; if aesthetics ever conflict with the plan, follow the plan. `;
  const REALISM = `Construction: brick + plaster walls 10-15 cm thick, ~3 m ceiling height, doors ~210 cm tall, windows proportional to each room's function. Materials must be textured, never flat: exterior combining exposed red brick and smooth grey plaster, black matte (doff) aluminium window & door frames, matte ceramic / vinyl floors, dark charcoal roof tiles on a gable roof at a realistic 30-35 degree pitch, a steel-frame flat-roof carport. Use real-scale furniture without changing any room size. Keep a consistent, realistic scale between all rooms. Use physically based rendering (PBR) materials, global illumination, soft natural shadows and subtle realistic reflections. `;
  const STRICT = `STRICT MODE: do not redesign, reinterpret or approximate — match the plan EXACTLY; the 2D plan is the blueprint reference and the output must align with its spatial arrangement; the facade/3D MUST follow the interior room division (asymmetric if the plan is asymmetric); never add a window or opening that does not correspond to a real room; if necessary, reduce aesthetic quality to keep layout accuracy. `;

  // hidden — never surfaced in UI
  function buildPrompt(d, kind) {
    const style = STYLE_EN[d.gaya] || STYLE_EN['Minimalis Modern'];
    const two = d.needs && d.needs.has('2lantai');
    const storeyStr = two ? 'two-storey' : 'single-storey';
    const feats = [...(d.needs || [])].filter(k => k !== '2lantai').map(k => FEAT_EN[k]).filter(Boolean);
    const featStr = feats.length ? (' Include ' + feats.join(', ') + '.') : '';
    const beds = (d.beds || 2) + ' bedrooms';
    if (kind === '3d') {
      return `Convert this top-down 2D architectural floor plan into a realistic 3D isometric cutaway render, isometric camera at a 30-45 degree angle, with the roof partially removed to reveal the furnished interior; clean architectural look, not cartoon. `
        + LOCK + STRICT
        + `The rooms are connected by OPEN DOORWAYS and a central hallway/corridor running from the front entrance to the rooms — keep door positions and inter-room access exactly as in the plan; do NOT seal rooms as fully closed boxes. `
        + `Room layout (the FRONT of the house is at the bottom): kitchen and dining span the BACK with the cooking counter at the back-right, second bedroom at the middle-left, bathroom at the middle-right, third bedroom on the right just behind the living room, master bedroom at the FRONT-left, living room at the FRONT-right, an open carport clearly on the RIGHT side of the front, terrace at the front centre and garden at the front. `
        + `A ${d.w}x${d.l} meter ${storeyStr} ${style} with ${beds}. Furnish each room with real-scale furniture (beds, wardrobes, sofa, coffee table, dining set, kitchen counter, toilet). `
        + `Add boundary walls, concrete driveway, neighbour houses and street context with parked cars.${featStr} `
        + REALISM
        + `Realistic sunlight plus ambient bounce light, professional architectural 3D visualization, ultra detailed, photorealistic.`;
    }
    return `Convert this simple front-elevation massing into an ultra-realistic straight-on FRONT VIEW (front facade, "tampak depan") of a ${d.w} meter wide ${storeyStr} ${style}, with ${beds}. `
      + `Frontal eye-level camera directly facing the facade, facade parallel to the image. Facade requirements (proportions MUST follow the interior room division, asymmetric if the plan is asymmetric): the FRONT-LEFT bedroom MUST have a window; the LIVING ROOM MUST have a large main window/opening; the open carport with a car must be clearly visible on the RIGHT side; the main entrance is at the centre. `
      + LOCK + STRICT
      + REALISM
      + `Environment: real grass lawn and a low minimalist fence with a few plants. Warm golden-hour / bright realistic daylight, natural soft shadows, subtle reflections. Real textures: exposed brick, plaster and steel. Professional real-estate architectural photography, ultra realistic, high detail.`;
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
    // koridor tengah (tengah → depan)
    x.fillStyle = '#e6ddcd'; x.fillRect(RX(47), RY(30), RW(6), RH(70));
    // DAPUR belakang (lebar penuh; counter masak kanan)
    room(0, 0, 100, 30, '#e6ddcd'); furn(70, 6, 26, 14, '#a07d4d'); furn(4, 5, 30, 7, '#cfcabf');
    // KIRI
    room(0, 30, 47, 30, '#e6ddcd'); furn(8, 36, 22, 14, '#f3f0ea');   // KT2 + kasur (tengah-kiri)
    room(0, 60, 47, 40, '#ece5d8'); furn(8, 66, 31, 18, '#f3f0ea');   // KT Utama + kasur (depan-kiri)
    // KANAN
    room(53, 30, 47, 16, '#cfe0e6'); furn(60, 33, 18, 9, '#ffffff');  // KM + kloset (tengah-kanan)
    room(53, 46, 47, 24, '#ece5d8'); furn(60, 52, 22, 12, '#f3f0ea'); // KT3 + kasur (kanan, di belakang ruang tamu)
    room(53, 70, 47, 30, '#ece5d8'); furn(74, 78, 18, 16, '#cfd3d6'); // Ruang Tamu + sofa (depan-kanan)
    // teras (depan tengah) + carport (depan KANAN, di halaman)
    x.fillStyle = '#e6ddcd'; x.fillRect(pxl + pw * 0.30, pyt + hh, pw * 0.30, (ph - hh) * 0.42);
    x.fillStyle = '#cfccc6'; x.fillRect(pxl + pw * 0.66, pyt + hh, pw * 0.31, (ph - hh) * 0.72);
    x.fillStyle = '#2c3138'; x.fillRect(pxl + pw * 0.71, pyt + hh + (ph - hh) * 0.12, pw * 0.20, (ph - hh) * 0.46);
    // pintu (jeda dinding) ke koridor — supaya AI tahu ada sirkulasi, bukan kotak tertutup
    x.fillStyle = '#efe9df';
    const door = (rx, ry, rw, rh) => x.fillRect(RX(rx), RY(ry), RW(rw), RH(rh));
    door(45.5, 20, 3.2, 8);  // Dapur(belakang) ↔ koridor
    door(51.3, 20, 3.2, 8);
    door(45.5, 42, 3.2, 9);  // KT2 → koridor
    door(45.5, 76, 3.2, 9);  // KT Utama → koridor (depan-kiri)
    door(51.3, 36, 3.2, 7);  // KM → koridor
    door(51.3, 56, 3.2, 9);  // KT3 → koridor
    door(51.3, 84, 3.2, 9);  // Ruang Tamu → koridor (depan-kanan)
    return c.toDataURL('image/png');
  }

  // tampak depan (front elevation) → sumber untuk Render AI (carport KANAN)
  function drawFront(d, size) {
    const W = size, H = Math.round(size * 2 / 3);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const two = d.needs && d.needs.has('2lantai');
    let sky = x.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#f6d7a4'); sky.addColorStop(1, '#fbeccd');
    x.fillStyle = sky; x.fillRect(0, 0, W, H);
    const gy = H * 0.72;
    x.fillStyle = '#cfcabf'; x.fillRect(0, gy, W, H - gy);             // driveway/trotoar
    x.fillStyle = '#9cc06a'; x.fillRect(0, gy, W * 0.55, H * 0.09);    // rumput depan (kiri)
    const bh = (two ? 0.46 : 0.34) * H, by = gy - bh;
    const fx0 = W * 0.15, fx1 = W * 0.58;                             // fasad utama (kiri-tengah)
    x.fillStyle = '#efe9df'; x.fillRect(fx0, by, fx1 - fx0, bh);
    x.fillStyle = '#9a6b52'; x.fillRect(fx0, by, (fx1 - fx0) * 0.42, bh); // bata ekspos (kiri)
    // carport KANAN
    x.fillStyle = '#3a3a3a'; x.fillRect(fx1, by + bh * 0.22, W * 0.30, H * 0.045);
    x.fillStyle = '#cfccc6'; x.fillRect(fx1 + W * 0.006, by + bh * 0.26, W * 0.012, gy - (by + bh * 0.26));
    x.fillStyle = '#cfccc6'; x.fillRect(fx1 + W * 0.27, by + bh * 0.26, W * 0.012, gy - (by + bh * 0.26));
    const carY = gy - H * 0.10; x.fillStyle = '#b9bcc0'; x.fillRect(fx1 + W * 0.02, carY, W * 0.21, H * 0.09);
    x.fillStyle = '#2c3138'; x.fillRect(fx1 + W * 0.04, carY + H * 0.012, W * 0.16, H * 0.04);
    // atap pelana
    x.fillStyle = '#3a3a3a'; x.beginPath(); x.moveTo(fx0 - 8, by); x.lineTo((fx0 + fx1) / 2, by - H * 0.13); x.lineTo(fx1 + 8, by); x.closePath(); x.fill();
    // jendela KT Utama (kiri)
    x.fillStyle = '#9fc4dd'; x.fillRect(fx0 + (fx1 - fx0) * 0.10, by + bh * 0.34, (fx1 - fx0) * 0.22, bh * 0.30);
    // pintu masuk (tengah)
    x.fillStyle = '#5b4630'; x.fillRect(fx0 + (fx1 - fx0) * 0.42, gy - bh * 0.52, (fx1 - fx0) * 0.14, bh * 0.52);
    // jendela utama ruang tamu (kanan fasad, lebih besar)
    x.fillStyle = '#9fc4dd'; x.fillRect(fx0 + (fx1 - fx0) * 0.62, by + bh * 0.30, (fx1 - fx0) * 0.30, bh * 0.40);
    // pagar minimalis + tanaman
    x.strokeStyle = '#2c2c2c'; x.lineWidth = Math.max(1, W * 0.004);
    for (let p = W * 0.04; p < W * 0.52; p += W * 0.03) { x.beginPath(); x.moveTo(p, gy - H * 0.05); x.lineTo(p, gy); x.stroke(); }
    x.fillStyle = '#5f8d4e'; [0.06, 0.12].forEach(fxp => { x.beginPath(); x.arc(W * fxp, gy - H * 0.02, W * 0.022, 0, 7); x.fill(); });
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
  // plan user (free/pro/dev) dari host — utk cegat Free sebelum panggil server
  function planNow() {
    try { if (typeof window.getPlan === 'function') return window.getPlan(); } catch (e) {}
    try { if (window.parent && typeof window.parent.getPlan === 'function') return window.parent.getPlan(); } catch (e) {}
    try { return localStorage.getItem('rumah3d_user_plan') || 'free'; } catch (e) {}
    return 'free';
  }

  async function generate(d, kind) {
    const C = cloud();
    if (!available()) { const e = new Error('DEMO'); e.demo = true; throw e; }
    // Render AI khusus Pro & Developer — Free dicegat lebih awal (server juga menolak)
    if (planNow() === 'free') { const e = new Error('UPGRADE'); e.upgrade = true; e.plan = 'free'; throw e; }
    const size = '1024x1024';
    const imageBase64 = kind === '3d' ? drawPlan(d, 1024) : drawFront(d, 1024);
    const prompt = buildPrompt(d, kind);
    let data;
    try {
      data = await C.invokeAIRender({ imageBase64, prompt, size });
    } catch (err) {
      const code = err && err.body && err.body.error;
      const bcode = err && err.body && err.body.code;
      if (err && (err.status === 402 || code === 'QUOTA_EMPTY')) {
        const e = new Error('UPGRADE'); e.upgrade = true; e.plan = (err.body && err.body.plan) || planNow(); throw e;
      }
      // Kredit OpenAI (admin) habis — kuota pelanggan tidak terpotong
      if (err && (err.status === 503 || bcode === 'PROVIDER_QUOTA')) {
        const e = new Error((err.body && err.body.error) || 'Layanan Render AI sedang tidak tersedia. Kuota Anda tidak terpotong — coba lagi nanti.');
        e.provider = true; throw e;
      }
      throw err;
    }
    if (!data || !data.image) throw new Error('Respons render kosong');
    return data.image;
  }

  window.QuickRender = { generate, available, _buildPrompt: buildPrompt, _drawPlan: drawPlan, _drawFront: drawFront };
})();
