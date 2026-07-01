/* global window */
/* ============================================================
   AI Cost Estimation (RAB) — Option B.
   Urutan sumber:
     1) Cloud.invokeAICost  → Edge Function 'ai-cost' (OpenAI, key admin) [PRODUKSI]
     2) window.claude.complete                                   [PREVIEW]
     3) Fallback rumus pintar (offline)                          [SELALU JALAN]
   Mengembalikan objek RAB terstruktur.
   ============================================================ */
(function () {
  const STYLE_MULT = {
    'Minimalis Modern': 1.0, 'Japandi': 1.12, 'Industrial': 0.95,
    'Scandinavian': 1.08, 'Tropical': 1.03,
  };
  const QUALITY_MULT = { 'ekonomis': 0.78, 'menengah': 1.0, 'premium': 1.35 };
  const CITY_MULT = {
    'Jakarta': 1.12, 'Surabaya': 1.0, 'Bandung': 0.96, 'Medan': 0.92,
    'Makassar': 0.9, 'Yogyakarta': 0.9, 'rata-rata Indonesia': 1.0,
  };
  const BASE_M2 = 3200000;

  function payloadOf(d, opts) {
    return {
      jenis: d.jenis || 'Rumah Tinggal',
      w: d.w, l: d.l,
      storeys: d.needs && d.needs.has('2lantai') ? 2 : 1,
      beds: d.beds || 2,
      style: d.gaya || 'Minimalis Modern',
      quality: (opts && opts.quality) || 'menengah',
      city: (opts && opts.city) || 'rata-rata Indonesia',
      needs: d.needs ? [...d.needs] : [],
    };
  }

  function localEstimate(d, opts) {
    const p = payloadOf(d, opts);
    const buildArea = Math.round(d.w * d.l * (p.storeys === 2 ? 1.7 : 1));
    const m2 = BASE_M2 * (STYLE_MULT[p.style] || 1) * (QUALITY_MULT[p.quality] || 1) * (CITY_MULT[p.city] || 1);
    // fitur tambahan (lump sum)
    let extra = 0;
    const s = d.needs || new Set();
    if (s.has('carport')) extra += 18000000;
    if (s.has('taman')) extra += 12000000;
    if (s.has('pagar')) extra += 22000000;
    if (s.has('musholla')) extra += 15000000;
    if (s.has('kolam')) extra += 45000000;
    const mid = buildArea * m2 + extra;
    const low = Math.round(mid * 0.9), high = Math.round(mid * 1.12);
    const parts = [
      ['Pekerjaan Persiapan', .05], ['Struktur & Pondasi', .26], ['Dinding & Plester', .16],
      ['Atap', .1], ['Lantai & Keramik', .11], ['Pintu & Jendela', .09],
      ['Finishing & Cat', .13], ['MEP (listrik/air/sanitasi)', .1],
    ];
    const items = parts.map(([name, pct]) => ({ name, amount: Math.round(high * pct), pct: Math.round(pct * 100), note: '' }));
    return {
      per_m2_low: Math.round(low / buildArea), per_m2_high: Math.round(high / buildArea),
      total_low: low, total_high: high, items,
      assumptions: [
        `Luas bangunan \u2248 ${buildArea} m² (${p.storeys} lantai)`,
        `Gaya ${p.style}, kualitas ${p.quality}, lokasi ${p.city}`,
        'Estimasi kasar berbasis harga satuan rata-rata; harga aktual tergantung material & tukang.',
      ],
      summary: `Estimasi biaya bangun ${p.jenis.toLowerCase()} ${d.w}\u00d7${d.l} m gaya ${p.style} sekitar ${rpShort(low)}\u2013${rpShort(high)}.`,
      buildArea, source: 'formula',
    };
  }

  function cloud() {
    try { if (window.Cloud) return window.Cloud; } catch (e) {}
    try { if (window.parent && window.parent.Cloud) return window.parent.Cloud; } catch (e) {}
    return null;
  }
  function claudeFn() {
    try { if (window.claude && window.claude.complete) return window.claude.complete; } catch (e) {}
    try { if (window.parent && window.parent.claude && window.parent.claude.complete) return window.parent.claude.complete; } catch (e) {}
    return null;
  }

  function normalize(est, d, opts) {
    const fb = localEstimate(d, opts);
    if (!est || typeof est !== 'object') return fb;
    const num = (v, def) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : def);
    const items = Array.isArray(est.items) && est.items.length
      ? est.items.map(it => ({ name: String(it.name || 'Pekerjaan'), amount: num(it.amount, 0), pct: num(it.pct, 0), note: String(it.note || '') }))
      : fb.items;
    return {
      per_m2_low: num(est.per_m2_low, fb.per_m2_low), per_m2_high: num(est.per_m2_high, fb.per_m2_high),
      total_low: num(est.total_low, fb.total_low), total_high: num(est.total_high, fb.total_high),
      items,
      assumptions: Array.isArray(est.assumptions) && est.assumptions.length ? est.assumptions.map(String) : fb.assumptions,
      summary: String(est.summary || fb.summary),
      buildArea: fb.buildArea, source: est.__source || 'ai',
    };
  }

  async function viaClaude(d, opts) {
    const complete = claudeFn(); if (!complete) throw new Error('no-claude');
    const p = payloadOf(d, opts);
    const buildArea = Math.round(d.w * d.l * (p.storeys === 2 ? 1.7 : 1));
    const prompt =
      'Anda Quantity Surveyor profesional Indonesia. Susun estimasi RAB bangunan baru. ' +
      'Gunakan harga satuan wajar pasar Indonesia terkini (Rupiah), perhitungkan kota, kualitas finishing, jumlah lantai, dan fitur. Beri RENTANG realistis. ' +
      'Balas HANYA JSON valid skema: {"per_m2_low":number,"per_m2_high":number,"total_low":number,"total_high":number,' +
      '"items":[{"name":string,"amount":number,"pct":number,"note":string}],"assumptions":[string],"summary":string}. ' +
      'items minimal: Pekerjaan Persiapan, Struktur & Pondasi, Dinding & Plester, Atap, Lantai & Keramik, Pintu & Jendela, Finishing & Cat, MEP. amount Rupiah angka murni.\n\n' +
      `Data:\nJenis: ${p.jenis}\nTanah: ${d.w}x${d.l} m\nLantai: ${p.storeys}\nLuas bangunan \u2248 ${buildArea} m²\n` +
      `Kamar: ${p.beds}\nGaya: ${p.style}\nKualitas: ${p.quality}\nKota: ${p.city}\nFitur: ${p.needs.join(', ') || '-'}`;
    const txt = await complete({ messages: [{ role: 'user', content: prompt }], max_tokens: 1600 });
    let obj = parseJSON(txt);
    if (!obj) throw new Error('parse');
    obj.__source = 'ai';
    return normalize(obj, d, opts);
  }

  // robust JSON extraction — handles ```json fences & surrounding prose
  function parseJSON(txt) {
    if (!txt) return null;
    var s = String(txt).trim();
    // strip code fences
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    try { return JSON.parse(s); } catch (e) {}
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch (e) {} }
    return null;
  }

  // main — returns normalized estimate; never throws for "quota/login": falls back to formula but flags .note
  async function estimate(d, opts) {
    const C = cloud();
    // 1) production edge function
    if (C && C.isLoggedIn && C.isLoggedIn() && C.invokeAICost) {
      try {
        const res = await C.invokeAICost(payloadOf(d, opts));
        if (res && res.estimate) { res.estimate.__source = 'ai'; return normalize(res.estimate, d, opts); }
      } catch (err) {
        const bcode = err && err.body && err.body.code;
        if (err && (err.status === 503 || bcode === 'PROVIDER_QUOTA')) {
          const fb = localEstimate(d, opts); fb.note = 'provider'; return fb;
        }
        // login/other → try claude then formula
      }
    }
    // 2) preview: window.claude
    try { return await viaClaude(d, opts); } catch (e) {}
    // 3) offline formula
    const fb = localEstimate(d, opts); fb.note = 'formula'; return fb;
  }

  window.AICost = { estimate, _local: localEstimate };
})();
