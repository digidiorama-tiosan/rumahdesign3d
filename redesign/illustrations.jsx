/* global React, Icon */

/* ============================================================
   STYLE PRESETS — drives colors of 3D + AI render
   ============================================================ */
const STYLES = {
  'Minimalis Modern': {
    label: 'Minimalis', desc: 'Modern',
    sky: ['#bfe0f5', '#eaf6fd'], sun: '#fff6e0', sunPos: ['78%', '20%'],
    wall: '#f3efe9', wallShade: '#d9d2c8', roof: '#3b3f45', roofShade: '#2a2d31',
    trim: '#2b2f34', door: '#5b6470', glass: '#9fc4dd', accent: '#3b3f45',
    ground: ['#cfe0b6', '#a9c884'], foliage: '#5f8d4e', foliage2: '#74a35e',
    flat: true,
  },
  'Japandi': {
    label: 'Japandi', desc: 'Hangat tenang',
    sky: ['#dfe7e3', '#f4efe6'], sun: '#fdf0d8', sunPos: ['72%', '24%'],
    wall: '#e7ddcd', wallShade: '#c9bca6', roof: '#4b3f33', roofShade: '#382f26',
    trim: '#6b5a45', door: '#7a5c3e', glass: '#aebfbf', accent: '#8a6d4b',
    ground: ['#cdd6b8', '#a7b888'], foliage: '#6c8a5a', foliage2: '#86a06b',
    flat: false,
  },
  'Industrial': {
    label: 'Industrial', desc: 'Bata & metal',
    sky: ['#c2c7cd', '#e6e9ec'], sun: '#eef0f2', sunPos: ['80%', '26%'],
    wall: '#9a8576', wallShade: '#6f5f53', roof: '#33373b', roofShade: '#23262a',
    trim: '#2c2f33', door: '#41464b', glass: '#7e94a3', accent: '#b5563a',
    ground: ['#bdbfb4', '#9a9c8e'], foliage: '#6f7d5a', foliage2: '#869166',
    flat: true,
  },
  'Scandinavian': {
    label: 'Scandi', desc: 'Putih & kayu',
    sky: ['#cfe8f6', '#f3fafd'], sun: '#fffaf0', sunPos: ['76%', '18%'],
    wall: '#f7f4ef', wallShade: '#dcd6cb', roof: '#5a4a3a', roofShade: '#43362a',
    trim: '#3a3530', door: '#a8865f', glass: '#bcd6e6', accent: '#c99a63',
    ground: ['#d6e4c5', '#b2cb92'], foliage: '#6f9a5c', foliage2: '#8bb072',
    flat: false,
  },
  'Tropical': {
    label: 'Tropical', desc: 'Terakota & hijau',
    sky: ['#ffd9a8', '#ffeccb'], sun: '#fff1c9', sunPos: ['70%', '22%'],
    wall: '#efe2cf', wallShade: '#cdb89c', roof: '#8a4b32', roofShade: '#6d3a26',
    trim: '#5a4632', door: '#6e4a2e', glass: '#a9cdd0', accent: '#c46b3e',
    ground: ['#bfe09a', '#8fc06a'], foliage: '#3f7a44', foliage2: '#579a55',
    flat: false,
  },
};
const STYLE_LIST = Object.keys(STYLES);

/* small accent gradient for swatches/cards */
function styleGradient(name) {
  const s = STYLES[name] || STYLES['Minimalis Modern'];
  return `linear-gradient(160deg, ${s.sky[1]} 0%, ${s.sky[0]} 38%, ${s.wall} 39%, ${s.wallShade} 70%, ${s.ground[0]} 71%, ${s.ground[1]})`;
}

/* ============================================================
   AI RENDER — semi-realistic CSS scene (parametric)
   features: Set of 'pagar','taman','carport','kolam','2lantai'
   ============================================================ */
