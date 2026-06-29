/* global React */
const { useState, useRef, useEffect, useCallback } = React;

/* ---------- Icons (simple geometric strokes) ---------- */
const PATHS = {
  home:    'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6',
  ruler:   'M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4',
  wallet:  'M3 7h15a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 7l2-3h11l2 3M17 13h.5',
  palette: 'M12 3a9 9 0 100 18c1.5 0 2-1 2-2 0-1.5 1-2 2.5-2H19a3 3 0 003-3c0-5-5-9-10-9zM7.5 12.5h.01M10 8h.01M15 8h.01',
  wand:    'M5 19l9-9M14 6l1.5-1.5M18 10l1.5-.5M9 5l.5-1.5M19 15l1 .5M15 4.5l4.5 4.5L8 21H3v-5z',
  camera:  'M3 8a2 2 0 012-2h2l1.5-2h7L18 6h1a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2zM12 16a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
  share:   'M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  check:   'M5 12l5 5L20 6',
  arrowR:  'M5 12h14M13 6l6 6-6 6',
  arrowL:  'M19 12H5M11 6l-6 6 6 6',
  refresh: 'M3 12a9 9 0 0115.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 01-15.5 6.3L3 16M3 21v-5h5',
  download:'M12 3v12M7 11l5 5 5-5M5 21h14',
  fb:      'M14 8h2.5V4.5H14a3.5 3.5 0 00-3.5 3.5v2.5H8V14h2.5v6h3.5v-6h2.5l.5-3.5H14V8.5z',
  ig:      'M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zM12 16a4 4 0 100-8 4 4 0 000 8zM17.5 6.5h.01',
  story:   'M12 3a9 9 0 100 18M12 3a9 9 0 010 18M12 3v18',
  plus:    'M12 5v14M5 12h14',
  minus:   'M5 12h14',
  cube:    'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 3v18M4 7.5l8 4.5 8-4.5',
  grid:    'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  image:   'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M9 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  sun:     'M12 7a5 5 0 100 10 5 5 0 000-10zM12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19',
  tree:    'M12 3l5 7h-3l4 5h-4v6h-4v-6H6l4-5H7z',
  bolt:    'M13 2L4 14h6l-1 8 9-12h-6z',
  layers:  'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
  heart:   'M12 20s-7-4.5-9.5-9A4.5 4.5 0 0112 6a4.5 4.5 0 019.5 5C19 15.5 12 20 12 20z',
  zoom:    'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.3-4.3',
  chevR:   'M9 6l6 6-6 6',
  scan:    'M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M7 12h10',
  star:    'M12 3l2.6 6.3L21 10l-5 4.3L17.5 21 12 17.2 6.5 21 8 14.3 3 10l6.4-.7z',
  clock:   'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  doc:     'M7 3h7l5 5v13H7zM14 3v5h5',
  dot:     'M12 12h.01',
  bed:     'M3 17v-5a2 2 0 012-2h14a2 2 0 012 2v5M3 17h18M3 17v3M21 17v3M7 10V8a1 1 0 011-1h3v3',
  car:     'M5 16l1.5-5A2 2 0 018.4 9.6h7.2a2 2 0 011.9 1.4L19 16M3 16h18v3H3zM7 19v1M17 19v1M7 13h10',
  drop:    'M12 3s6 6.5 6 11a6 6 0 11-12 0c0-4.5 6-11 6-11z',
  fence:   'M5 10l2-2 2 2M15 10l2-2 2 2M7 8v11M17 8v11M3 14h18M3 18h18',
  sofa:    'M4 11V8a2 2 0 012-2h12a2 2 0 012 2v3M3 12a2 2 0 014 0v3h10v-3a2 2 0 014 0v6H3zM6 18v2M18 18v2',
  pray:    'M12 3l1 4-1 1-1-1zM7 21a5 5 0 0110 0M12 9v6',
  pool:    'M3 18c2 0 2-1.5 4.5-1.5S10 18 12 18s2-1.5 4.5-1.5S19 18 21 18M3 14c2 0 2-1.5 4.5-1.5S10 14 12 14M7 12V5l4 1M11 12V4l4 1',
  eye:     'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 15a3 3 0 100-6 3 3 0 000 6z',
};
function Icon({ name, size = 20, sw = 2, style, fill = 'none' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={PATHS[name] || PATHS.dot} />
    </svg>
  );
}

/* ---------- Currency helper ---------- */
const rp = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');
const rpShort = (n) => {
  if (n >= 1e9) return 'Rp' + (n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1) + ' M';
  if (n >= 1e6) return 'Rp' + Math.round(n / 1e6) + ' jt';
  return rp(n);
};

/* ---------- Button ---------- */
function Btn({ variant = 'primary', size = '', icon, iconR, children, ...rest }) {
  return (
    <button className={`btn btn-${variant} ${size ? 'btn-' + size : ''}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'lg' ? 20 : 17} />}
      {children}
      {iconR && <Icon name={iconR} size={size === 'lg' ? 20 : 17} />}
    </button>
  );
}

Object.assign(window, { Icon, Btn, rp, rpShort, useState, useRef, useEffect, useCallback });
