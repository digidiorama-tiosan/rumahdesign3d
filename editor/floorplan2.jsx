/* global React */
/* ============================================================
   FloorPlan v2 — denah berwarna meniru referensi (top-down).
   Override window.FloorPlan (dipakai editor). Tanpa SVG rumit:
   semua furnitur = div rounded + radial-gradient.
   ============================================================ */
(function () {
  const WALL = '#23211e';
  const FLOOR = '#ece5d8';
  const FLOOR2 = '#e6ddcd';
  const WOOD = '#a07d4d';
  const WOOD2 = '#b89465';
  const WOODSOFT = '#caa877';
  const TILE = '#cfe0e6';
  const TILE_LINE = 'rgba(120,150,160,.35)';
  const GARAGE = '#cfccc6';
  const GRASS = '#7aa64f';
  const PLANT = '#5d8a3f';
  const DIMC = '#4a4640';

  const px = (v) => v + '%';

  // ---- furniture primitives ----
  const Bed = ({ wide }) => (
    <div style={{ position: 'absolute', inset: wide ? '14% 8% 30% 8%' : '12% 14% 26% 14%' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#f3f0ea', borderRadius: 5, boxShadow: 'inset 0 0 0 1.5px #cbb48f' }}></div>
      <div style={{ position: 'absolute', top: '6%', left: '8%', right: '8%', height: '26%', display: 'flex', gap: '8%' }}>
        {(wide ? [0, 1] : [0]).map(i => <div key={i} style={{ flex: 1, background: '#fff', borderRadius: 4, boxShadow: 'inset 0 0 0 1px #d8cbb0' }}></div>)}
      </div>
      <div style={{ position: 'absolute', top: 0, left: '-6%', width: '6%', bottom: '64%', background: WOOD2, borderRadius: 2 }}></div>
    </div>
  );
  const Wardrobe = () => <div style={{ position: 'absolute', left: '6%', right: '6%', bottom: '6%', height: '15%', background: `repeating-linear-gradient(90deg, ${WOOD} 0 9px, ${WOOD2} 9px 18px)`, borderRadius: 3, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)' }}></div>;
  const Sofa = () => (
    <React.Fragment>
      <div style={{ position: 'absolute', right: '6%', top: '20%', bottom: '14%', width: '20%', background: '#cfd3d6', borderRadius: '6px', boxShadow: 'inset 0 0 0 1.5px #aab0b4' }}></div>
      <div style={{ position: 'absolute', right: '6%', bottom: '6%', width: '60%', height: '16%', background: '#cfd3d6', borderRadius: 6, boxShadow: 'inset 0 0 0 1.5px #aab0b4' }}></div>
      <div style={{ position: 'absolute', left: '14%', top: '34%', width: '34%', height: '30%', background: WOOD, borderRadius: 4, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.2)' }}></div>
      <Plant x="10%" y="10%" />
    </React.Fragment>
  );
  const Car = () => (
    <div style={{ position: 'absolute', inset: '8% 18%', background: 'linear-gradient(180deg,#fdfdfd,#e3e3e3)', borderRadius: '22px / 14px', boxShadow: '0 2px 6px rgba(0,0,0,.25), inset 0 0 0 1.5px #c6c6c6' }}>
      <div style={{ position: 'absolute', inset: '12% 16% 40%', background: '#2c3138', borderRadius: '12px 12px 6px 6px' }}></div>
      <div style={{ position: 'absolute', left: '20%', right: '20%', bottom: '12%', height: '18%', background: '#3a4047', borderRadius: 5 }}></div>
    </div>
  );
  const Dining = () => (
    <React.Fragment>
      <div style={{ position: 'absolute', left: '50%', top: '52%', width: '46%', height: '30%', transform: 'translate(-50%,-50%)', background: WOOD, borderRadius: '50%/40%', boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,.2)' }}></div>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy], i) => (
        <div key={i} style={{ position: 'absolute', left: `calc(50% + ${dx * 26}%)`, top: `calc(52% + ${dy * 20}%)`, width: 12, height: 12, transform: 'translate(-50%,-50%)', background: WOODSOFT, borderRadius: 3 }}></div>
      ))}
    </React.Fragment>
  );
  const Kitchen = () => (
    <React.Fragment>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '16%', background: 'linear-gradient(180deg,#dcdcdc,#cdcdcd)', boxShadow: 'inset 0 -1px 0 #b3b3b3' }}></div>
      <div style={{ position: 'absolute', top: '3%', left: '14%', width: '26%', height: '9%', background: '#9aa6ac', borderRadius: 3 }}></div>
      <div style={{ position: 'absolute', top: 0, right: 0, width: '16%', bottom: '38%', background: 'linear-gradient(90deg,#d2d2d2,#c4c4c4)' }}></div>
      <div style={{ position: 'absolute', top: '3%', right: '2%', width: '11%', height: '12%', background: '#2f3338', borderRadius: '50%', boxShadow: '0 0 0 3px #4a4f55' }}></div>
    </React.Fragment>
  );
  const Toilet = () => (
    <React.Fragment>
      <div style={{ position: 'absolute', left: '14%', top: '22%', width: '26%', height: '40%', background: '#fff', borderRadius: '40% 40% 50% 50%', boxShadow: 'inset 0 0 0 1.5px #9fc0cb' }}></div>
      <div style={{ position: 'absolute', right: '10%', top: '14%', width: '34%', height: '70%', background: 'rgba(255,255,255,.5)', borderRadius: 4, boxShadow: 'inset 0 0 0 1.5px #9fc0cb' }}></div>
    </React.Fragment>
  );
  const Desk = () => (
    <React.Fragment>
      <div style={{ position: 'absolute', left: '8%', bottom: '8%', width: '40%', height: '16%', background: WOOD, borderRadius: 3 }}></div>
      <div style={{ position: 'absolute', left: '20%', bottom: '26%', width: 13, height: 13, background: '#3a4047', borderRadius: '50%' }}></div>
      <Plant x="10%" y="22%" s={.7} />
    </React.Fragment>
  );
  const Plant = ({ x, y, s = 1 }) => (
    <div style={{ position: 'absolute', left: x, top: y, width: 22 * s, height: 22 * s, borderRadius: '50%', background: `radial-gradient(circle at 38% 32%, #7bb255, ${PLANT})`, boxShadow: 'inset -3px -4px 6px rgba(0,0,0,.2)' }}></div>
  );

  function Room({ x, y, w, h, bg, label, dim, children, tile }) {
    return (
      <div style={{ position: 'absolute', left: px(x), top: px(y), width: px(w), height: px(h),
        background: tile ? `${bg}` : bg,
        backgroundImage: tile ? `linear-gradient(${TILE_LINE} 1px,transparent 1px),linear-gradient(90deg,${TILE_LINE} 1px,transparent 1px)` : 'none',
        backgroundSize: tile ? '14px 14px' : 'auto',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.07)', overflow: 'hidden' }}>
        {children}
        {label && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 5, display: 'grid', placeItems: 'center' }}>
            <div style={{ display: 'inline-block', background: 'rgba(251,250,247,.72)', borderRadius: 6, padding: '3px 8px', backdropFilter: 'blur(1px)' }}>
              <div style={{ fontSize: 'clamp(7px,1.05vw,12px)', fontWeight: 800, color: '#3a352f', letterSpacing: '.02em', lineHeight: 1.15 }}>{label}</div>
              {dim && <div style={{ fontSize: 'clamp(6px,.9vw,10.5px)', fontWeight: 700, color: '#7a7064', marginTop: 1 }}>{dim}</div>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // dimension chain tick text
  function DimText({ children, style }) {
    return <div style={{ position: 'absolute', fontSize: 'clamp(6px,.85vw,11px)', fontWeight: 700, color: DIMC, background: '#fbfaf7', padding: '0 3px', ...style }}>{children}</div>;
  }

  function FloorPlan({ width = 6, length = 12, rooms, compact = false }) {
    const W = width || 6, L = length || 12;
    // house occupies top ~86% ; teras+taman bottom
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#fbfaf7', display: 'grid', placeItems: 'center', padding: compact ? '14px 12px' : '40px 48px' }}>
        <div style={{ position: 'relative', height: '100%', maxWidth: '100%', aspectRatio: `${W} / ${L + 1.6}` }}>

          {/* ---- dimension chains ---- */}
          {!compact && <React.Fragment>
            {/* top */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: -22, height: 14, borderLeft: `1px solid ${DIMC}`, borderRight: `1px solid ${DIMC}` }}>
              <div style={{ position: 'absolute', top: 7, left: 0, right: 0, height: 1, background: DIMC }}></div>
              <div style={{ position: 'absolute', top: 0, left: '50%', bottom: 0, width: 1, background: DIMC }}></div>
              <DimText style={{ top: 1, left: '25%', transform: 'translateX(-50%)' }}>{(W / 2).toFixed(2)} m</DimText>
              <DimText style={{ top: 1, left: '75%', transform: 'translateX(-50%)' }}>{(W / 2).toFixed(2)} m</DimText>
              <DimText style={{ top: -16, left: '50%', transform: 'translateX(-50%)' }}>{W.toFixed(2)} m</DimText>
            </div>
            {/* left */}
            <div style={{ position: 'absolute', top: 0, bottom: '12.5%', left: -26, width: 14, borderTop: `1px solid ${DIMC}`, borderBottom: `1px solid ${DIMC}` }}>
              <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 1, background: DIMC }}></div>
              <DimText style={{ left: -4, top: '50%', transform: 'translate(-50%,-50%) rotate(-90deg)' }}>{L.toFixed(2)} m</DimText>
            </div>
            {/* right segments */}
            <div style={{ position: 'absolute', top: 0, bottom: '12.5%', right: -26, width: 14, borderTop: `1px solid ${DIMC}`, borderBottom: `1px solid ${DIMC}` }}>
              <div style={{ position: 'absolute', right: 7, top: 0, bottom: 0, width: 1, background: DIMC }}></div>
              {[['3.00', '14%'], ['1.50', '37%'], ['2.50', '55%'], ['3.00', '82%']].map(([t, p], i) => (
                <DimText key={i} style={{ right: -2, top: p, transform: 'translate(50%,-50%) rotate(-90deg)' }}>{t}</DimText>
              ))}
            </div>
          </React.Fragment>}

          {/* ---- the lot ---- */}
          <div style={{ position: 'absolute', inset: 0 }}>
            {/* TAMAN / garden (paling belakang) */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: '87.5%', height: '12.5%', background: `linear-gradient(180deg,${GRASS},#6b974a)` }}>
              <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(92deg,rgba(0,0,0,.06) 0 2px,transparent 2px 8px)' }}></div>
              <Plant x="6%" y="38%" s={1.6} /><Plant x="14%" y="55%" s={1.2} /><Plant x="22%" y="42%" s={1.3} />
              <Plant x="80%" y="30%" s={1.8} /><Plant x="88%" y="55%" s={1.2} /><Plant x="72%" y="58%" s={1.1} />
              {!compact && <div style={{ position: 'absolute', left: '8%', top: '52%', fontSize: 'clamp(6px,.85vw,10px)', fontWeight: 800, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>TAMAN</div>}
            </div>
            {/* house outer wall block (top 87.5%) */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '87.5%', background: WALL, borderRadius: 2 }}>
              {/* interior inset */}
              <div style={{ position: 'absolute', inset: '2.4% 1.6%', background: FLOOR }}>
                {/* DAPUR — belakang, lebar penuh (belakang-kanan = area masak) */}
                <Room x={0} y={0} w={100} h={30} bg={FLOOR2} label="DAPUR" dim="3.00 x 4.00"><Kitchen /><Dining /></Room>
                {/* corridor center (tengah → depan) */}
                <div style={{ position: 'absolute', left: '47%', top: '30%', width: '6%', bottom: 0, background: FLOOR2 }}></div>

                {/* LEFT column */}
                <Room x={0} y={30} w={47} h={30} bg={FLOOR2} label="KAMAR TIDUR 2" dim="3.00 x 2.50"><Bed /><Wardrobe /></Room>
                <Room x={0} y={60} w={47} h={40} bg={FLOOR} label="KAMAR TIDUR UTAMA" dim="3.00 x 4.00"><Bed wide /><Wardrobe /></Room>

                {/* RIGHT column */}
                <Room x={53} y={30} w={47} h={16} bg={TILE} tile label="KAMAR MANDI" dim="2.00 x 1.50"><Toilet /></Room>
                <Room x={53} y={46} w={47} h={24} bg={FLOOR} label="KAMAR TIDUR 3" dim="3.00 x 2.50"><Bed /><Desk /></Room>
                <Room x={53} y={70} w={47} h={30} bg={FLOOR} label="RUANG TAMU" dim="3.00 x 4.00"><Sofa /></Room>

                {/* doors (arcs) */}
                <Arc x="46%" y="34%" /><Arc x="46%" y="64%" /><Arc x="49%" y="74%" />
              </div>
            </div>

            {/* TERAS */}
            <div style={{ position: 'absolute', left: '40%', width: '34%', top: '87.5%', height: '7%', background: FLOOR2, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08)' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 'clamp(6px,.85vw,10px)', fontWeight: 800, color: '#6a6256' }}>{compact ? '' : 'TERAS'}</div>
            </div>
            {/* steps */}
            <div style={{ position: 'absolute', left: '50%', top: '94.5%', width: '8%', height: '5.5%', transform: 'translateX(-50%)', background: `repeating-linear-gradient(90deg,#cfc7b8 0 4px,#bdb4a3 4px 8px)` }}></div>
            {/* CARPORT (halaman depan, kiri) */}
            <div style={{ position: 'absolute', left: '2%', width: '32%', top: '87.5%', height: '11.5%', background: '#cfccc6', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.14)' }}>
              <Car />
              {!compact && <div style={{ position: 'absolute', left: 4, top: 3, fontSize: 'clamp(5px,.75vw,9px)', fontWeight: 800, color: '#5a5249', zIndex: 4 }}>CARPORT</div>}
            </div>
          </div>

          {/* scale bar */}
          {!compact && (
            <div style={{ position: 'absolute', right: 0, bottom: -34, textAlign: 'right' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: DIMC, marginBottom: 3 }}>SKALA 1:100</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, justifyContent: 'flex-end' }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 18, height: 6, background: i % 2 ? '#fff' : DIMC, boxShadow: `inset 0 0 0 1px ${DIMC}` }}></div>)}
                <span style={{ fontSize: 8, fontWeight: 700, color: DIMC, marginLeft: 4 }}>3 m</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  function Arc({ x, y }) {
    return <div style={{ position: 'absolute', left: x, top: y, width: 16, height: 16, borderTop: `1.5px solid #b98e52`, borderRight: `1.5px solid #b98e52`, borderRadius: '0 100% 0 0', opacity: .7, zIndex: 4 }}></div>;
  }

  window.FloorPlan = FloorPlan;
})();
