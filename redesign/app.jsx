/* global React, ReactDOM, Icon, Btn, rp, rpShort, AIRender, FloorPlan, Iso3D, STYLES, STYLE_LIST, styleGradient */
const { useState, useEffect, useRef } = React;

const PRICE_M2 = 3200000;
const JENIS = [
  { k: 'Rumah Tinggal', d: 'Hunian keluarga', i: 'home' },
  { k: 'Kost / Kontrakan', d: 'Banyak kamar sewa', i: 'bed' },
  { k: 'Ruko', d: 'Toko + tempat tinggal', i: 'grid' },
  { k: 'Villa', d: 'Rumah istirahat', i: 'tree' },
];
const SIZES = [
  { w: 6, l: 10, n: '6 × 10' }, { w: 6, l: 12, n: '6 × 12' },
  { w: 8, l: 15, n: '8 × 15' }, { w: 10, l: 15, n: '10 × 15' },
];
const NEEDS = [
  { k: 'carport', label: 'Carport', i: 'car' },
  { k: 'taman', label: 'Taman', i: 'tree' },
  { k: '2lantai', label: '2 Lantai', i: 'layers' },
  { k: 'pagar', label: 'Pagar', i: 'fence' },
  { k: 'musholla', label: 'Musholla', i: 'pray' },
  { k: 'kolam', label: 'Kolam', i: 'pool' },
];
const HELPERS = ['Lebih modern', 'Tambah pagar', 'Cat lebih putih', 'Tambah taman depan', 'Tambah carport', 'Suasana sore', 'Atap lebih landai', 'Tambah jendela besar'];

function area(d) { return d.w * d.l * (d.needs.has('2lantai') ? 1.7 : 1); }
function estCost(d) { return area(d) * PRICE_M2; }

/* ============================ HOME ============================ */
function Home({ go }) {
  return (
    <div className="screen">
      <div className="wrap">
        <section className="hero">
          <div className="fade-in">
            <span className="tag"><span className="dot"></span>AI Desain Rumah · Buatan Indonesia</span>
            <h1>Wujudkan <span className="hl">rumah impianmu</span> dalam 3 menit.</h1>
            <p className="lead">Masukkan ukuran tanah, budget, dan gaya — DadiOmah otomatis membuat <b>denah</b>, <b>visual 3D</b>, dan <b>render AI realistis</b> lengkap dengan estimasi biaya (RAB). Tanpa software berat, tanpa tutorial.</p>
            <div className="hero-cta">
              <Btn size="lg" icon="wand" onClick={() => go('wizard')}>Buat Rumah Sekarang</Btn>
              <Btn size="lg" variant="ghost" icon="scan" onClick={() => go('wizard')}>Scan Foto Denah</Btn>
            </div>
            <div className="steps3">
              <div className="step-chip"><span className="n" style={{ background: 'var(--brand)' }}>1</span>Denah</div>
              <span className="arrow-sep">→</span>
              <div className="step-chip"><span className="n" style={{ background: 'var(--sky)' }}>2</span>3D</div>
              <span className="arrow-sep">→</span>
              <div className="step-chip"><span className="n" style={{ background: 'var(--violet)' }}>3</span>Render AI</div>
            </div>
          </div>
          <div className="hero-visual fade-in">
            <div className="float-card" style={{ width: '64%', height: '74%', right: 0, top: '4%' }}>
              <AIRender style="Tropical" features={new Set(['taman', 'carport'])} />
            </div>
            <div className="float-card" style={{ width: '46%', height: '50%', left: 0, bottom: 0 }}>
              <Iso3D style="Minimalis Modern" compact />
            </div>
            <div className="float-card" style={{ width: '34%', height: '40%', left: '2%', top: 0 }}>
              <FloorPlan width={8} length={10} compact />
            </div>
            <div className="float-badge" style={{ right: '6%', bottom: '8%', color: 'var(--mint-ink)' }}>
              <Icon name="bolt" size={15} /> Render AI · 48 dtk
            </div>
          </div>
        </section>

        <section className="section">
          <span className="eyebrow">Dua cara memulai</span>
          <h2>Mau cepat, atau atur sendiri?</h2>
          <div className="modes">
            <div className="mode featured" onClick={() => go('wizard')}>
              <div className="ribbon">TERCEPAT</div>
              <div className="ico" style={{ background: 'var(--brand-soft)', color: 'var(--brand-strong)' }}><Icon name="bolt" /></div>
              <h3>AI Quick Mode</h3>
              <p>Cukup ukuran tanah, budget &amp; gaya. AI membuat denah, 3D, dan render — kurang dari 60 detik.</p>
              <div className="go" style={{ color: 'var(--brand-strong)' }}>Mulai cepat <Icon name="arrowR" size={16} /></div>
            </div>
            <div className="mode" onClick={() => go('wizard')}>
              <div className="ico" style={{ background: 'var(--sky-soft)', color: 'var(--sky)' }}><Icon name="ruler" /></div>
              <h3>Wizard 5 Langkah</h3>
              <p>Dipandu langkah demi langkah: jenis bangunan, ukuran, budget, gaya, dan kebutuhan tambahan.</p>
              <div className="go" style={{ color: 'var(--sky)' }}>Mulai dipandu <Icon name="arrowR" size={16} /></div>
            </div>
          </div>
        </section>

        <section className="section">
          <span className="eyebrow">Galeri inspirasi</span>
          <h2>Rumah populer siap pakai</h2>
          <div className="gallery">
            {[['Rumah 6×10', 'Minimalis Modern'], ['Rumah 6×12', 'Scandinavian'], ['Rumah 8×15', 'Tropical'], ['Rumah 10×15', 'Japandi']].map(([n, st], i) => (
              <div className="gcard" key={i} onClick={() => go('wizard')}>
                <div style={{ height: 130, position: 'relative' }}><AIRender style={st} features={new Set(['taman'])} /></div>
                <div className="meta"><b>{n}</b><span>{STYLES[st].label}</span></div>
              </div>
            ))}
          </div>
        </section>
        <div style={{ height: 40 }}></div>
      </div>
    </div>
  );
}