function AIRender({ style = 'Minimalis Modern', features = new Set(), night = false }) {
  const s = STYLES[style] || STYLES['Minimalis Modern'];
  const sky = night ? ['#1c2a45', '#2d3f63'] : s.sky;
  const two = features.has('2lantai');
  const bodyH = two ? '54%' : '40%';
  const bodyTop = two ? '24%' : '38%';

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* sky */}
      <div style={{ position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 62%)` }} />
      {/* sun glow */}
      <div style={{ position: 'absolute', left: s.sunPos[0], top: s.sunPos[1], width: 180, height: 180,
        transform: 'translate(-50%,-50%)', borderRadius: '50%',
        background: `radial-gradient(circle, ${night ? '#ffe9b0' : s.sun} 0%, transparent 68%)`,
        filter: 'blur(2px)', opacity: night ? .5 : .95 }} />
      {/* distant hill */}
      <div style={{ position: 'absolute', left: '-5%', right: '-5%', top: '52%', height: '22%',
        background: `linear-gradient(180deg, ${s.foliage2}, ${s.foliage})`, opacity: .35,
        borderRadius: '50% 50% 0 0 / 100% 100% 0 0', filter: 'blur(3px)' }} />

      {/* ground / lawn */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%',
        background: `linear-gradient(180deg, ${s.ground[0]}, ${s.ground[1]})` }} />
      {/* lawn texture */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', opacity: .25,
        background: `repeating-linear-gradient(95deg, rgba(0,0,0,.06) 0 2px, transparent 2px 9px)` }} />

      {/* path */}
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '26%', height: '30%', background: `linear-gradient(180deg, #e9e2d6, #cfc6b6)`,
        clipPath: 'polygon(38% 0, 62% 0, 100% 100%, 0 100%)', opacity: .9 }} />

      {/* cast shadow */}
      <div style={{ position: 'absolute', left: '50%', bottom: '24%', transform: 'translateX(-50%)',
        width: '62%', height: 30, background: 'rgba(20,20,30,.28)', borderRadius: '50%', filter: 'blur(9px)' }} />

      {/* pool */}
      {features.has('kolam') && (
        <div style={{ position: 'absolute', left: '8%', bottom: '8%', width: '24%', height: '13%',
          borderRadius: 10, background: 'linear-gradient(180deg,#7fc7d8,#4a9fc0)',
          boxShadow: 'inset 0 3px 8px rgba(255,255,255,.5), inset 0 -6px 10px rgba(0,0,40,.18)' }} />
      )}

      {/* ===== HOUSE ===== */}
      {/* side wall (right, shaded) */}
      <div style={{ position: 'absolute', left: '62%', top: bodyTop, width: '14%', height: bodyH,
        background: s.wallShade, transform: 'skewY(11deg)', transformOrigin: 'top left' }} />
      {/* main body */}
      <div style={{ position: 'absolute', left: '28%', top: bodyTop, width: '34%', height: bodyH,
        background: `linear-gradient(100deg, ${s.wall}, ${s.wallShade} 160%)`,
        boxShadow: 'inset 0 0 40px rgba(0,0,0,.04)' }}>
        {/* windows grid */}
        <div style={{ position: 'absolute', inset: two ? '12% 12% 30%' : '16% 14% 28%',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: two ? '1fr 1fr' : '1fr', gap: '14%' }}>
          {Array.from({ length: two ? 4 : 2 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 3, border: `2px solid ${s.trim}`,
              background: night
                ? 'linear-gradient(160deg,#ffd98a,#ffbe5c)'
                : `linear-gradient(150deg, ${s.glass} 0%, #ffffff 48%, ${s.glass} 100%)`,
              boxShadow: night ? '0 0 12px rgba(255,200,90,.7)' : 'inset 0 0 6px rgba(255,255,255,.5)' }} />
          ))}
        </div>
        {/* door */}
        <div style={{ position: 'absolute', left: '40%', bottom: 0, width: '20%', height: '30%',
          background: `linear-gradient(180deg, ${s.door}, ${s.roofShade})`, borderRadius: '3px 3px 0 0',
          borderLeft: `2px solid ${s.trim}`, borderRight: `2px solid ${s.trim}`, borderTop: `2px solid ${s.trim}` }} />
      </div>

      {/* roof */}
      {s.flat ? (
        <div style={{ position: 'absolute', left: '26%', top: `calc(${bodyTop} - 5%)`, width: '38%', height: '6%',
          background: s.roof, borderRadius: 2,
          boxShadow: `0 3px 0 ${s.roofShade}` }} />
      ) : (
        <div style={{ position: 'absolute', left: '24%', top: `calc(${bodyTop} - 13%)`, width: '42%', height: '15%',
          background: `linear-gradient(170deg, ${s.roof}, ${s.roofShade})`,
          clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
      )}

      {/* carport */}
      {features.has('carport') && (
        <React.Fragment>
          <div style={{ position: 'absolute', left: '6%', top: `calc(${bodyTop} + ${two ? 22 : 14}%)`, width: '24%', height: '5%',
            background: s.roofShade, borderRadius: 3 }} />
          <div style={{ position: 'absolute', left: '7%', top: `calc(${bodyTop} + ${two ? 26 : 18}%)`, width: '3%', height: two ? '26%' : '20%', background: s.wallShade }} />
          <div style={{ position: 'absolute', left: '27%', top: `calc(${bodyTop} + ${two ? 26 : 18}%)`, width: '3%', height: two ? '26%' : '20%', background: s.wallShade }} />
        </React.Fragment>
      )}

      {/* trees */}
      <Tree x="80%" y="62%" scale={1.1} c={s.foliage} c2={s.foliage2} />
      <Tree x="16%" y="58%" scale={0.8} c={s.foliage2} c2={s.foliage} />
      {features.has('taman') && <React.Fragment>
        <Tree x="88%" y="70%" scale={0.7} c={s.foliage} c2={s.foliage2} />
        <Shrub x="34%" y="73%" c={s.foliage} />
        <Shrub x="66%" y="73%" c={s.foliage2} />
      </React.Fragment>}

      {/* fence */}
      {features.has('pagar') && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '20%', height: '7%',
          background: `repeating-linear-gradient(90deg, ${s.trim} 0 3px, transparent 3px 22px)`, opacity: .7 }} />
      )}

      {/* atmosphere */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: night
          ? 'radial-gradient(120% 80% at 50% 30%, transparent 50%, rgba(10,16,32,.45))'
          : `radial-gradient(120% 90% at 50% 18%, rgba(255,250,235,.25), transparent 45%), radial-gradient(140% 100% at 50% 110%, rgba(40,30,10,.18), transparent 55%)` }} />
    </div>
  );
}

