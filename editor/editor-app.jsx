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
const HELPERS = ['Rumah lebih modern', 'Tambah pagar', 'Cat lebih putih', 'Tambah taman depan', 'Tambah carport', 'Suasana sore', 'Tambah jendela besar'];
const FEATURE_MAP = { 'Tambah pagar': 'pagar', 'Tambah taman depan': 'taman', 'Tambah carport': 'carport' };

const area = (d) => d.w * d.l * (d.needs.has('2lantai') ? 1.7 : 1);
const estCost = (d) => area(d) * PRICE_M2;

function closeEditor() {
  try { if (window.parent && window.parent !== window && window.parent.closeQuickStudio) { window.parent.closeQuickStudio(); return; } } catch (e) {}
  try { window.parent.postMessage('close-quick-studio', '*'); } catch (e) {}
}

/* ============================ WELCOME WIZARD ============================ */
function Welcome({ design, setDesign, onDone, onClose }) {
  const [step, setStep] = useState(0);
  const total = 5;
  const d = design;
  const set = (p) => setDesign({ ...d, ...p });
  const toggleNeed = (k) => { const n = new Set(d.needs); n.has(k) ? n.delete(k) : n.add(k); set({ needs: n }); };
  const canNext = [!!d.jenis, d.w > 0, d.budget > 0, !!d.gaya, true][step];
  const labels = ['Jenis Bangunan', 'Ukuran Tanah', 'Budget', 'Gaya Rumah', 'Kebutuhan'];
  const next = () => step < total - 1 ? setStep(step + 1) : onDone();
  const cost = estCost(d), ok = d.budget >= cost;

  return (
    <div className="welcome">
      <div className="welcome-card pop-in">
        <div className="welcome-head">
          <div>
            <span className="eyebrow">Studio Cepat · Langkah {step + 1} dari {total}</span>
            <h2 style={{ margin: '6px 0 0', fontSize: 26, letterSpacing: '-.02em' }}>{labels[step]}</h2>
          </div>
          <button className="ed-close" onClick={onClose}><Icon name="plus" size={20} style={{ transform: 'rotate(45deg)' }} /></button>
        </div>
        <div className="wel-progress">
          <div className="progress-track"><div className="progress-fill" style={{ width: `${(step + 1) / total * 100}%` }}></div></div>
        </div>

        <div className="fade-in" key={step}>
          {step === 0 && (
            <div className="opt-grid c2">
              {JENIS.map(j => (
                <div key={j.k} className={'opt' + (d.jenis === j.k ? ' sel' : '')} onClick={() => set({ jenis: j.k })}>
                  <div className="check"><Icon name="check" size={14} /></div>
                  <div className="opt-ico"><Icon name={j.i} /></div>
                  <b>{j.k}</b><small>{j.d}</small>
                </div>
              ))}
            </div>
          )}
          {step === 1 && <React.Fragment>
            <div className="size-presets">
              {SIZES.map(s => (
                <div key={s.n} className={'size-chip' + (d.w === s.w && d.l === s.l ? ' sel' : '')} onClick={() => set({ w: s.w, l: s.l })}>{s.n}<small>meter</small></div>
              ))}
            </div>
            <div className="slider-row"><label>Lebar <span className="val">{d.w} m</span></label>
              <input type="range" min="4" max="20" value={d.w} onChange={e => set({ w: +e.target.value })} /></div>
            <div className="slider-row"><label>Panjang <span className="val">{d.l} m</span></label>
              <input type="range" min="6" max="25" value={d.l} onChange={e => set({ l: +e.target.value })} /></div>
            <div className="pill" style={{ marginTop: 6 }}><Icon name="ruler" size={15} /> Luas ≈ <b>{d.w * d.l} m²</b></div>
          </React.Fragment>}
          {step === 2 && <React.Fragment>
            <div className="slider-row"><label>Budget <span className="val">{rpShort(d.budget)}</span></label>
              <input type="range" min="100000000" max="2000000000" step="25000000" value={d.budget} onChange={e => set({ budget: +e.target.value })} /></div>
            <div className="budget-tag" style={{ background: ok ? 'var(--mint-soft)' : '#fdeede', color: ok ? 'var(--mint-ink)' : 'var(--brand-ink)' }}>
              <Icon name={ok ? 'check' : 'bolt'} size={15} /> Est. RAB {rp(cost)} · {ok ? 'sesuai budget' : 'AI optimalkan material'}</div>
          </React.Fragment>}
          {step === 3 && (
            <div className="gaya-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
              {STYLE_LIST.map(st => (
                <div key={st} className={'gaya' + (d.gaya === st ? ' sel' : '')} onClick={() => set({ gaya: st })}>
                  <div className="swatch" style={{ height: 76, background: styleGradient(st) }}></div>
                  <div className="lbl">{STYLES[st].label}<small>{STYLES[st].desc}</small></div>
                </div>
              ))}
            </div>
          )}
          {step === 4 && <React.Fragment>
            <div className="needs">
              {NEEDS.map(n => (
                <div key={n.k} className={'need' + (d.needs.has(n.k) ? ' sel' : '')} onClick={() => toggleNeed(n.k)}>
                  <Icon name={n.i} size={17} /> {n.label}<span className="nk">{d.needs.has(n.k) ? '✓' : '+'}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
              <label style={{ fontWeight: 700, fontSize: 14 }}>Kamar tidur</label>
              <div className="stepper">
                <button onClick={() => set({ beds: Math.max(1, d.beds - 1) })}>−</button>
                <span className="sv">{d.beds}</span>
                <button onClick={() => set({ beds: Math.min(6, d.beds + 1) })}>+</button>
              </div>
            </div>
          </React.Fragment>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
          <Btn variant="ghost" size="sm" icon="arrowL" onClick={() => step ? setStep(step - 1) : onClose()}>{step ? 'Kembali' : 'Batal'}</Btn>
          <Btn size="lg" iconR={step === total - 1 ? 'wand' : 'arrowR'} disabled={!canNext} onClick={next}>
            {step === total - 1 ? 'Generate dengan AI' : 'Lanjut'}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ============================ PROGRESS AI ============================ */
function Progress({ design, onDone }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const a = setTimeout(() => setStage(1), 1700);
    const b = setTimeout(() => setStage(2), 3500);
    const c = setTimeout(() => setStage(3), 5400);
    const dn = setTimeout(onDone, 6400);
    return () => [a, b, c, dn].forEach(clearTimeout);
  }, []);
  const steps = [['Membuat denah…', 'grid'], ['Membangun 3D…', 'cube'], ['Render AI realistis…', 'wand']];
  return (
    <div className="prog-overlay">
      <div className="gen-card fade-in" style={{ width: 'min(720px,100%)', textAlign: 'center' }}>
        <div className="gen-stage-visual" style={{ height: 280 }}>
          {stage === 0 && <FloorPlan width={design.w} length={design.l} rooms={{ beds: design.beds }} />}
          {stage === 1 && <Iso3D style={design.gaya} features={design.needs} />}
          {stage >= 2 && <AIRender style={design.gaya} features={design.needs} />}
          {stage < 3 && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite' }}></div>}
        </div>
        <h2 style={{ fontSize: 26, margin: '22px 0 4px', letterSpacing: '-.02em' }}>{stage < 3 ? 'AI sedang mendesain rumahmu…' : 'Selesai! 🎉'}</h2>
        <p className="muted" style={{ fontWeight: 600 }}>Target kurang dari 60 detik</p>
        <div className="gen-pipe">
          {steps.map(([lab, ico], i) => (
            <div key={i} className={'pipe-step' + (stage === i ? ' active' : stage > i ? ' done' : '')}>
              <div className="pipe-ico">{stage > i ? <Icon name="check" size={16} /> : stage === i ? <Icon name="refresh" size={15} className="spin" /> : <Icon name={ico} size={15} />}</div>{lab}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================ EDITOR ============================ */
const RAIL = [
  { g: 'Desain' },
  { k: 'buat', label: 'Buat', i: 'plus' },
  { k: 'dinding', label: 'Dinding', i: 'ruler' },
  { k: 'ruang', label: 'Ruang', i: 'grid' },
  { g: 'AI' },
  { k: 'ai', label: 'AI', i: 'wand', ai: true },
  { k: 'render', label: 'Render', i: 'camera', ai: true },
  { k: 'style', label: 'Style', i: 'palette' },
  { g: 'Biaya' },
  { k: 'cost', label: 'Cost', i: 'wallet' },
  { k: 'file', label: 'File', i: 'doc' },
];

function GenCTA({ kind, busy, demo, upsell, onGen, onUpgrade }) {
  const msg = upsell
    ? 'Render AI khusus paket Pro & Developer — upgrade untuk membuat render foto realistis'
    : demo ? 'Mode contoh · render asli aktif di situs (login + kuota)'
    : (kind === '3d' ? 'Pratinjau cepat — buat versi 3D realistis dengan AI' : 'Pratinjau cepat — hasilkan foto realistis dengan AI');
  return (
    <div style={{ position: 'absolute', left: '50%', bottom: 18, transform: 'translateX(-50%)', zIndex: 9, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, width: 'max-content', maxWidth: '90%' }}>
      <div style={{ background: 'rgba(33,27,22,.8)', color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '6px 13px', borderRadius: 99, backdropFilter: 'blur(4px)', textAlign: 'center' }}>
        {msg}
      </div>
      {upsell
        ? <button className="btn btn-violet btn-lg" onClick={onUpgrade}>
            <Icon name="bolt" size={18} /> Upgrade ke Pro
          </button>
        : <button className="btn btn-violet btn-lg" disabled={busy} onClick={onGen}>
            {busy ? <Icon name="refresh" size={18} className="spin" /> : <Icon name="wand" size={18} />}
            {busy ? 'AI me-render…' : (kind === '3d' ? 'Buat 3D Realistis (AI)' : 'Render Foto Realistis (AI)')}
          </button>}
    </div>
  );
}

function Editor({ design, setDesign, mode, setMode, toast, onNewDesign }) {
  const d = design;
  const [tool, setTool] = useState('ai');
  const [tab, setTab] = useState('render'); // denah | 3d | render
  const [night, setNight] = useState(false);
  const [regen, setRegen] = useState(false);
  const [added, setAdded] = useState([]);
  const [aiImg, setAiImg] = useState({});
  const [aiBusy, setAiBusy] = useState(false);
  const [aiDemo, setAiDemo] = useState(false);
  const [aiUpsell, setAiUpsell] = useState(false);
  const [aiCost, setAiCost] = useState(null);
  const [aiCostBusy, setAiCostBusy] = useState(false);
  const [costQuality, setCostQuality] = useState('menengah');
  const openPlan = () => { try { (window.openPlanModal || (window.parent && window.parent.openPlanModal) || function () { toast('Upgrade ke paket Pro untuk memakai Render AI.'); })(); } catch (e) { toast('Upgrade ke paket Pro untuk memakai Render AI.'); } };
  const cost = estCost(d), ok = d.budget >= cost;
  const designKey = `${d.gaya}|${d.w}x${d.l}|${d.beds}|${[...d.needs].sort().join(',')}|${night ? 'n' : 'd'}`;
  useEffect(() => { setAiImg({}); setAiCost(null); }, [designKey]);
  const genCost = async () => {
    if (!window.AICost) return;
    setAiCostBusy(true);
    try {
      const est = await window.AICost.estimate(d, { quality: costQuality });
      setAiCost(est);
      if (est.note === 'provider') toast('Estimasi AI sedang tak tersedia — memakai perkiraan cepat.');
      else if (est.source === 'ai') toast('Estimasi AI selesai ✨');
      else toast('Perkiraan cepat dihitung (AI aktif di situs saat login).');
    } catch (e) { toast('Estimasi gagal: ' + (e.message || e)); }
    finally { setAiCostBusy(false); }
  };
  const genAI = async (kind) => {
    if (!window.QuickRender) return;
    setAiBusy(true);
    try {
      const url = await window.QuickRender.generate(d, kind);
      setAiImg(a => ({ ...a, [kind]: url })); setAiDemo(false); setAiUpsell(false); toast('Render AI fotorealistik selesai ✨');
    } catch (e) {
      if (e && e.upgrade) { setAiUpsell(true); toast('Render AI khusus paket Pro & Developer.'); openPlan(); }
      else if (e && e.provider) { toast(e.message || 'Layanan Render AI sedang tidak tersedia. Kuota Anda tidak terpotong — coba lagi nanti.'); }
      else if (e && e.demo) { setAiDemo(true); toast('Mode contoh — render asli aktif di situs (login + kuota).'); }
      else { toast('Render gagal: ' + (e.message || e)); }
    } finally { setAiBusy(false); }
  };

  const doRegen = (msg) => { setRegen(true); setTimeout(() => { setRegen(false); msg && toast(msg); }, 1000); };
  const pickTool = (k) => {
    setTool(k);
    if (k === 'buat') return onNewDesign();
    if (k === 'dinding' || k === 'ruang') setTab('denah');
    if (k === 'ai' || k === 'render') setTab('render');
    if (k === 'style') setTab('render');
  };
  const applyHelper = (h) => {
    const f = FEATURE_MAP[h];
    if (f) { const n = new Set(d.needs); n.add(f); setDesign({ ...d, needs: n }); }
    if (h === 'Suasana sore') setNight(true);
    setAdded(a => a.includes(h) ? a : [...a, h]);
    doRegen('AI: "' + h + '" diterapkan');
  };
  const setGaya = (st) => { setDesign({ ...d, gaya: st }); doRegen('Gaya: ' + STYLES[st].label); };

  return (
    <div className="ed-body">
      {/* RAIL */}
      <div className="ed-rail">
        {RAIL.map((r, i) => r.g
          ? <div key={i} className="rail-group-label">{r.g}</div>
          : <button key={r.k} className={'rail-btn' + (r.ai ? ' ai' : '') + (tool === r.k ? ' on' : '')} onClick={() => pickTool(r.k)}>
              <span className="ri"><Icon name={r.i} size={19} /></span>{r.label}
            </button>
        )}
      </div>

      {/* CANVAS */}
      <div className="ed-canvas-wrap">
        <div className="canvas-tabs">
          <button className={'ctab' + (tab === 'denah' ? ' on' : '')} onClick={() => setTab('denah')}><Icon name="grid" size={16} /> Denah 2D</button>
          <button className={'ctab' + (tab === '3d' ? ' on' : '')} onClick={() => setTab('3d')}><Icon name="cube" size={16} /> Preview 3D</button>
          <button className={'ctab hero' + (tab === 'render' ? ' on' : '')} onClick={() => setTab('render')}><Icon name="wand" size={16} /> Render AI <span className="hbadge">HERO</span></button>
          <div style={{ flex: 1 }}></div>
          {tab === 'render' && <div className="mode-toggle" style={{ background: 'var(--surface)' }}>
            <button className={!night ? 'on' : ''} onClick={() => { setNight(false); doRegen(); }}><Icon name="sun" size={14} /> Siang</button>
            <button className={night ? 'on' : ''} onClick={() => { setNight(true); doRegen(); }}><Icon name="drop" size={14} /> Sore</button>
          </div>}
        </div>

        <div className="ed-stage">
          {(regen || aiBusy) && <div className="regen-overlay"><div className="box"><Icon name="refresh" size={20} className="spin" /> {aiBusy ? 'AI membuat render fotorealistik…' : 'AI me-render…'}</div></div>}
          <div className="stage-hint">
            <Icon name={tab === 'denah' ? 'grid' : tab === '3d' ? 'cube' : 'wand'} size={14} />
            {tab === 'denah' ? `Denah ${d.w}×${d.l} m` : tab === '3d' ? ((aiImg['3d']) ? '3D Realistis (AI)' : 'Preview 3D — shadow, langit, material') : ((aiImg.render) ? `Render AI · ${STYLES[d.gaya].label}` : `Preview · ${STYLES[d.gaya].label}`)}
          </div>
          {tab !== 'denah' && <div className="stage-tools">
            <button className="st" title="Zoom"><Icon name="zoom" size={18} /></button>
            <button className="st" title="Render ulang dgn AI" onClick={() => genAI(tab)}><Icon name="refresh" size={18} /></button>
            {(aiImg[tab]) && <a className="st" title="Download" href={aiImg[tab]} download={`DadiOmah_${tab}_${Date.now()}.png`} style={{ textDecoration: 'none' }}><Icon name="download" size={18} /></a>}
          </div>}
          {tab === 'denah' && <FloorPlan width={d.w} length={d.l} rooms={{ beds: d.beds }} />}
          {tab === '3d' && (aiImg['3d']
            ? <img src={aiImg['3d']} alt="3D realistis" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            : <React.Fragment><Iso3D style={d.gaya} features={d.needs} /><GenCTA kind="3d" busy={aiBusy} demo={aiDemo} upsell={aiUpsell} onGen={() => genAI('3d')} onUpgrade={openPlan} /></React.Fragment>)}
          {tab === 'render' && (aiImg.render
            ? <img src={aiImg.render} alt="Render AI" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            : <React.Fragment><AIRender style={d.gaya} features={d.needs} night={night} /><GenCTA kind="render" busy={aiBusy} demo={aiDemo} upsell={aiUpsell} onGen={() => genAI('render')} onUpgrade={openPlan} /></React.Fragment>)}
        </div>

        <div className="canvas-foot">
          <div className="foot-stat"><Icon name="ruler" size={14} /><span className="fk">Tanah</span> <b>{d.w}×{d.l} m</b></div>
          <div className="foot-stat"><Icon name="home" size={14} /><span className="fk">Bangunan</span> <b>{Math.round(area(d))} m²</b></div>
          <div className="foot-stat"><Icon name="bed" size={14} /><span className="fk">Kamar</span> <b>{d.beds}</b></div>
          <div className="foot-stat" style={{ color: ok ? 'var(--mint-ink)' : 'var(--brand-ink)' }}><Icon name="wallet" size={14} /><span className="fk">RAB</span> <b>{rpShort(cost)}</b></div>
        </div>
      </div>

      {/* CONTEXTUAL PANEL */}
      <div className="ed-panel">
        {(tool === 'ai' || tool === 'render') && <React.Fragment>
          <div className="ai-hero">
            <div className="ttl"><Icon name="wand" size={18} /> AI Designer</div>
            <p className="panel-sub" style={{ margin: '8px 0 0' }}>Klik saran di bawah — tanpa perlu mengetik prompt. AI langsung render ulang.</p>
          </div>
          <div className="prompt-box" style={{ marginTop: 12 }}>
            <Icon name="wand" size={16} style={{ color: 'var(--violet)' }} />
            <input placeholder="Tulis perubahan…" onKeyDown={e => { if (e.key === 'Enter' && e.target.value) { applyHelper(e.target.value); e.target.value = ''; } }} />
          </div>
          <div className="helper-grid">
            {HELPERS.map(h => (
              <div key={h} className={'helper' + (added.includes(h) ? ' added' : '')} onClick={() => applyHelper(h)}>
                {added.includes(h) ? <Icon name="check" size={13} /> : <Icon name="plus" size={13} />}{h}
              </div>
            ))}
          </div>
          <div className="regen-row">
            <Btn variant="violet" size="sm" icon="wand" disabled={aiBusy} onClick={() => { setTab('render'); genAI('render'); }}>{aiBusy ? 'Merender…' : 'Render Realistis'}</Btn>
            <Btn variant="ghost" size="sm" icon="share" onClick={() => toast('Membuka opsi bagikan…')}>Bagikan</Btn>
          </div>
          <div className="panel-sec-h">Variasi cepat</div>
          <div className="varrow" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
            {STYLE_LIST.slice(0, 4).map((st, i) => (
              <div key={i} className={'varthumb' + (d.gaya === st ? ' sel' : '')} onClick={() => setGaya(st)}><AIRender style={st} features={d.needs} night={night} /></div>
            ))}
          </div>
        </React.Fragment>}

        {tool === 'style' && <React.Fragment>
          <div className="panel-h"><Icon name="palette" size={18} /> Style Preset</div>
          <p className="panel-sub">Pilih gaya — material, warna, dan suasana render berubah instan.</p>
          <div className="preset-list">
            {STYLE_LIST.map(st => (
              <div key={st} className={'preset' + (d.gaya === st ? ' on' : '')} onClick={() => setGaya(st)}>
                <div className="pv" style={{ background: styleGradient(st) }}></div>
                <div><b>{STYLES[st].label}</b><small>{STYLES[st].desc}</small></div>
              </div>
            ))}
          </div>
        </React.Fragment>}

        {tool === 'cost' && <React.Fragment>
          <div className="panel-h"><Icon name="wallet" size={18} /> Estimasi Biaya (RAB)</div>
          <p className="panel-sub">Perkiraan otomatis dari luas &amp; material gaya {STYLES[d.gaya].label}. Gunakan <b>Estimasi AI</b> untuk rincian &amp; rentang lebih akurat.</p>

          <div className="panel-sec-h">Kualitas finishing</div>
          <div className="seg" style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {['ekonomis', 'menengah', 'premium'].map(q => (
              <button key={q} onClick={() => setCostQuality(q)}
                style={{ flex: 1, padding: '8px 6px', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
                  border: '1.5px solid ' + (costQuality === q ? 'var(--brand)' : 'var(--line)'),
                  background: costQuality === q ? 'var(--brand-soft)' : 'transparent',
                  color: costQuality === q ? 'var(--brand-ink)' : 'var(--ink-2)' }}>{q}</button>
            ))}
          </div>
          <Btn variant="violet" size="sm" icon={aiCostBusy ? 'refresh' : 'wand'} disabled={aiCostBusy} style={{ width: '100%' }} onClick={genCost}>
            {aiCostBusy ? 'AI menghitung…' : (aiCost ? 'Hitung ulang dengan AI' : 'Estimasi dengan AI')}</Btn>

          {!aiCost && <React.Fragment>
            <div className="cost-big" style={{ marginTop: 16 }}>{rp(cost)}</div>
            <div className="budget-tag" style={{ marginTop: 10, background: ok ? 'var(--mint-soft)' : '#fdeede', color: ok ? 'var(--mint-ink)' : 'var(--brand-ink)' }}>
              <Icon name={ok ? 'check' : 'bolt'} size={14} /> Budget {rpShort(d.budget)} · {ok ? 'cukup' : 'kurang ' + rpShort(cost - d.budget)}</div>
            <div className="cost-rows">
              <div className="cost-row"><span>Struktur &amp; pondasi</span><b>{rpShort(cost * .34)}</b></div>
              <div className="cost-row"><span>Dinding &amp; atap</span><b>{rpShort(cost * .28)}</b></div>
              <div className="cost-row"><span>Finishing</span><b>{rpShort(cost * .22)}</b></div>
              <div className="cost-row"><span>MEP &amp; lain-lain</span><b>{rpShort(cost * .16)}</b></div>
            </div>
          </React.Fragment>}

          {aiCost && (() => {
            const mid = (aiCost.total_low + aiCost.total_high) / 2;
            const okAI = d.budget >= mid;
            const maxAmt = Math.max.apply(null, aiCost.items.map(i => i.amount || 0)) || 1;
            return <React.Fragment>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '16px 0 4px' }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 99,
                  background: aiCost.source === 'ai' ? 'var(--violet-soft, #efeaff)' : 'var(--surface-2, #f1efe9)',
                  color: aiCost.source === 'ai' ? '#6E54F0' : 'var(--ink-2)' }}>
                  {aiCost.source === 'ai' ? '✨ Estimasi AI' : 'Perkiraan cepat'}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-3, #9a9)', fontWeight: 600 }}>≈ {aiCost.buildArea} m²</span>
              </div>
              <div className="cost-big" style={{ fontSize: 22 }}>{rpShort(aiCost.total_low)} – {rpShort(aiCost.total_high)}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, marginTop: 2 }}>
                {rp(aiCost.per_m2_low)}–{rp(aiCost.per_m2_high)} / m²</div>
              <div className="budget-tag" style={{ marginTop: 10, background: okAI ? 'var(--mint-soft)' : '#fdeede', color: okAI ? 'var(--mint-ink)' : 'var(--brand-ink)' }}>
                <Icon name={okAI ? 'check' : 'bolt'} size={14} /> Budget {rpShort(d.budget)} · {okAI ? 'cukup (vs rata-rata)' : 'kurang ' + rpShort(mid - d.budget)}</div>
              <div className="cost-rows">
                {aiCost.items.map((it, i) => (
                  <div key={i} style={{ marginBottom: 9 }}>
                    <div className="cost-row" style={{ marginBottom: 3 }}><span>{it.name}</span><b>{rpShort(it.amount)}</b></div>
                    <div style={{ height: 4, borderRadius: 3, background: 'var(--line)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: Math.max(4, Math.round((it.amount / maxAmt) * 100)) + '%', background: 'linear-gradient(90deg,#6E54F0,#9a86ff)' }}></div>
                    </div>
                  </div>
                ))}
              </div>
              {aiCost.summary && <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 6 }}>{aiCost.summary}</p>}
              {aiCost.assumptions && aiCost.assumptions.length > 0 && <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--ink-3,#9a9)', marginBottom: 5 }}>Asumsi</div>
                {aiCost.assumptions.map((a, i) => (
                  <div key={i} style={{ fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.5, paddingLeft: 12, position: 'relative', marginBottom: 3 }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--brand)' }}>·</span>{a}</div>
                ))}
              </div>}
            </React.Fragment>;
          })()}

          <Btn variant="ghost" size="sm" icon="download" style={{ marginTop: 16, width: '100%' }} onClick={() => toast('Export RAB ke PDF…')}>Export RAB PDF</Btn>
        </React.Fragment>}

        {tool === 'file' && <React.Fragment>
          <div className="panel-h"><Icon name="doc" size={18} /> File &amp; Proyek</div>
          <p className="panel-sub">Simpan, ekspor, atau buat desain baru.</p>
          <div style={{ display: 'grid', gap: 10 }}>
            <Btn size="sm" icon="wand" onClick={onNewDesign}>Desain Baru (Wizard)</Btn>
            <Btn variant="ghost" size="sm" icon="download" onClick={() => toast('Export PNG…')}>Export Gambar</Btn>
            <Btn variant="ghost" size="sm" icon="doc" onClick={() => toast('Export PDF lengkap…')}>Export PDF + RAB</Btn>
            <Btn variant="ghost" size="sm" icon="share" onClick={() => toast('Bagikan link…')}>Bagikan Proyek</Btn>
          </div>
        </React.Fragment>}

        {(tool === 'dinding' || tool === 'ruang') && <React.Fragment>
          <div className="panel-h"><Icon name={tool === 'dinding' ? 'ruler' : 'grid'} size={18} /> {tool === 'dinding' ? 'Dinding' : 'Ruang'}</div>
          <p className="panel-sub">{tool === 'dinding' ? 'Atur ukuran & ketebalan dinding pada denah.' : 'Kelola ruangan & ukurannya.'}</p>
          {tool === 'dinding' && <React.Fragment>
            <div className="prop"><label>Lebar tanah</label>
              <div className="slider-row" style={{ margin: 0 }}><input type="range" min="4" max="20" value={d.w} onChange={e => setDesign({ ...d, w: +e.target.value })} /></div></div>
            <div className="prop"><label>Panjang tanah</label>
              <div className="slider-row" style={{ margin: 0 }}><input type="range" min="6" max="25" value={d.l} onChange={e => setDesign({ ...d, l: +e.target.value })} /></div></div>
          </React.Fragment>}
          {tool === 'ruang' && <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <label style={{ fontWeight: 700, fontSize: 13 }}>Kamar tidur</label>
            <div className="stepper"><button onClick={() => setDesign({ ...d, beds: Math.max(1, d.beds - 1) })}>−</button><span className="sv">{d.beds}</span><button onClick={() => setDesign({ ...d, beds: Math.min(6, d.beds + 1) })}>+</button></div>
          </div>}
          <div className="panel-sec-h">Kebutuhan</div>
          <div className="needs" style={{ gap: 8 }}>
            {NEEDS.map(n => {
              const on = d.needs.has(n.k);
              return <div key={n.k} className={'need' + (on ? ' sel' : '')} style={{ fontSize: 13, padding: '9px 13px' }}
                onClick={() => { const s = new Set(d.needs); on ? s.delete(n.k) : s.add(n.k); setDesign({ ...d, needs: s }); }}>
                <Icon name={n.i} size={15} /> {n.label}</div>;
            })}
          </div>
        </React.Fragment>}
      </div>
    </div>
  );
}

/* ============================ APP ============================ */
function EditorApp() {
  const [phase, setPhase] = useState('welcome'); // welcome | progress | editor
  const [mode, setMode] = useState('quick'); // quick | pro
  const [toastMsg, setToastMsg] = useState(null);
  const [design, setDesign] = useState({ jenis: 'Rumah Tinggal', w: 6, l: 10, budget: 500000000, gaya: 'Industrial', needs: new Set(['carport', 'taman']), beds: 3 });
  const toast = (m) => { setToastMsg(m); clearTimeout(window.__et); window.__et = setTimeout(() => setToastMsg(null), 2300); };

  return (
    <div className="ed">
      <header className="ed-head">
        <div className="ed-brand"><div className="logo"><Icon name="home" size={18} /></div><b>Dadi</b><span>Omah</span></div>
        <div className="ed-proj"><span className="nm">{design.jenis} {design.w}×{design.l}</span><span className="mt">STUDIO CEPAT · OMAHAI</span></div>
        <div className="spacer"></div>
        <div className="mode-toggle">
          <button className={'ai' + (mode === 'quick' ? ' on' : '')} onClick={() => setMode('quick')}><Icon name="bolt" size={14} /> Quick AI</button>
          <button className={mode === 'pro' ? ' on' : ''} onClick={() => { setMode('pro'); toast('Mode Professional — semua kontrol editor aktif'); }}><Icon name="layers" size={14} /> Professional</button>
        </div>
        <Btn variant="ghost" size="sm" icon="download" onClick={() => toast('Menyimpan proyek…')}>Simpan</Btn>
        <Btn size="sm" icon="share" onClick={() => toast('Export & bagikan…')}>Export</Btn>
        <button className="ed-close" title="Tutup" onClick={closeEditor}><Icon name="plus" size={20} style={{ transform: 'rotate(45deg)' }} /></button>
      </header>

      <div style={{ flex: 1, position: 'relative', minHeight: 0, display: 'flex' }}>
        <Editor design={design} setDesign={setDesign} mode={mode} setMode={setMode} toast={toast} onNewDesign={() => setPhase('welcome')} />
        {phase === 'welcome' && <Welcome design={design} setDesign={setDesign} onDone={() => setPhase('progress')} onClose={closeEditor} />}
        {phase === 'progress' && <Progress design={design} onDone={() => { setPhase('editor'); toast('Desain siap! Sempurnakan dengan AI →'); }} />}
      </div>

      {toastMsg && <div className="toast pop-in"><Icon name="check" size={16} style={{ color: 'var(--mint)' }} /> {toastMsg}</div>}
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<EditorApp />);