/* ============================ WIZARD ============================ */
function Wizard({ design, setDesign, go }) {
  const [step, setStep] = useState(0);
  const total = 5;
  const d = design;
  const set = (patch) => setDesign({ ...d, ...patch });
  const toggleNeed = (k) => { const n = new Set(d.needs); n.has(k) ? n.delete(k) : n.add(k); set({ needs: n }); };
  const canNext = [!!d.jenis, d.w > 0, d.budget > 0, !!d.gaya, true][step];
  const next = () => step < total - 1 ? setStep(step + 1) : go('generating');
  const labels = ['Jenis Bangunan', 'Ukuran Tanah', 'Budget', 'Gaya Rumah', 'Kebutuhan Tambahan'];

  return (
    <div className="screen"><div className="wizard">
      <div className="wiz-main">
        <div className="progress-head">
          <Btn variant="ghost" size="sm" icon="arrowL" onClick={() => step ? setStep(step - 1) : go('home')}>Kembali</Btn>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${(step + 1) / total * 100}%` }}></div></div>
          <span className="step-label">Langkah {step + 1} dari {total}</span>
        </div>

        <div className="wiz-q fade-in" key={step}>
          <span className="eyebrow">{labels[step]}</span>

          {step === 0 && <React.Fragment>
            <h2>Mau bangun apa?</h2>
            <p className="sub">Pilih jenis bangunan yang ingin kamu desain.</p>
            <div className="opt-grid c2">
              {JENIS.map(j => (
                <div key={j.k} className={'opt' + (d.jenis === j.k ? ' sel' : '')} onClick={() => set({ jenis: j.k })}>
                  <div className="check"><Icon name="check" size={14} /></div>
                  <div className="opt-ico"><Icon name={j.i} /></div>
                  <b>{j.k}</b><small>{j.d}</small>
                </div>
              ))}
            </div>
          </React.Fragment>}

          {step === 1 && <React.Fragment>
            <h2>Berapa ukuran tanahnya?</h2>
            <p className="sub">Pilih ukuran umum atau atur sendiri.</p>
            <div className="size-presets">
              {SIZES.map(s => (
                <div key={s.n} className={'size-chip' + (d.w === s.w && d.l === s.l ? ' sel' : '')} onClick={() => set({ w: s.w, l: s.l })}>
                  {s.n}<small>meter</small>
                </div>
              ))}
            </div>
            <div className="slider-row">
              <label>Lebar <span className="val">{d.w} m</span></label>
              <input type="range" min="4" max="20" step="1" value={d.w} onChange={e => set({ w: +e.target.value })} />
            </div>
            <div className="slider-row">
              <label>Panjang <span className="val">{d.l} m</span></label>
              <input type="range" min="6" max="25" step="1" value={d.l} onChange={e => set({ l: +e.target.value })} />
            </div>
            <div className="pill" style={{ marginTop: 8 }}><Icon name="ruler" size={15} /> Luas tanah ≈ <b>{d.w * d.l} m²</b></div>
          </React.Fragment>}

          {step === 2 && <React.Fragment>
            <h2>Berapa budget kamu?</h2>
            <p className="sub">Geser sesuai dana yang tersedia. AI menyesuaikan material &amp; luas bangunan.</p>
            <div className="slider-row">
              <label>Budget <span className="val">{rpShort(d.budget)}</span></label>
              <input type="range" min="100000000" max="2000000000" step="25000000" value={d.budget} onChange={e => set({ budget: +e.target.value })} />
            </div>
            <BudgetFeas d={d} />
          </React.Fragment>}

          {step === 3 && <React.Fragment>
            <h2>Pilih gaya rumahmu</h2>
            <p className="sub">Gaya menentukan material, warna, dan suasana render AI.</p>
            <div className="gaya-grid">
              {STYLE_LIST.map(st => (
                <div key={st} className={'gaya' + (d.gaya === st ? ' sel' : '')} onClick={() => set({ gaya: st })}>
                  <div className="swatch" style={{ background: styleGradient(st) }}></div>
                  <div className="lbl">{STYLES[st].label}<small>{STYLES[st].desc}</small></div>
                </div>
              ))}
            </div>
          </React.Fragment>}

          {step === 4 && <React.Fragment>
            <h2>Ada kebutuhan tambahan?</h2>
            <p className="sub">Opsional — pilih yang kamu mau. Bisa diubah nanti.</p>
            <div className="needs">
              {NEEDS.map(n => (
                <div key={n.k} className={'need' + (d.needs.has(n.k) ? ' sel' : '')} onClick={() => toggleNeed(n.k)}>
                  <Icon name={n.i} size={17} /> {n.label}
                  <span className="nk">{d.needs.has(n.k) ? '✓' : '+'}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 28 }}>
              <label style={{ fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 12 }}>Jumlah kamar tidur</label>
              <div className="stepper">
                <button onClick={() => set({ beds: Math.max(1, d.beds - 1) })}>−</button>
                <span className="sv">{d.beds}</span>
                <button onClick={() => set({ beds: Math.min(6, d.beds + 1) })}>+</button>
              </div>
            </div>
          </React.Fragment>}
        </div>

        <div className="wiz-nav">
          <span className="muted" style={{ fontSize: 13.5, fontWeight: 600 }}>Kamu bisa ubah semuanya nanti</span>
          <Btn size="lg" iconR={step === total - 1 ? 'wand' : 'arrowR'} disabled={!canNext} onClick={next}>
            {step === total - 1 ? 'Generate dengan AI' : 'Lanjut'}
          </Btn>
        </div>
      </div>

      <aside className="wiz-aside">
        <div className="sum-title">Ringkasan Desain</div>
        <SumRow k="Jenis" v={d.jenis} />
        <SumRow k="Ukuran tanah" v={d.w ? `${d.w} × ${d.l} m · ${d.w * d.l} m²` : ''} />
        <SumRow k="Budget" v={d.budget ? rpShort(d.budget) : ''} />
        <SumRow k="Gaya" v={d.gaya} />
        <SumRow k="Kamar tidur" v={`${d.beds} kamar`} />
        <SumRow k="Tambahan" v={d.needs.size ? [...d.needs].map(k => NEEDS.find(n => n.k === k)?.label).join(', ') : ''} />
        <div className="sum-est">
          <div className="lab">Estimasi luas bangunan</div>
          <div className="big">{Math.round(area(d))} m²</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--mint-ink)', marginTop: 6 }}>≈ {rp(estCost(d))} (RAB awal)</div>
        </div>
      </aside>
    </div></div>
  );
}
function SumRow({ k, v }) {
  return <div className="sum-row"><span className="k">{k}</span><span className={'v' + (v ? '' : ' empty')}>{v || 'belum dipilih'}</span></div>;
}
function BudgetFeas({ d }) {
  const cost = estCost(d), ok = d.budget >= cost;
  const pct = Math.min(100, cost / d.budget * 100);
  return (
    <div className="card" style={{ padding: 20, marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="b-stat"><div className="lab">Estimasi biaya</div><div className="num brand">{rp(cost)}</div></div>
        <div className="b-stat" style={{ textAlign: 'right' }}><div className="lab">Luas bangunan</div><div className="num">{Math.round(area(d))} m²</div></div>
      </div>
      <div className="budget-bar"><i style={{ width: pct + '%', background: ok ? 'linear-gradient(90deg,var(--mint),#3fbf8f)' : 'linear-gradient(90deg,#e8a13a,#e2570a)' }}></i></div>
      <div className="budget-tag" style={{ background: ok ? 'var(--mint-soft)' : '#fdeede', color: ok ? 'var(--mint-ink)' : 'var(--brand-ink)' }}>
        <Icon name={ok ? 'check' : 'bolt'} size={15} /> {ok ? 'Sesuai budget' : 'Budget pas — AI akan optimalkan material'}
      </div>
    </div>
  );
}

/* ============================ GENERATING ============================ */
function Generating({ design, go }) {
  const [stage, setStage] = useState(0); // 0 denah,1 3d,2 render,3 done
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(x => x + 1), 100);
    const a = setTimeout(() => setStage(1), 2200);
    const b = setTimeout(() => setStage(2), 4600);
    const c = setTimeout(() => setStage(3), 7200);
    const dn = setTimeout(() => go('result'), 8400);
    return () => { clearInterval(id); [a, b, c, dn].forEach(clearTimeout); };
  }, []);
  const steps = [['Membuat denah', 'grid'], ['Membangun model 3D', 'cube'], ['Render AI realistis', 'wand']];
  return (
    <div className="gen"><div className="gen-card fade-in">
      <div className="gen-stage-visual">
        {stage === 0 && <FloorPlan width={design.w} length={design.l} rooms={{ beds: design.beds }} />}
        {stage === 1 && <Iso3D style={design.gaya} features={design.needs} />}
        {stage >= 2 && <AIRender style={design.gaya} features={design.needs} />}
        {stage < 3 && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,.45) 50%, transparent 70%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite' }}></div>}
      </div>
      <h2>{stage < 3 ? 'AI sedang mendesain rumahmu…' : 'Selesai! 🎉'}</h2>
      <p className="muted">Estimasi <span className="timer">~60 detik</span> · sudah berjalan {(t / 10).toFixed(1)} dtk</p>
      <div className="gen-pipe">
        {steps.map(([lab, ico], i) => (
          <div key={i} className={'pipe-step' + (stage === i ? ' active' : stage > i ? ' done' : '')}>
            <div className="pipe-ico">{stage > i ? <Icon name="check" size={16} /> : stage === i ? <Icon name="refresh" size={15} className="spin" /> : <Icon name={ico} size={15} />}</div>
            {lab}
          </div>
        ))}
      </div>
    </div></div>
  );
}

/* ============================ RESULT ============================ */
function Result({ design, setDesign, go, toast }) {
  const d = design;
  const cost = estCost(d), ok = d.budget >= cost;
  return (
    <div className="screen"><div className="wrap">
      <div className="result-head fade-in">
        <div>
          <span className="eyebrow">Desain selesai</span>
          <h1>{d.jenis} {d.w}×{d.l} · {STYLES[d.gaya].label}</h1>
          <span className="muted" style={{ fontWeight: 600 }}>{Math.round(area(d))} m² bangunan · {d.beds} kamar · {STYLES[d.gaya].desc}</span>
        </div>
        <div className="result-actions">
          <Btn variant="ghost" size="sm" icon="refresh" onClick={() => go('wizard')}>Ubah input</Btn>
          <Btn variant="violet" size="sm" icon="wand" onClick={() => go('studio')}>Sempurnakan dengan AI</Btn>
        </div>
      </div>

      <div className="pipeline fade-in">
        <Stage title="Denah 2D" ico="grid" badge="Otomatis" badgeBg="var(--sky-soft)" badgeC="var(--sky)">
          <FloorPlan width={d.w} length={d.l} rooms={{ beds: d.beds }} compact />
        </Stage>
        <Stage title="Model 3D" ico="cube" badge="Semi-real" badgeBg="var(--mint-soft)" badgeC="var(--mint-ink)">
          <Iso3D style={d.gaya} features={d.needs} compact />
        </Stage>
        <Stage title="Render AI" ico="wand" badge="HERO" badgeBg="var(--violet-soft)" badgeC="var(--violet-ink)" hero>
          <AIRender style={d.gaya} features={d.needs} />
          <button onClick={() => go('studio')} style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 5 }} className="btn btn-dark btn-sm"><Icon name="zoom" size={15} /> Buka Studio</button>
        </Stage>
      </div>

      <div className="result-grid fade-in">
        <div className="card budget-card">
          <div className="b-top">
            <div className="b-stat"><div className="lab">Budget kamu</div><div className="num">{rp(d.budget)}</div></div>
            <div className="b-stat" style={{ textAlign: 'right' }}><div className="lab">Estimasi RAB</div><div className="num brand">{rp(cost)}</div></div>
          </div>
          <div className="budget-bar"><i style={{ width: Math.min(100, cost / d.budget * 100) + '%' }}></i></div>
          <div className="budget-tag"><Icon name="check" size={15} /> {ok ? 'Sesuai budget' : 'Sedikit di atas budget'} · sisa {rpShort(Math.abs(d.budget - cost))}</div>
          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span className="pill"><Icon name="doc" size={14} /> RAB lengkap</span>
            <span className="pill"><Icon name="layers" size={14} /> Material take-off</span>
            <span className="pill"><Icon name="download" size={14} /> Export PDF</span>
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="sum-title">Coba gaya lain — render ulang instan</div>
          <div className="style-switch">
            {STYLE_LIST.map(st => (
              <div key={st} className={'ss' + (d.gaya === st ? ' sel' : '')} onClick={() => { setDesign({ ...d, gaya: st }); toast('Render diperbarui · ' + STYLES[st].label); }}>
                <div className="sw" style={{ background: styleGradient(st) }}></div><span>{STYLES[st].label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }} className="sum-title">Bagikan hasil</div>
          <div className="share-grid">
            <div className="share-btn" onClick={() => toast('Membuka bagikan ke Facebook…')}><div className="share-ico" style={{ background: '#1877F2' }}><Icon name="fb" size={16} /></div>Facebook</div>
            <div className="share-btn" onClick={() => toast('Mengunduh untuk Instagram…')}><div className="share-ico" style={{ background: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)' }}><Icon name="ig" size={16} /></div>Instagram</div>
            <div className="share-btn" onClick={() => toast('Menyiapkan Story 9:16…')}><div className="share-ico" style={{ background: 'var(--ink)' }}><Icon name="story" size={16} /></div>Story</div>
            <div className="share-btn" onClick={() => toast('Membuat gambar Before / After…')}><div className="share-ico" style={{ background: 'var(--violet)' }}><Icon name="image" size={16} /></div>Before/After</div>
          </div>
        </div>
      </div>
      <div style={{ height: 30 }}></div>
    </div></div>
  );
}
function Stage({ title, ico, badge, badgeBg, badgeC, hero, children }) {
  return (
    <div className={'stage' + (hero ? ' hero-stage' : '')}>
      <div className="stage-top"><b><Icon name={ico} size={17} /> {title}</b><span className="stage-badge" style={{ background: badgeBg, color: badgeC }}>{badge}</span></div>
      <div className="canvas">{children}</div>
    </div>
  );
}

/* ============================ STUDIO ============================ */
function Studio({ design, setDesign, go, toast }) {
  const d = design;
  const [added, setAdded] = useState([]);
  const [regen, setRegen] = useState(false);
  const [variant, setVariant] = useState(0);
  const [night, setNight] = useState(false);
  const [view, setView] = useState('after');
  const featureMap = { 'Tambah pagar': 'pagar', 'Tambah taman depan': 'taman', 'Tambah carport': 'carport' };

  const doRegen = (msg) => { setRegen(true); setTimeout(() => { setRegen(false); toast(msg || 'Render diperbarui'); }, 1100); };
  const applyHelper = (h) => {
    const f = featureMap[h];
    if (f) { const n = new Set(d.needs); n.add(f); setDesign({ ...d, needs: n }); }
    if (h === 'Suasana sore') setNight(false);
    setAdded(a => a.includes(h) ? a : [...a, h]);
    doRegen('AI: "' + h + '" diterapkan');
  };

  return (
    <div className="screen"><div className="studio">
      <div className="studio-rail">
        <div className="rail-h">Gaya / Style preset</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {STYLE_LIST.map(st => (
            <div key={st} className={'gaya' + (d.gaya === st ? ' sel' : '')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}
              onClick={() => { setDesign({ ...d, gaya: st }); doRegen('Gaya: ' + STYLES[st].label); }}>
              <div className="sw" style={{ width: 54, height: 40, borderRadius: 8, flex: '0 0 auto', background: styleGradient(st) }}></div>
              <div><b style={{ fontSize: 14 }}>{STYLES[st].label}</b><div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>{STYLES[st].desc}</div></div>
            </div>
          ))}
        </div>
        <div className="rail-h" style={{ marginTop: 22 }}>Pencahayaan</div>
        <div className="seg" style={{ width: '100%' }}>
          <button className={!night ? 'on' : ''} style={{ flex: 1 }} onClick={() => { setNight(false); doRegen('Siang hari'); }}>Siang</button>
          <button className={night ? 'on' : ''} style={{ flex: 1 }} onClick={() => { setNight(true); doRegen('Sore / malam'); }}>Sore</button>
        </div>
      </div>

      <div className="studio-canvas-wrap">
        <div className="studio-toolbar">
          <Btn variant="ghost" size="sm" icon="arrowL" onClick={() => go('result')}>Hasil</Btn>
          <div className="seg">
            <button className={view === 'after' ? 'on' : ''} onClick={() => setView('after')}>Render AI</button>
            <button className={view === 'ba' ? 'on' : ''} onClick={() => setView('ba')}>Before / After</button>
          </div>
          <div style={{ flex: 1 }}></div>
          <Btn variant="dark" size="sm" icon="refresh" onClick={() => doRegen('Render baru dibuat')}>Regenerate</Btn>
          <Btn size="sm" icon="download" onClick={() => toast('Mengunduh render HD…')}>Download</Btn>
        </div>

        <div className="studio-canvas">
          {regen && <div className="regen-overlay"><div className="box"><Icon name="refresh" size={20} className="spin" /> AI me-render…</div></div>}
          {view === 'after'
            ? <AIRender style={d.gaya} features={d.needs} night={night} />
            : <div className="ba">
                <div className="after"><AIRender style={d.gaya} features={d.needs} night={night} /></div>
                <div className="before"><Iso3D style={d.gaya} features={d.needs} /></div>
                <div className="handle"></div><div className="knob"><Icon name="arrowL" size={13} /><Icon name="arrowR" size={13} /></div>
                <div className="ba-tag" style={{ left: 14 }}>3D</div><div className="ba-tag" style={{ right: 14 }}>RENDER AI</div>
              </div>}
        </div>

        <div>
          <div className="rail-h" style={{ marginBottom: 10 }}>Variasi</div>
          <div className="varrow">
            {STYLE_LIST.slice(0, 4).map((st, i) => (
              <div key={i} className={'varthumb' + (variant === i ? ' sel' : '')} onClick={() => { setVariant(i); setDesign({ ...d, gaya: st }); doRegen('Variasi ' + (i + 1)); }}>
                <AIRender style={st} features={d.needs} night={night} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="studio-panel">
        <div className="rail-h">Prompt Helper</div>
        <div className="prompt-box">
          <Icon name="wand" size={17} style={{ color: 'var(--violet)' }} />
          <input placeholder="Tulis perubahan… mis. cat hijau muda" onKeyDown={e => { if (e.key === 'Enter' && e.target.value) { applyHelper(e.target.value); e.target.value = ''; } }} />
          <button className="btn btn-violet btn-sm" onClick={() => doRegen('Perubahan diterapkan')}><Icon name="arrowR" size={15} /></button>
        </div>
        <p className="muted" style={{ fontSize: 12.5, margin: '12px 0 0', fontWeight: 600 }}>Atau klik saran — tanpa perlu mengetik:</p>
        <div className="helper-grid">
          {HELPERS.map(h => (
            <div key={h} className={'helper' + (added.includes(h) ? ' added' : '')} onClick={() => applyHelper(h)}>
              {added.includes(h) ? <Icon name="check" size={14} /> : <Icon name="plus" size={14} />}{h}
            </div>
          ))}
        </div>

        <div className="rail-h" style={{ marginTop: 24 }}>Bagikan</div>
        <div className="share-grid">
          <div className="share-btn" onClick={() => toast('Bagikan ke Facebook…')}><div className="share-ico" style={{ background: '#1877F2' }}><Icon name="fb" size={16} /></div>Facebook</div>
          <div className="share-btn" onClick={() => toast('Unduh untuk Instagram…')}><div className="share-ico" style={{ background: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)' }}><Icon name="ig" size={16} /></div>Instagram</div>
          <div className="share-btn" onClick={() => toast('Story 9:16…')}><div className="share-ico" style={{ background: 'var(--ink)' }}><Icon name="story" size={16} /></div>Story</div>
          <div className="share-btn" onClick={() => toast('Before / After…')}><div className="share-ico" style={{ background: 'var(--violet)' }}><Icon name="image" size={16} /></div>Before/After</div>
        </div>
      </div>
    </div></div>
  );
}

/* ============================ APP SHELL ============================ */
function App() {
  const [screen, setScreen] = useState('home');
  const [toastMsg, setToastMsg] = useState(null);
  const [design, setDesign] = useState({ jenis: 'Rumah Tinggal', w: 8, l: 12, budget: 500000000, gaya: 'Minimalis Modern', needs: new Set(['carport', 'taman']), beds: 2 });
  const toast = (m) => { setToastMsg(m); clearTimeout(window.__t); window.__t = setTimeout(() => setToastMsg(null), 2400); };
  const go = (s) => { setScreen(s); document.querySelector('.screen, .gen')?.scrollTo?.(0, 0); window.scrollTo(0, 0); };
  const navOn = (s) => screen === s ? 'active' : '';

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => go('home')}>
          <div className="logo"><Icon name="home" size={18} /></div><b>Dadi</b><span>Omah</span>
        </div>
        <nav className="topnav">
          <a className={navOn('home')} onClick={() => go('home')}>Beranda</a>
          <a className={navOn('wizard')} onClick={() => go('wizard')}>Buat Rumah</a>
          <a className={(screen === 'result' || screen === 'studio') ? 'active' : ''} onClick={() => go('result')}>Hasil &amp; Render</a>
          <a onClick={() => toast('Galeri — segera hadir di prototype')}>Galeri</a>
        </nav>
        <div className="spacer"></div>
        <div className="credits"><Icon name="bolt" size={14} /> 12 render tersisa</div>
        <div className="avatar">B</div>
      </header>

      {screen === 'home' && <Home go={go} />}
      {screen === 'wizard' && <Wizard design={design} setDesign={setDesign} go={go} />}
      {screen === 'generating' && <Generating design={design} go={go} />}
      {screen === 'result' && <Result design={design} setDesign={setDesign} go={go} toast={toast} />}
      {screen === 'studio' && <Studio design={design} setDesign={setDesign} go={go} toast={toast} />}

      {toastMsg && <div className="toast pop-in"><Icon name="check" size={16} style={{ color: 'var(--mint)' }} /> {toastMsg}</div>}
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