function Tree({ x, y, scale = 1, c = '#5f8d4e', c2 = '#74a35e' }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,0) scale(${scale})`,
      width: 0, height: 0 }}>
      <div style={{ position: 'absolute', left: -4, top: 26, width: 8, height: 30, background: '#7a5638', borderRadius: 3 }} />
      <div style={{ position: 'absolute', left: -26, top: -16, width: 52, height: 52, borderRadius: '50%',
        background: `radial-gradient(circle at 38% 32%, ${c2}, ${c})`, boxShadow: 'inset -6px -8px 12px rgba(0,0,0,.18)' }} />
      <div style={{ position: 'absolute', left: -8, top: -30, width: 34, height: 34, borderRadius: '50%',
        background: `radial-gradient(circle at 40% 35%, ${c2}, ${c})` }} />
    </div>
  );
}
function Shrub({ x, y, c }) {
  return <div style={{ position: 'absolute', left: x, top: y, transform: 'translateX(-50%)', width: 30, height: 20,
    borderRadius: '50%', background: `radial-gradient(circle at 40% 30%, ${c}, rgba(0,0,0,.15))` }} />;
}

/* ============================================================
   FLOOR PLAN — top-down denah (parametric proportions)
   ============================================================ */
function FloorPlan({ width = 8, length = 12, rooms, compact = false }) {
  // believable parametric layout (relative % of footprint)
  const beds = (rooms && rooms.beds) || 2;
  const layout = [
    { x: 2, y: 2, w: 50, h: 40, label: 'R. Tamu', furn: 'sofa' },
    { x: 52, y: 2, w: 46, h: 24, label: 'Dapur', furn: 'kitchen' },
    { x: 52, y: 26, w: 46, h: 16, label: 'KM', furn: 'bath' },
    { x: 2, y: 42, w: 32, h: 36, label: 'K. Utama', furn: 'bed' },
    { x: 34, y: 42, w: 30, h: 36, label: beds >= 2 ? 'K. Tidur 2' : 'Gudang', furn: beds >= 2 ? 'bed' : '' },
    { x: 64, y: 42, w: 34, h: 36, label: 'R. Keluarga', furn: 'sofa' },
    { x: 2, y: 78, w: 96, h: 20, label: 'Teras / Carport', furn: 'car' },
  ];
  const ar = width / length; // aspect ratio for the footprint box
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fbfaf7',
      backgroundImage: 'linear-gradient(#ede7dc 1px, transparent 1px), linear-gradient(90deg,#ede7dc 1px, transparent 1px)',
      backgroundSize: '22px 22px', display: 'grid', placeItems: 'center', padding: compact ? 14 : 26 }}>
      {/* dimension labels */}
      <div style={{ position: 'relative', width: `min(${ar >= 1 ? '86%' : (86 * ar) + '%'}, 86%)`,
        aspectRatio: `${width} / ${length}`, maxHeight: '90%' }}>
        {!compact && <React.Fragment>
          <Dim where="top" text={`${width} m`} />
          <Dim where="left" text={`${length} m`} />
        </React.Fragment>}
        {/* footprint outer wall */}
        <div style={{ position: 'absolute', inset: 0, background: '#fff',
          boxShadow: 'inset 0 0 0 3px #2b2f34', borderRadius: 2 }}>
          {layout.map((r, i) => (
            <div key={i} style={{ position: 'absolute', left: r.x + '%', top: r.y + '%', width: r.w + '%', height: r.h + '%',
              boxShadow: 'inset 0 0 0 1.5px #b9b0a2', background: i % 2 ? '#fdfcf9' : '#f7f4ee',
              display: 'grid', placeItems: 'center' }}>
              <Furniture kind={r.furn} />
              {!compact && <span style={{ position: 'relative', fontSize: 10.5, fontWeight: 800, color: '#5a5249',
                letterSpacing: '.02em', textAlign: 'center', lineHeight: 1.1, padding: 2, zIndex: 2 }}>{r.label}</span>}
            </div>
          ))}
          {/* door arcs */}
          <Door x="26%" y="78%" /><Door x="50%" y="42%" />
        </div>
        {/* north arrow */}
        {!compact && (
          <div style={{ position: 'absolute', top: -2, right: -34, textAlign: 'center', color: '#8a8178' }}>
            <Icon name="arrowR" size={16} style={{ transform: 'rotate(-90deg)' }} />
            <div style={{ fontSize: 10, fontWeight: 800 }}>U</div>
          </div>
        )}
      </div>
    </div>
  );
}
function Dim({ where, text }) {
  const base = { position: 'absolute', fontSize: 10, fontWeight: 800, color: '#8a8178', background: '#fbfaf7', padding: '0 5px' };
  if (where === 'top') return <div style={{ ...base, top: -16, left: '50%', transform: 'translateX(-50%)' }}>{text}</div>;
  return <div style={{ ...base, left: -30, top: '50%', transform: 'translateY(-50%) rotate(-90deg)' }}>{text}</div>;
}
function Door({ x, y }) {
  return <div style={{ position: 'absolute', left: x, top: y, width: 18, height: 18,
    borderTop: '1.5px solid #c9a063', borderRight: '1.5px solid #c9a063', borderRadius: '0 100% 0 0', opacity: .8 }} />;
}
function Furniture({ kind }) {
  const wrap = { position: 'absolute', opacity: .5 };
  if (kind === 'bed') return <div style={{ ...wrap, right: '14%', top: '16%', width: '46%', height: '54%', borderRadius: 3, background: '#d7cdbb', boxShadow: 'inset 0 0 0 1.5px #b9b0a2' }} />;
  if (kind === 'sofa') return <div style={{ ...wrap, left: '12%', bottom: '14%', width: '52%', height: '24%', borderRadius: 4, background: '#cdd6d9', boxShadow: 'inset 0 0 0 1.5px #a9b3b6' }} />;
  if (kind === 'kitchen') return <div style={{ ...wrap, left: 0, top: 0, width: '100%', height: '26%', background: '#d9d2c6' }} />;
  if (kind === 'bath') return <div style={{ ...wrap, right: '12%', top: '20%', width: '30%', height: '40%', borderRadius: '40%', background: '#cfe0e6', boxShadow: 'inset 0 0 0 1.5px #a9c0c8' }} />;
  if (kind === 'car') return <div style={{ ...wrap, left: '8%', top: '24%', width: '30%', height: '52%', borderRadius: 4, background: '#cdd1d6', boxShadow: 'inset 0 0 0 1.5px #aab0b6' }} />;
  return null;
}

/* ============================================================
   3D ISO — CSS 3D massing model
   ============================================================ */
function Iso3D({ style = 'Minimalis Modern', features = new Set(), compact = false }) {
  const s = STYLES[style] || STYLES['Minimalis Modern'];
  const two = features.has('2lantai');
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden',
      background: `linear-gradient(180deg, ${s.sky[1]}, ${s.sky[0]})` }}>
      <div style={{ position: 'absolute', inset: 0, perspective: 1100, display: 'grid', placeItems: 'center' }}>
        <div style={{ transformStyle: 'preserve-3d', transform: `rotateX(58deg) rotateZ(-42deg) scale(${compact ? .82 : 1})` }}>
          {/* ground plate */}
          <div style={{ position: 'absolute', width: 360, height: 360, left: -180, top: -180,
            background: `linear-gradient(135deg, ${s.ground[0]}, ${s.ground[1]})`, borderRadius: 8,
            boxShadow: 'inset 0 0 60px rgba(0,0,0,.08)' }} />
          {/* lawn stripes */}
          <div style={{ position: 'absolute', width: 360, height: 360, left: -180, top: -180, opacity: .18,
            background: 'repeating-linear-gradient(90deg, rgba(0,0,0,.2) 0 6px, transparent 6px 26px)' }} />
          {/* path */}
          <div style={{ position: 'absolute', width: 40, height: 150, left: -20, top: 30,
            background: '#e3dccd', borderRadius: 4 }} />
          {/* house cuboid */}
          <Cuboid w={150} h={130} z={two ? 130 : 80} top={s.wall} left={s.wall} right={s.wallShade}
            x={-75} y={-70} faces={{ wall: s.wall, shade: s.wallShade, glass: s.glass, trim: s.trim, two }} />
          {/* roof */}
          <Roof w={150} h={130} z={two ? 130 : 80} s={s} />
          {/* carport slab */}
          {features.has('carport') && (
            <div style={{ position: 'absolute', width: 70, height: 90, left: 80, top: -40,
              background: s.roofShade, transform: 'translateZ(60px)', borderRadius: 3, opacity: .92 }} />
          )}
          {/* trees */}
          <IsoTree x={95} y={70} s={s} /><IsoTree x={-110} y={-90} s={s} small />
          {features.has('taman') && <IsoTree x={110} y={-70} s={s} small />}
          {/* pool */}
          {features.has('kolam') && (
            <div style={{ position: 'absolute', width: 80, height: 50, left: -150, top: 70,
              background: 'linear-gradient(135deg,#7fc7d8,#4a9fc0)', borderRadius: 6, transform: 'translateZ(2px)' }} />
          )}
        </div>
      </div>
    </div>
  );
}
function Cuboid({ w, h, z, x, y, faces }) {
  const { wall, shade, glass, trim } = faces;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, transformStyle: 'preserve-3d' }}>
      {/* top */}
      <div style={{ position: 'absolute', width: w, height: h, background: wall, transform: `translateZ(${z}px)`,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08)' }} />
      {/* front wall (far +Y edge) */}
      <div style={{ position: 'absolute', width: w, height: z, left: 0, top: 0, transformOrigin: '0 0',
        transform: `translateY(${h}px) rotateX(-90deg)`, background: `linear-gradient(180deg, ${wall}, ${shade})` }}>
        <WallWindows glass={glass} trim={trim} cols={3} />
      </div>
      {/* side wall (right +X edge) */}
      <div style={{ position: 'absolute', width: h, height: z, left: 0, top: 0, transformOrigin: '0 0',
        transform: `translateX(${w}px) rotateY(90deg) rotateX(-90deg)`, background: `linear-gradient(180deg, ${shade}, ${shade})` }}>
        <WallWindows glass={glass} trim={trim} cols={2} dim />
      </div>
    </div>
  );
}
function WallWindows({ glass, trim, cols = 3, dim }) {
  return (
    <div style={{ position: 'absolute', inset: '24% 12% 16%', display: 'grid',
      gridTemplateColumns: `repeat(${cols},1fr)`, gap: '16%', opacity: dim ? .8 : 1 }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{ background: glass, border: `2px solid ${trim}`, borderRadius: 2,
          boxShadow: 'inset 0 0 4px rgba(255,255,255,.5)' }} />
      ))}
    </div>
  );
}
function Roof({ w, h, z, s }) {
  if (s.flat) {
    return <div style={{ position: 'absolute', left: -75, top: -70, width: w, height: h,
      background: s.roof, transform: `translateZ(${z + 6}px)`, borderRadius: 2,
      boxShadow: `0 0 0 3px ${s.roofShade}` }} />;
  }
  // pitched: two slopes
  return (
    <div style={{ position: 'absolute', left: -75, top: -70, width: w, height: h, transformStyle: 'preserve-3d',
      transform: `translateZ(${z}px)` }}>
      <div style={{ position: 'absolute', width: w, height: h / 2, top: 0, transformOrigin: 'bottom',
        transform: 'rotateX(36deg)', background: `linear-gradient(180deg, ${s.roofShade}, ${s.roof})`,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />
      <div style={{ position: 'absolute', width: w, height: h / 2, top: h / 2, transformOrigin: 'top',
        transform: 'rotateX(-36deg)', background: `linear-gradient(180deg, ${s.roof}, ${s.roofShade})`,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />
    </div>
  );
}
function IsoTree({ x, y, s, small }) {
  const r = small ? 22 : 34;
  return (
    <div style={{ position: 'absolute', left: x, top: y, transformStyle: 'preserve-3d' }}>
      <div style={{ position: 'absolute', width: 8, height: 8, left: -4, top: -4, background: '#7a5638',
        transform: 'translateZ(0px)' }} />
      <div style={{ position: 'absolute', width: r, height: r, left: -r / 2, top: -r / 2, borderRadius: '50%',
        background: `radial-gradient(circle at 38% 32%, ${s.foliage2}, ${s.foliage})`,
        transform: `translateZ(${small ? 34 : 48}px)`, boxShadow: '0 0 0 1px rgba(0,0,0,.08)' }} />
    </div>
  );
}

Object.assign(window, { STYLES, STYLE_LIST, styleGradient, AIRender, FloorPlan, Iso3D });
